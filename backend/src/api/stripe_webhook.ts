import { Request, Response } from 'express'
import Stripe from 'stripe'
import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, DEBUG } from '@/settings'
import { DI } from '@/di'
import { StripeEvent } from '@/entities/StripeEvent'
import { SubscriptionService } from '@/services/subscriptionService'

/**
 * Stripe webhook endpoint.
 * Verifies signature and processes events idempotently.
 */
export const stripeWebhook = async (req: Request, res: Response) => {
    const payload = req.body as Buffer
    const signature = req.headers['stripe-signature']

    // Check if Stripe is configured
    if (!STRIPE_WEBHOOK_SECRET) {
        console.warn('STRIPE_WEBHOOK_SECRET not configured')
        return res.status(400).send('Webhook secret not configured')
    }

    if (!STRIPE_SECRET_KEY) {
        console.warn('STRIPE_SECRET_KEY not configured')
        return res.status(400).send('Stripe not configured')
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY)

    // Verify webhook signature
    let event: Stripe.Event

    try {
        if (!signature) {
            console.error('Missing stripe-signature header')
            return res.status(400).send('Missing signature')
        }

        event = stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET)
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message)
        const errorMsg = DEBUG ? `Webhook Error: ${err.message}` : 'Invalid webhook signature'
        return res.status(400).json({ error: errorMsg })
    }

    // Idempotency check
    const em = DI.em.fork()
    const existingEvent = await em.findOne(StripeEvent, { stripe_event_id: event.id })

    if (existingEvent) {
        console.info(`Event ${event.id} already processed`)
        return res.status(200).send('Event already processed')
    }

    // Create event record
    const stripeEvent = em.create(StripeEvent, {
        stripe_event_id: event.id,
        event_type: event.type,
        payload: event,
        processed: false,
        created_at: new Date(),
    })

    await em.persistAndFlush(stripeEvent)

    try {
        // Route to appropriate handler
        const service = new SubscriptionService()

        // Handle different event types
        let handled = false
        switch (event.type) {
            case 'customer.subscription.created':
                await service.handleSubscriptionCreated(event, em)
                handled = true
                break
            case 'customer.subscription.updated':
                await service.handleSubscriptionUpdated(event, em)
                handled = true
                break
            case 'customer.subscription.deleted':
                await service.handleSubscriptionDeleted(event, em)
                handled = true
                break
            case 'subscription_schedule.updated':
                await service.handleSubscriptionScheduleUpdated(event, em)
                handled = true
                break
            case 'subscription_schedule.completed':
                await service.handleSubscriptionScheduleCompleted(event, em)
                handled = true
                break
            case 'invoice.paid':
                await service.handleInvoicePaid(event, em)
                handled = true
                break
            case 'invoice.payment_failed':
                await service.handlePaymentFailed(event, em)
                handled = true
                break
            case 'checkout.session.completed':
                await service.handleCheckoutCompleted(event, em)
                handled = true
                break
            default:
                console.info(`Unhandled event type: ${event.type}`)
        }

        if (handled) {
            stripeEvent.processed = true
            stripeEvent.processed_at = new Date()
            await em.persistAndFlush(stripeEvent)
            console.info(`Successfully processed ${event.type} event: ${event.id}`)
        }

        return res.status(200).send('Webhook processed')
    } catch (error: any) {
        console.error('Error processing webhook:', error)
        stripeEvent.processing_error = error.message || String(error)
        await em.persistAndFlush(stripeEvent)
        return res.status(500).send('Error processing webhook')
    }
}
