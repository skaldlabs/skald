import express, { Request, Response } from 'express'
import { DI } from '@/di'
import { SubscriptionService } from '@/services/subscriptionService'
import { UsageTrackingService } from '@/services/usageTrackingService'
import { OrganizationMembershipRole } from '@/entities/OrganizationMembership'
import { logger } from '@/lib/logger'
import * as Sentry from '@sentry/node'

export const subscriptionRouter = express.Router({ mergeParams: true })

/**
 * Helper to get organization and check membership
 */
const getOrganizationWithAccess = async (req: Request, requiredRole?: OrganizationMembershipRole) => {
    const user = req.context?.requestUser?.userInstance
    if (!user) {
        throw new Error('Unauthorized')
    }

    const organizationUuid = req.params.organization_uuid
    if (!organizationUuid) {
        throw new Error('Organization UUID is required')
    }

    const organization = await DI.organizations.findOne({ uuid: organizationUuid }, { populate: ['owner'] })
    if (!organization) {
        throw new Error('Organization not found')
    }

    const membership = await DI.organizationMemberships.findOne({
        user: user,
        organization: organization,
    })
    if (!membership) {
        throw new Error('You are not a member of this organization')
    }

    // Check for required role if specified
    if (requiredRole !== undefined && membership.accessLevel !== requiredRole) {
        throw new Error('You do not have permission to perform this action')
    }

    return organization
}

/**
 * Helper to serialize subscription details
 */
const serializeSubscriptionDetail = async (subscription: any) => {
    return {
        uuid: subscription.id.toString(),
        organization: subscription.organization.uuid,
        plan: {
            uuid: subscription.plan.id.toString(),
            slug: subscription.plan.slug,
            name: subscription.plan.name,
            stripe_price_id: subscription.plan.stripe_price_id,
            monthly_price: subscription.plan.monthly_price,
            memo_operations_limit: subscription.plan.memo_operations_limit,
            chat_queries_limit: subscription.plan.chat_queries_limit,
            projects_limit: subscription.plan.projects_limit,
            features: subscription.plan.features,
            is_default: subscription.plan.isDefault,
        },
        stripe_customer_id: subscription.stripe_customer_id || null,
        stripe_subscription_id: subscription.stripe_subscription_id || null,
        status: subscription.status,
        current_period_start: subscription.current_period_start.toISOString(),
        current_period_end: subscription.current_period_end.toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        scheduled_plan: subscription.scheduled_plan
            ? {
                  uuid: subscription.scheduled_plan.id.toString(),
                  slug: subscription.scheduled_plan.slug,
                  name: subscription.scheduled_plan.name,
                  stripe_price_id: subscription.scheduled_plan.stripe_price_id,
                  monthly_price: subscription.scheduled_plan.monthly_price,
                  memo_operations_limit: subscription.scheduled_plan.memo_operations_limit,
                  chat_queries_limit: subscription.scheduled_plan.chat_queries_limit,
                  projects_limit: subscription.scheduled_plan.projects_limit,
                  features: subscription.scheduled_plan.features,
                  is_default: subscription.scheduled_plan.isDefault,
              }
            : null,
        scheduled_change_date: subscription.scheduled_change_date
            ? subscription.scheduled_change_date.toISOString()
            : null,
    }
}

/**
 * GET /api/organization/:organization_uuid/subscription/
 * Get current subscription details for organization
 */
const getSubscription = async (req: Request, res: Response) => {
    try {
        const organization = await getOrganizationWithAccess(req)

        const subscription = await DI.organizationSubscriptions.findOne(
            {
                organization: organization.uuid,
            },
            { populate: ['plan', 'scheduled_plan'] }
        )

        if (!subscription) {
            return res.status(404).json({ error: 'Subscription not found' })
        }

        const serialized = await serializeSubscriptionDetail(subscription)
        res.status(200).json(serialized)
    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return res.status(401).json({ error: error.message })
        }
        if (error.message === 'Organization not found' || error.message === 'Subscription not found') {
            return res.status(404).json({ error: error.message })
        }
        if (error.message === 'You are not a member of this organization') {
            return res.status(403).json({ error: error.message })
        }
        logger.error({ err: error }, 'Error getting subscription')
        res.status(500).json({ error: 'Internal server error' })
    }
}

/**
 * POST /api/organization/:organization_uuid/subscription/checkout/
 * Create Stripe Checkout session for subscribing to a plan
 */
