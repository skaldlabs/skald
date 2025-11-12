/**
 * Subscription Service
 * Encapsulates all Stripe subscription logic.
 */

import Stripe from 'stripe'
import { STRIPE_SECRET_KEY } from '@/settings'
import { Organization } from '@/entities/Organization'
import { OrganizationSubscription } from '@/entities/OrganizationSubscription'
import { Plan } from '@/entities/Plan'
import { UsageRecord } from '@/entities/UsageRecord'
import { DI } from '@/di'
import { EntityManager } from '@mikro-orm/core'
import { logger } from '@/lib/logger'
import { CachedQueries } from '@/queries/cachedQueries'

/**
 * Subscription status enum matching Django SubscriptionStatus
 */
export enum SubscriptionStatus {
    ACTIVE = 'active',
    PAST_DUE = 'past_due',
    CANCELED = 'canceled',
    INCOMPLETE = 'incomplete',
    INCOMPLETE_EXPIRED = 'incomplete_expired',
    TRIALING = 'trialing',
    UNPAID = 'unpaid',
}

interface CheckoutSessionParams {
    organization: Organization
    planSlug: string
    successUrl: string
    cancelUrl: string
}

interface CustomerPortalParams {
    organization: Organization
    returnUrl: string
}

interface ChangePlanParams {
    organization: Organization
    newPlanSlug: string
}

class SubscriptionService {
    private stripe: Stripe | null = null

    constructor() {
        if (STRIPE_SECRET_KEY) {
            this.stripe = new Stripe(STRIPE_SECRET_KEY)
        } else {
            logger.warn('STRIPE_SECRET_KEY not configured')
        }
    }

