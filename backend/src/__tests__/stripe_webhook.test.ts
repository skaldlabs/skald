import express, { Express } from 'express'
import request from 'supertest'
import { MikroORM, RequestContext } from '@mikro-orm/postgresql'
import { stripeWebhook } from '../api/stripe_webhook'
import { DI } from '../di'
import { createTestDatabase, clearDatabase, closeDatabase } from './testDb'
import { StripeEvent } from '../entities/StripeEvent'
import * as subscriptionService from '../services/subscriptionService'
import Stripe from 'stripe'

// Mock external dependencies
jest.mock('../services/subscriptionService')
jest.mock('stripe')

// Mock settings - preserve original settings and only override Stripe keys
jest.mock('../settings', () => {
    const originalModule = jest.requireActual('../settings')
    return {
        ...originalModule,
        STRIPE_SECRET_KEY: 'sk_test_123',
        STRIPE_WEBHOOK_SECRET: 'whsec_test_123',
    }
})

describe('Stripe Webhook API', () => {
    let app: Express
    let orm: MikroORM

    beforeAll(async () => {
        orm = await createTestDatabase()
        DI.orm = orm
        DI.em = orm.em
        DI.stripeEvents = orm.em.getRepository(StripeEvent)

        app = express()
        app.use(express.raw({ type: 'application/json' }))
        app.use((req, res, next) => RequestContext.create(orm.em, next))
        app.post('/webhook/stripe', stripeWebhook)
    })

    afterAll(async () => {
        await closeDatabase(orm)
    })

    afterEach(async () => {
        await clearDatabase(orm)
        jest.clearAllMocks()
    })

    describe('POST /webhook/stripe', () => {
        it('should return 400 when signature is missing', async () => {
            const response = await request(app).post('/webhook/stripe').send({})

            expect(response.status).toBe(400)
            expect(response.text).toContain('Missing signature')
        })

        it('should return 400 when signature verification fails', async () => {
            const mockStripe = {
                webhooks: {
                    constructEvent: jest.fn().mockImplementation(() => {
                        throw new Error('Signature verification failed')
                    }),
                },
            }
            ;(Stripe as any).mockImplementation(() => mockStripe)

            const response = await request(app)
                .post('/webhook/stripe')
                .set('stripe-signature', 'invalid_signature')
                .send({})

            expect(response.status).toBe(400)
            expect(response.text).toContain('Webhook Error')
        })

        it('should handle idempotency for duplicate events', async () => {
            const mockEvent = {
                id: 'evt_test_123',
                type: 'customer.subscription.created',
                data: {},
            }

            const mockStripe = {
                webhooks: {
                    constructEvent: jest.fn().mockReturnValue(mockEvent),
                },
            }
            ;(Stripe as any).mockImplementation(() => mockStripe)

            // Create existing event
            const em = orm.em.fork()
            em.create(StripeEvent, {
                stripe_event_id: 'evt_test_123',
                event_type: 'customer.subscription.created',
                payload: mockEvent,
                processed: true,
                created_at: new Date(),
            })
            await em.flush()

            const response = await request(app)
                .post('/webhook/stripe')
                .set('stripe-signature', 'valid_signature')
                .send({})

            expect(response.status).toBe(200)
            expect(response.text).toBe('Event already processed')
        })

        it('should process new subscription.created event', async () => {
            const mockEvent = {
                id: 'evt_new_123',
                type: 'customer.subscription.created',
                data: {
                    object: {
                        id: 'sub_123',
                        customer: 'cus_123',
                    },
                },
            }

            const mockStripe = {
                webhooks: {
                    constructEvent: jest.fn().mockReturnValue(mockEvent),
                },
            }
            ;(Stripe as any).mockImplementation(() => mockStripe)
            ;(subscriptionService.SubscriptionService as jest.Mock).mockImplementation(() => ({
                handleSubscriptionCreated: jest.fn().mockResolvedValue({}),
            }))

            const response = await request(app)
                .post('/webhook/stripe')
                .set('stripe-signature', 'valid_signature')
                .send({})

            expect(response.status).toBe(200)
            expect(response.text).toBe('Webhook processed')

            // Verify event was stored
            const em = orm.em.fork()
            const storedEvent = await em.findOne(StripeEvent, { stripe_event_id: 'evt_new_123' })
            expect(storedEvent).toBeDefined()
            expect(storedEvent?.processed).toBe(true)
        })

        it('should process subscription.updated event', async () => {
            const mockEvent = {
                id: 'evt_updated_123',
                type: 'customer.subscription.updated',
                data: {},
            }

            const mockStripe = {
                webhooks: {
                    constructEvent: jest.fn().mockReturnValue(mockEvent),
                },
            }
            ;(Stripe as any).mockImplementation(() => mockStripe)
            ;(subscriptionService.SubscriptionService as jest.Mock).mockImplementation(() => ({
                handleSubscriptionUpdated: jest.fn().mockResolvedValue({}),
            }))

            const response = await request(app)
                .post('/webhook/stripe')
                .set('stripe-signature', 'valid_signature')
                .send({})

            expect(response.status).toBe(200)
        })

        it('should process subscription.deleted event', async () => {
            const mockEvent = {
                id: 'evt_deleted_123',
                type: 'customer.subscription.deleted',
                data: {},
            }

            const mockStripe = {
                webhooks: {
                    constructEvent: jest.fn().mockReturnValue(mockEvent),
                },
            }
            ;(Stripe as any).mockImplementation(() => mockStripe)
            ;(subscriptionService.SubscriptionService as jest.Mock).mockImplementation(() => ({
                handleSubscriptionDeleted: jest.fn().mockResolvedValue({}),
            }))

            const response = await request(app)
                .post('/webhook/stripe')
                .set('stripe-signature', 'valid_signature')
                .send({})

            expect(response.status).toBe(200)
        })

        it('should handle invoice.paid event', async () => {
            const mockEvent = {
                id: 'evt_invoice_paid_123',
                type: 'invoice.paid',
                data: {},
            }

            const mockStripe = {
                webhooks: {
                    constructEvent: jest.fn().mockReturnValue(mockEvent),
                },
            }
            ;(Stripe as any).mockImplementation(() => mockStripe)
            ;(subscriptionService.SubscriptionService as jest.Mock).mockImplementation(() => ({
                handleInvoicePaid: jest.fn().mockResolvedValue({}),
            }))

            const response = await request(app)
                .post('/webhook/stripe')
                .set('stripe-signature', 'valid_signature')
                .send({})

            expect(response.status).toBe(200)
        })

        it('should handle checkout.session.completed event', async () => {
            const mockEvent = {
                id: 'evt_checkout_123',
                type: 'checkout.session.completed',
                data: {},
            }

            const mockStripe = {
                webhooks: {
                    constructEvent: jest.fn().mockReturnValue(mockEvent),
                },
            }
            ;(Stripe as any).mockImplementation(() => mockStripe)
            ;(subscriptionService.SubscriptionService as jest.Mock).mockImplementation(() => ({
                handleCheckoutCompleted: jest.fn().mockResolvedValue({}),
            }))

            const response = await request(app)
                .post('/webhook/stripe')
                .set('stripe-signature', 'valid_signature')
                .send({})

            expect(response.status).toBe(200)
        })

        it('should handle unhandled event types gracefully', async () => {
            const mockEvent = {
                id: 'evt_unknown_123',
                type: 'unknown.event.type',
                data: {},
            }

            const mockStripe = {
                webhooks: {
                    constructEvent: jest.fn().mockReturnValue(mockEvent),
                },
            }
            ;(Stripe as any).mockImplementation(() => mockStripe)

            const response = await request(app)
                .post('/webhook/stripe')
                .set('stripe-signature', 'valid_signature')
                .send({})

            expect(response.status).toBe(200)

            // Verify event was stored but not marked as processed
            const em = orm.em.fork()
            const storedEvent = await em.findOne(StripeEvent, { stripe_event_id: 'evt_unknown_123' })
            expect(storedEvent).toBeDefined()
            expect(storedEvent?.processed).toBe(false)
        })

        it('should return 500 when processing fails', async () => {
            const mockEvent = {
                id: 'evt_error_123',
                type: 'customer.subscription.created',
                data: {},
            }

            const mockStripe = {
                webhooks: {
                    constructEvent: jest.fn().mockReturnValue(mockEvent),
                },
            }
            ;(Stripe as any).mockImplementation(() => mockStripe)
            ;(subscriptionService.SubscriptionService as jest.Mock).mockImplementation(() => ({
                handleSubscriptionCreated: jest.fn().mockRejectedValue(new Error('Processing failed')),
            }))

            const response = await request(app)
                .post('/webhook/stripe')
                .set('stripe-signature', 'valid_signature')
                .send({})

            expect(response.status).toBe(500)
            expect(response.text).toBe('Error processing webhook')

            // Verify error was stored
            const em = orm.em.fork()
            const storedEvent = await em.findOne(StripeEvent, { stripe_event_id: 'evt_error_123' })
            expect(storedEvent).toBeDefined()
            expect(storedEvent?.processing_error).toBe('Processing failed')
        })

        it('should create event record before processing', async () => {
            const mockEvent = {
                id: 'evt_record_123',
                type: 'customer.subscription.created',
                data: {},
            }

            const mockStripe = {
                webhooks: {
                    constructEvent: jest.fn().mockReturnValue(mockEvent),
                },
            }
            ;(Stripe as any).mockImplementation(() => mockStripe)
            ;(subscriptionService.SubscriptionService as jest.Mock).mockImplementation(() => ({
                handleSubscriptionCreated: jest.fn().mockResolvedValue({}),
            }))

            await request(app).post('/webhook/stripe').set('stripe-signature', 'valid_signature').send({})

            const em = orm.em.fork()
            const storedEvent = await em.findOne(StripeEvent, { stripe_event_id: 'evt_record_123' })
            expect(storedEvent).toBeDefined()
            expect(storedEvent?.event_type).toBe('customer.subscription.created')
            expect(storedEvent?.processed_at).toBeDefined()
        })
    })
})