const checkout = async (req: Request, res: Response) => {
    try {
        const organization = await getOrganizationWithAccess(req, OrganizationMembershipRole.OWNER)

        const { plan_slug, success_url, cancel_url } = req.body

        if (!plan_slug || !success_url || !cancel_url) {
            return res.status(400).json({
                error: 'plan_slug, success_url, and cancel_url are required',
            })
        }

        const service = new SubscriptionService()
        const checkoutSession = await service.createCheckoutSession({
            organization,
            planSlug: plan_slug,
            successUrl: success_url,
            cancelUrl: cancel_url,
        })

        res.status(200).json({ checkout_url: checkoutSession.url })
    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return res.status(401).json({ error: error.message })
        }
        if (error.message === 'You do not have permission to perform this action') {
            return res.status(403).json({ error: error.message })
        }
        if (
            error.message.includes('not found') ||
            error.message.includes('not active') ||
            error.message.includes('does not have a Stripe price ID')
        ) {
            return res.status(400).json({ error: error.message })
        }
        logger.error({ err: error }, 'Error creating checkout session')
        res.status(500).json({ error: 'Failed to create checkout session' })
    }
}

/**
 * POST /api/organization/:organization_uuid/subscription/upgrade/
 * Smart upgrade endpoint for free to paid transitions
 */
const upgrade = async (req: Request, res: Response) => {
    try {
        const organization = await getOrganizationWithAccess(req, OrganizationMembershipRole.OWNER)

        const { plan_slug, success_url, cancel_url } = req.body

        if (!plan_slug || !success_url || !cancel_url) {
            return res.status(400).json({
                error: 'plan_slug, success_url, and cancel_url are required',
            })
        }

        const service = new SubscriptionService()

        // Try to create subscription with saved payment method
        const result = await service.tryCreateSubscriptionWithSavedPayment(organization, plan_slug)

        if (result.success) {
            // Successfully created subscription with saved payment method
            const serialized = await serializeSubscriptionDetail(result.subscription)
            return res.status(200).json({
                status: 'subscription_created',
                subscription: serialized,
            })
        } else {
            // Failed to use saved payment method, fallback to checkout
            logger.info({ organizationName: organization.name, error: result.error }, 'Falling back to checkout')

            const checkoutSession = await service.createCheckoutSession({
                organization,
                planSlug: plan_slug,
                successUrl: success_url,
                cancelUrl: cancel_url,
            })

            return res.status(200).json({
                status: 'checkout_required',
                checkout_url: checkoutSession.url,
                reason: result.error,
            })
        }
    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return res.status(401).json({ error: error.message })
        }
        if (error.message === 'You do not have permission to perform this action') {
            return res.status(403).json({ error: error.message })
        }
        if (
            error.message.includes('not found') ||
            error.message.includes('not active') ||
            error.message.includes('does not have a Stripe price ID')
        ) {
            return res.status(400).json({ error: error.message })
        }
        logger.error({ err: error }, 'Error in upgrade')
        res.status(500).json({ error: 'Failed to process upgrade' })
    }
}

/**
 * POST /api/organization/:organization_uuid/subscription/portal/
 * Get Stripe Customer Portal URL for managing payment methods and cancellation
 */
const portal = async (req: Request, res: Response) => {
    try {
        const organization = await getOrganizationWithAccess(req, OrganizationMembershipRole.OWNER)

        const { return_url } = req.body

        if (!return_url) {
            return res.status(400).json({ error: 'return_url is required' })
        }

        const subscription = await DI.organizationSubscriptions.findOne({
            organization: organization.uuid,
        })

        if (!subscription?.stripe_customer_id) {
            return res.status(400).json({
                error: 'No active subscription to manage. Please upgrade to a paid plan first.',
            })
        }

        const service = new SubscriptionService()
        const portalSession = await service.createCustomerPortalSession({
            organization,
            returnUrl: return_url,
        })

        res.status(200).json({ portal_url: portalSession.url })
    } catch (error: any) {
        Sentry.captureException(error)
        if (error.message === 'Unauthorized') {
            return res.status(401).json({ error: error.message })
        }
        if (error.message === 'You do not have permission to perform this action') {
            return res.status(403).json({ error: error.message })
        }
        return res.status(503).json({ error: 'Failed to create customer portal session' })
    }
}

/**
 * POST /api/organization/:organization_uuid/subscription/change_plan/
 * Change organization's subscription plan
 */