    /**
     * Create Stripe Checkout session for plan subscription.
     * Creates Stripe Customer if doesn't exist.
     */
    async createCheckoutSession({
        organization,
        planSlug,
        successUrl,
        cancelUrl,
    }: CheckoutSessionParams): Promise<Stripe.Checkout.Session> {
        if (!this.stripe) {
            throw new Error('Stripe is not configured')
        }

        const plan = await DI.plans.findOne({ slug: planSlug, isActive: true })
        if (!plan) {
            throw new Error(`Plan ${planSlug} not found or not active`)
        }

        if (!plan.stripe_price_id) {
            throw new Error(`Plan ${planSlug} does not have a Stripe price ID configured`)
        }

        const customerId = await this.getOrCreateStripeCustomer(organization)

        const checkoutSession = await this.stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: plan.stripe_price_id,
                    quantity: 1,
                },
            ],
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                organization_id: organization.uuid,
                plan_slug: planSlug,
            },
        })

        return checkoutSession
    }

    /**
     * Create Stripe Customer Portal session for managing subscription
     */
    async createCustomerPortalSession({
        organization,
        returnUrl,
    }: CustomerPortalParams): Promise<Stripe.BillingPortal.Session> {
        if (!this.stripe) {
            throw new Error('Stripe is not configured')
        }

        const subscription = await DI.organizationSubscriptions.findOne({
            organization: organization.uuid,
        })

        if (!subscription?.stripe_customer_id) {
            throw new Error('Organization does not have a Stripe customer')
        }

        const portalSession = await this.stripe.billingPortal.sessions.create({
            customer: subscription.stripe_customer_id,
            return_url: returnUrl,
        })

        return portalSession
    }

    /**
     * Change organization's plan.
     * Handles both Stripe-managed and free plan transitions.
     */
    async changePlan(
        { organization, newPlanSlug }: ChangePlanParams,
        em?: EntityManager
    ): Promise<OrganizationSubscription> {
        if (!this.stripe) {
            throw new Error('Stripe is not configured')
        }

        const entityManager = em || DI.em.fork()

        const newPlan = await entityManager.findOne(Plan, { slug: newPlanSlug, isActive: true })
        if (!newPlan) {
            throw new Error(`Plan ${newPlanSlug} not found or not active`)
        }

        const subscription = await entityManager.findOne(OrganizationSubscription, {
            organization: organization.uuid,
        })
        if (!subscription) {
            throw new Error('Organization subscription not found')
        }

        // Populate the plan and scheduled_plan relations
        await entityManager.populate(subscription, ['plan', 'scheduled_plan'])

        // Check if there's already a scheduled plan change
        if (subscription.scheduled_plan) {
            const changeDate = subscription.scheduled_change_date
                ? new Date(subscription.scheduled_change_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                  })
                : 'unknown date'
            throw new Error(
                `A plan change to ${subscription.scheduled_plan.name} is already scheduled for ${changeDate}. ` +
                    'Please contact support to cancel the scheduled plan change.'
            )
        }

        const newPlanPrice = parseFloat(newPlan.monthly_price)
        const currentPlanPrice = parseFloat(subscription.plan.monthly_price)

        // Free plan -> Paid plan: Create checkout session (handled by frontend)
        if (!subscription.stripe_subscription_id && newPlanPrice > 0) {
            throw new Error('Use checkout session to upgrade from free plan')
        }

        // Paid plan -> Free plan: Cancel Stripe subscription
        if (subscription.stripe_subscription_id && newPlanPrice === 0) {
            await this.stripe.subscriptions.update(subscription.stripe_subscription_id, {
                cancel_at_period_end: true,
            })
            subscription.cancel_at_period_end = true
            await entityManager.persistAndFlush(subscription)
            return subscription
        }

        // Paid plan -> Different paid plan downgrade: Schedule change for end of period
        if (subscription.stripe_subscription_id && newPlanPrice < currentPlanPrice) {
            const schedule = await this.stripe.subscriptionSchedules.create({
                from_subscription: subscription.stripe_subscription_id,
            })

            await this.stripe.subscriptionSchedules.update(schedule.id, {
                phases: [
                    {
                        items: [
                            {
                                price: subscription.plan.stripe_price_id!,
                                quantity: 1,
                            },
                        ],
                        start_date: Math.floor(subscription.current_period_start.getTime() / 1000),
                        end_date: Math.floor(subscription.current_period_end.getTime() / 1000),
                    },
                    {
                        items: [
                            {
                                price: newPlan.stripe_price_id!,
                                quantity: 1,
                            },
                        ],
                        start_date: Math.floor(subscription.current_period_end.getTime() / 1000),
                    },
                ],
            })

            // Track the schedule in our database
            subscription.stripe_schedule_id = schedule.id as string | undefined
            subscription.scheduled_plan = newPlan
            subscription.scheduled_change_date = subscription.current_period_end
            await entityManager.persistAndFlush(subscription)
            return subscription
        }

        // Paid plan -> Different paid plan upgrade: Immediate upgrade with proration
        if (subscription.stripe_subscription_id && newPlanPrice > currentPlanPrice) {
            const stripeSubscription = await this.stripe.subscriptions.retrieve(subscription.stripe_subscription_id)

            await this.stripe.subscriptions.update(subscription.stripe_subscription_id, {
                items: [
                    {
                        id: stripeSubscription.items.data[0].id,
                        price: newPlan.stripe_price_id!,
                    },
                ],
                proration_behavior: 'always_invoice', // Immediate proration
            })

            subscription.plan = newPlan
            await entityManager.persistAndFlush(subscription)
        }

        return subscription
    }

    /**
     * Cancel a scheduled plan change.
     */
    async cancelScheduledPlanChange(organization: Organization, em?: EntityManager): Promise<OrganizationSubscription> {
        if (!this.stripe) {
            throw new Error('Stripe is not configured')
        }

        const entityManager = em || DI.em.fork()

        const subscription = await entityManager.findOne(OrganizationSubscription, {
            organization: organization.uuid,
        })
        if (!subscription) {
            throw new Error('Organization subscription not found')
        }

        if (!subscription.scheduled_plan) {
            throw new Error('No scheduled plan change to cancel')
        }

        if (!subscription.stripe_schedule_id) {
            throw new Error('No Stripe schedule found')
        }

        await this.stripe.subscriptionSchedules.release(subscription.stripe_schedule_id)

        subscription.stripe_schedule_id = undefined
        subscription.scheduled_plan = undefined
        subscription.scheduled_change_date = undefined
        await entityManager.persistAndFlush(subscription)

        return subscription
    }

    /**
     * Create default free subscription for a new organization
     */
    async createDefaultSubscription(organization: Organization, em?: EntityManager): Promise<OrganizationSubscription> {
        const entityManager = em || DI.em.fork()

        const freePlan = await entityManager.findOne(Plan, { isDefault: true })
        if (!freePlan) {
            throw new Error('Default free plan not found. Please run migrations and load fixtures.')
        }

        const now = new Date()
        const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now

        const subscription = entityManager.create(OrganizationSubscription, {
            organization,
            plan: freePlan,
            status: SubscriptionStatus.ACTIVE,
            current_period_start: now,
            current_period_end: periodEnd,
            cancel_at_period_end: false,
            created_at: now,
            updated_at: now,
        })

        await entityManager.persistAndFlush(subscription)
        logger.info({ organizationName: organization.name }, 'Created default subscription for organization')

        return subscription
    }

    /**
     * Get existing or create new Stripe customer for organization
     */
    private async getOrCreateStripeCustomer(organization: Organization): Promise<string> {
        if (!this.stripe) {
            throw new Error('Stripe is not configured')
        }

        const em = DI.em.fork()
        const subscription = await em.findOne(OrganizationSubscription, {
            organization: organization.uuid,
        })

        if (!subscription) {
            throw new Error('Organization subscription not found')
        }

        if (subscription.stripe_customer_id) {
            return subscription.stripe_customer_id
        }

        // Populate the organization owner
        await em.populate(organization, ['owner'])

        const customer = await this.stripe.customers.create({
            email: organization.owner.email,
            name: organization.name,
            metadata: {
                organization_id: organization.uuid,
                organization_name: organization.name,
            },
        })

        subscription.stripe_customer_id = customer.id
        await em.persistAndFlush(subscription)

        return customer.id
    }

    /**
     * Get the default payment method for a Stripe customer.
     * Returns payment method ID if found, null otherwise.
     */
    private async getDefaultPaymentMethod(customerId: string): Promise<string | null> {
        if (!this.stripe) {
            throw new Error('Stripe is not configured')
        }

        try {
            const customer = await this.stripe.customers.retrieve(customerId)

            if (customer.deleted) {
                logger.warn({ customerId }, 'Customer is deleted')
                return null
            }

            // Check for invoice_settings.default_payment_method first
            if ('invoice_settings' in customer && customer.invoice_settings?.default_payment_method) {
                return typeof customer.invoice_settings.default_payment_method === 'string'
                    ? customer.invoice_settings.default_payment_method
                    : customer.invoice_settings.default_payment_method.id
            }

            // Fallback to default_source
            if ('default_source' in customer && customer.default_source) {
                return typeof customer.default_source === 'string'
                    ? customer.default_source
                    : customer.default_source.id
            }

            // Try to get the most recent payment method
            const paymentMethods = await this.stripe.paymentMethods.list({
                customer: customerId,
                type: 'card',
                limit: 1,
            })

            if (paymentMethods.data.length > 0) {
                return paymentMethods.data[0].id
            }

            return null
        } catch (error) {
            logger.warn({ customerId, err: error }, 'Error retrieving payment method for customer')
            return null
        }
    }

    /**
     * Try to create a subscription using a saved payment method.
     *
     * Returns:
     *   { success: true, subscription } if successful
     *   { success: false, error: string } if failed
     */
    async tryCreateSubscriptionWithSavedPayment(
        organization: Organization,
        planSlug: string,
        em?: EntityManager
    ): Promise<{ success: boolean; subscription?: OrganizationSubscription; error?: string }> {
        if (!this.stripe) {
            return { success: false, error: 'Stripe is not configured' }
        }

        try {
            const entityManager = em || DI.em.fork()

            const plan = await entityManager.findOne(Plan, { slug: planSlug, isActive: true })
            if (!plan) {
                return { success: false, error: `Plan ${planSlug} not found or not active` }
            }

            const subscription = await entityManager.findOne(OrganizationSubscription, {
                organization: organization.uuid,
            })
            if (!subscription) {
                return { success: false, error: 'Organization subscription not found' }
            }

            // Check if organization has a Stripe customer
            if (!subscription.stripe_customer_id) {
                return { success: false, error: 'No Stripe customer found' }
            }

            // Check for saved payment method
            const paymentMethodId = await this.getDefaultPaymentMethod(subscription.stripe_customer_id)

            if (!paymentMethodId) {
                return { success: false, error: 'No saved payment method found' }
            }

            // Attempt to create subscription with saved payment method
            const stripeSubscription = await this.stripe.subscriptions.create({
                customer: subscription.stripe_customer_id,
                items: [{ price: plan.stripe_price_id! }],
                default_payment_method: paymentMethodId,
                metadata: {
                    organization_id: organization.uuid,
                    plan_slug: planSlug,
                },
            })

            if (!stripeSubscription.id) {
                logger.error({ stripeSubscription }, 'Invalid subscription response')
                return { success: false, error: 'Failed to create subscription' }
            }

            const periodStart = stripeSubscription.items.data[0].current_period_start
            const periodEnd = stripeSubscription.items.data[0].current_period_end

            subscription.stripe_subscription_id = stripeSubscription.id
            subscription.plan = plan
            subscription.status = stripeSubscription.status || SubscriptionStatus.ACTIVE
            subscription.current_period_start = new Date(periodStart * 1000)
            subscription.current_period_end = new Date(periodEnd * 1000)
            await entityManager.persistAndFlush(subscription)

            // Create usage record
            const periodStartDate = subscription.current_period_start.toISOString().split('T')[0]
            const periodEndDate = subscription.current_period_end.toISOString().split('T')[0]

            const existingUsageRecord = await entityManager.findOne(UsageRecord, {
                organization: organization.uuid,
                billing_period_start: periodStartDate,
            })

            if (!existingUsageRecord) {
                const usageRecord = entityManager.create(UsageRecord, {
                    organization,
                    billing_period_start: periodStartDate,
                    billing_period_end: periodEndDate,
                    memo_operations_count: 0,
                    chat_queries_count: 0,
                    alerts_sent: {},
                    created_at: new Date(),
                    updated_at: new Date(),
                })
                await entityManager.persistAndFlush(usageRecord)
            }

            logger.info(
                { organizationName: organization.name },
                'Successfully created subscription with saved payment method'
            )
            return { success: true, subscription }
        } catch (error: any) {
            if (error.type === 'StripeCardError') {
                logger.warn(
                    { organizationName: organization.name, errorMessage: error.message },
                    'Card error when creating subscription'
                )
                return { success: false, error: `Payment failed: ${error.message}` }
            } else if (error.type && error.type.includes('Stripe')) {
                logger.warn(
                    { organizationName: organization.name, errorMessage: error.message },
                    'Stripe error when creating subscription'
                )
                return { success: false, error: `Payment processing error: ${error.message}` }
            } else {
                logger.error(
                    { organizationName: organization.name, err: error },
                    'Unexpected error creating subscription'
                )
                return { success: false, error: `Unexpected error: ${error.message || 'Unknown error'}` }
            }
        }
    }

    // ==================== Webhook Handlers ====================

    /**
     * Handle successful checkout completion
     */
    async handleCheckoutCompleted(event: Stripe.Event, em?: EntityManager): Promise<void> {
        const session = event.data.object as Stripe.Checkout.Session
        const orgId = session.metadata?.organization_id

        if (!orgId) {
            throw new Error('No organization_id in checkout session metadata')
        }

        const entityManager = em || DI.em.fork()
        const organization = await entityManager.findOne(Organization, { uuid: orgId })

        if (!organization) {
            throw new Error(`Organization ${orgId} not found`)
        }

        // Stripe will send subscription.created event, just log here
        logger.info({ organizationName: organization.name }, 'Checkout completed')
    }

    /**
     * Handle new subscription creation
     */
    async handleSubscriptionCreated(event: Stripe.Event, em?: EntityManager): Promise<void> {
        try {
            const stripeSubscription = event.data.object as Stripe.Subscription
            logger.info({ subscriptionId: stripeSubscription.id }, 'Processing subscription.created event')

            const customerId = stripeSubscription.customer
            if (!customerId || typeof customerId !== 'string') {
                logger.error({ stripeSubscription }, 'No customer_id in subscription')
                throw new Error('No customer_id found in subscription event')
            }

            const entityManager = em || DI.em.fork()
            const subscription = await entityManager.findOne(OrganizationSubscription, {
                stripe_customer_id: customerId,
            })

            if (!subscription) {
                throw new Error(`Subscription not found for customer ${customerId}`)
            }

            const priceId = stripeSubscription.items.data[0].price.id
            const plan = await entityManager.findOne(Plan, { stripe_price_id: priceId })

            if (!plan) {
                throw new Error(`Plan not found for price ID ${priceId}`)
            }

            if (plan.slug !== 'free') {
                // with a new subscription the org is no longer hitting the usage limit so we need to clear the cache
                await CachedQueries.clearOrganizationUsageCache(subscription.organization.uuid)
            }

            subscription.stripe_subscription_id = stripeSubscription.id
            subscription.plan = plan
            subscription.status = stripeSubscription.status || SubscriptionStatus.ACTIVE

            const periodStart = stripeSubscription.items.data[0].current_period_start
            const periodEnd = stripeSubscription.items.data[0].current_period_end

            subscription.current_period_start = new Date(periodStart * 1000)
            subscription.current_period_end = new Date(periodEnd * 1000)
            await entityManager.persistAndFlush(subscription)

            // Create usage record
            const periodStartDate = subscription.current_period_start.toISOString().split('T')[0]
            const periodEndDate = subscription.current_period_end.toISOString().split('T')[0]

            await entityManager.populate(subscription, ['organization'])

            const existingUsageRecord = await entityManager.findOne(UsageRecord, {
                organization: subscription.organization.uuid,
                billing_period_start: periodStartDate,
            })

            if (!existingUsageRecord) {
                const usageRecord = entityManager.create(UsageRecord, {
                    organization: subscription.organization,
                    billing_period_start: periodStartDate,
                    billing_period_end: periodEndDate,
                    memo_operations_count: 0,
                    chat_queries_count: 0,
                    alerts_sent: {},
                    created_at: new Date(),
                    updated_at: new Date(),
                })
                await entityManager.persistAndFlush(usageRecord)
            }

            logger.info({ organizationName: subscription.organization.name }, 'Subscription created successfully')
        } catch (error) {
            logger.error({ err: error }, 'Error in handle_subscription_created')
            throw error
        }
    }

    /**
     * Handle subscription updates (plan changes, renewals)
     */
    async handleSubscriptionUpdated(event: Stripe.Event, em?: EntityManager): Promise<void> {
        try {
            const stripeSubscription = event.data.object as Stripe.Subscription
            logger.info({ subscriptionId: stripeSubscription.id }, 'Processing subscription.updated event')

            const entityManager = em || DI.em.fork()
            const subscription = await entityManager.findOne(OrganizationSubscription, {
                stripe_subscription_id: stripeSubscription.id,
            })

            if (!subscription) {
                throw new Error(`Subscription not found for Stripe subscription ${stripeSubscription.id}`)
            }

            subscription.status = stripeSubscription.status || subscription.status

            const periodStart = stripeSubscription.items.data[0].current_period_start
            const periodEnd = stripeSubscription.items.data[0].current_period_end

            subscription.current_period_start = new Date(periodStart * 1000)
            subscription.current_period_end = new Date(periodEnd * 1000)

            subscription.cancel_at_period_end = stripeSubscription.cancel_at_period_end || false

            const priceId = stripeSubscription.items.data[0].price.id
            const newPlan = await entityManager.findOne(Plan, { stripe_price_id: priceId })

            if (!newPlan) {
                throw new Error(`Plan not found for price ID ${priceId}`)
            }

            if (newPlan.slug !== 'free') {
                // with a new subscription the org is no longer hitting the usage limit so we need to clear the cache
                await CachedQueries.clearOrganizationUsageCache(subscription.organization.uuid)
            }

            await entityManager.populate(subscription, ['plan'])

            if (subscription.plan.id !== newPlan.id) {
                logger.info({ oldPlan: subscription.plan.name, newPlan: newPlan.name }, 'Plan changed')
                subscription.plan = newPlan
            }

            await entityManager.persistAndFlush(subscription)

            // Check if billing period changed
            const previousAttributes = (event.data as any).previous_attributes
            if (previousAttributes && 'current_period_start' in previousAttributes) {
                const periodStartDate = subscription.current_period_start.toISOString().split('T')[0]
                const periodEndDate = subscription.current_period_end.toISOString().split('T')[0]

                await entityManager.populate(subscription, ['organization'])

                const existingUsageRecord = await entityManager.findOne(UsageRecord, {
                    organization: subscription.organization.uuid,
                    billing_period_start: periodStartDate,
                })

                if (!existingUsageRecord) {
                    const usageRecord = entityManager.create(UsageRecord, {
                        organization: subscription.organization,
                        billing_period_start: periodStartDate,
                        billing_period_end: periodEndDate,
                        memo_operations_count: 0,
                        chat_queries_count: 0,
                        alerts_sent: {},
                        created_at: new Date(),
                        updated_at: new Date(),
                    })
                    await entityManager.persistAndFlush(usageRecord)
                }
            }

            logger.info({ organizationName: subscription.organization.name }, 'Subscription updated successfully')
        } catch (error) {
            logger.error({ err: error }, 'Error in handle_subscription_updated')
            throw error
        }
    }

    /**
     * Handle subscription cancellation
     */
    async handleSubscriptionDeleted(event: Stripe.Event, em?: EntityManager): Promise<void> {
        const stripeSubscription = event.data.object as Stripe.Subscription

        const entityManager = em || DI.em.fork()
        const subscription = await entityManager.findOne(OrganizationSubscription, {
            stripe_subscription_id: stripeSubscription.id,
        })

        if (!subscription) {
            throw new Error(`Subscription not found for Stripe subscription ${stripeSubscription.id}`)
        }

        // Downgrade to free plan
        const freePlan = await entityManager.findOne(Plan, { isDefault: true })
        if (!freePlan) {
            throw new Error('Default free plan not found')
        }

        subscription.plan = freePlan
        subscription.status = SubscriptionStatus.CANCELED
        subscription.canceled_at = new Date()
        await entityManager.persistAndFlush(subscription)

        await entityManager.populate(subscription, ['organization'])
        logger.info({ organizationName: subscription.organization.name }, 'Subscription canceled')
    }

    /**
     * Handle successful payment
     */
    async handleInvoicePaid(event: Stripe.Event): Promise<void> {
        const invoice = event.data.object as Stripe.Invoice
        logger.info({ invoiceId: invoice.id }, 'Invoice paid')
    }

    /**
     * Handle payment failure
     */
    async handlePaymentFailed(event: Stripe.Event, em?: EntityManager): Promise<void> {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer

        if (!customerId || typeof customerId !== 'string') {
            throw new Error('No customer_id in invoice')
        }

        const entityManager = em || DI.em.fork()
        const subscription = await entityManager.findOne(OrganizationSubscription, {
            stripe_customer_id: customerId,
        })

        if (!subscription) {
            throw new Error(`Subscription not found for customer ${customerId}`)
        }

        subscription.status = SubscriptionStatus.PAST_DUE
        await entityManager.persistAndFlush(subscription)

        await entityManager.populate(subscription, ['organization'])
        logger.warn({ organizationName: subscription.organization.name }, 'Payment failed')
    }

    /**
     * Handle subscription schedule updates
     */
    async handleSubscriptionScheduleUpdated(event: Stripe.Event, em?: EntityManager): Promise<void> {
        try {
            const schedule = event.data.object as Stripe.SubscriptionSchedule
            const scheduleId = schedule.id

            const entityManager = em || DI.em.fork()
            const subscription = await entityManager.findOne(OrganizationSubscription, {
                stripe_schedule_id: scheduleId,
            })

            if (!subscription) {
                logger.warn({ scheduleId }, 'No subscription found for schedule')
                return
            }

            const status = schedule.status
            if (status === 'canceled' || status === 'released') {
                subscription.stripe_schedule_id = undefined
                subscription.scheduled_plan = undefined
                subscription.scheduled_change_date = undefined
                await entityManager.persistAndFlush(subscription)

                await entityManager.populate(subscription, ['organization'])
                logger.info(
                    { scheduleId, status, organizationName: subscription.organization.name },
                    'Schedule status updated'
                )
            }
        } catch (error) {
            logger.error({ err: error }, 'Error in handle_subscription_schedule_updated')
            throw error
        }
    }

    /**
     * Handle when a scheduled plan change is completed
     */
    async handleSubscriptionScheduleCompleted(event: Stripe.Event, em?: EntityManager): Promise<void> {
        try {
            const schedule = event.data.object as Stripe.SubscriptionSchedule
            const scheduleId = schedule.id

            const entityManager = em || DI.em.fork()
            const subscription = await entityManager.findOne(OrganizationSubscription, {
                stripe_schedule_id: scheduleId,
            })

            if (!subscription) {
                logger.warn({ scheduleId }, 'No subscription found for schedule')
                return
            }

            subscription.stripe_schedule_id = undefined
            subscription.scheduled_plan = undefined
            subscription.scheduled_change_date = undefined
            await entityManager.persistAndFlush(subscription)

            await entityManager.populate(subscription, ['organization'])
            logger.info({ organizationName: subscription.organization.name }, 'Scheduled plan change completed')
        } catch (error) {
            logger.error({ err: error }, 'Error in handle_subscription_schedule_completed')
            throw error
        }
    }
}

export { SubscriptionService }