const changePlan = async (req: Request, res: Response) => {
    try {
        const organization = await getOrganizationWithAccess(req, OrganizationMembershipRole.OWNER)

        const { plan_slug } = req.body

        if (!plan_slug) {
            return res.status(400).json({ error: 'plan_slug is required' })
        }

        const service = new SubscriptionService()
        const subscription = await service.changePlan({
            organization,
            newPlanSlug: plan_slug,
        })

        const serialized = await serializeSubscriptionDetail(subscription)
        res.status(200).json({ status: 'success', subscription: serialized })
    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return res.status(401).json({ error: error.message })
        }
        if (error.message === 'You do not have permission to perform this action') {
            return res.status(403).json({ error: error.message })
        }
        if (
            error.message.includes('not found') ||
            error.message.includes('not active') ||
            error.message.includes('already scheduled') ||
            error.message.includes('Use checkout session')
        ) {
            return res.status(400).json({ error: error.message })
        }
        logger.error({ err: error }, 'Error changing plan')
        res.status(500).json({ error: 'Failed to change plan' })
    }
}

/**
 * POST /api/organization/:organization_uuid/subscription/cancel_scheduled_change/
 * Cancel a scheduled plan change
 */
const cancelScheduledChange = async (req: Request, res: Response) => {
    try {
        const organization = await getOrganizationWithAccess(req, OrganizationMembershipRole.OWNER)

        const service = new SubscriptionService()
        const subscription = await service.cancelScheduledPlanChange(organization)

        const serialized = await serializeSubscriptionDetail(subscription)
        res.status(200).json({ status: 'success', subscription: serialized })
    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return res.status(401).json({ error: error.message })
        }
        if (error.message === 'You do not have permission to perform this action') {
            return res.status(403).json({ error: error.message })
        }
        if (
            error.message.includes('not found') ||
            error.message.includes('No scheduled plan change') ||
            error.message.includes('No Stripe schedule')
        ) {
            return res.status(400).json({ error: error.message })
        }
        logger.error({ err: error }, 'Error canceling scheduled change')
        res.status(500).json({ error: 'Failed to cancel scheduled change' })
    }
}

/**
 * GET /api/organization/:organization_uuid/subscription/usage/
 * Get current billing period usage
 */
const usage = async (req: Request, res: Response) => {
    try {
        const organization = await getOrganizationWithAccess(req)

        const service = new UsageTrackingService()
        const usageData = await service.getCurrentUsage(organization)

        res.status(200).json(usageData)
    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return res.status(401).json({ error: error.message })
        }
        if (error.message === 'Organization not found') {
            return res.status(404).json({ error: error.message })
        }
        if (error.message === 'You are not a member of this organization') {
            return res.status(403).json({ error: error.message })
        }
        logger.error({ err: error }, 'Error getting usage')
        res.status(500).json({ error: 'Internal server error' })
    }
}

/**
 * GET /api/organization/:organization_uuid/subscription/usage_history/
 * Get usage history for previous billing periods
 */
const usageHistory = async (req: Request, res: Response) => {
    try {
        const organization = await getOrganizationWithAccess(req)

        const usageRecords = await DI.usageRecords.find(
            { organization: organization.uuid },
            { orderBy: { billing_period_start: 'DESC' }, limit: 12 }
        )

        // Get projects count for each period
        const projectsCount = await DI.projects.count({ organization: organization.uuid })

        const serialized = usageRecords.map((record) => ({
            billing_period_start: record.billing_period_start,
            billing_period_end: record.billing_period_end,
            memo_operations_count: record.memo_operations_count,
            chat_queries_count: record.chat_queries_count,
            projects: projectsCount,
        }))

        res.status(200).json(serialized)
    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return res.status(401).json({ error: error.message })
        }
        if (error.message === 'Organization not found') {
            return res.status(404).json({ error: error.message })
        }
        if (error.message === 'You are not a member of this organization') {
            return res.status(403).json({ error: error.message })
        }
        logger.error({ err: error }, 'Error getting usage history')
        res.status(500).json({ error: 'Internal server error' })
    }
}

// Register routes
subscriptionRouter.get('/', getSubscription)
subscriptionRouter.post('/checkout', checkout)
subscriptionRouter.post('/upgrade', upgrade)
subscriptionRouter.post('/portal', portal)
subscriptionRouter.post('/change_plan', changePlan)
subscriptionRouter.post('/cancel_scheduled_change', cancelScheduledChange)
subscriptionRouter.get('/usage', usage)
subscriptionRouter.get('/usage_history', usageHistory)
