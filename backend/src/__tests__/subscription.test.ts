import express, { Express } from 'express'
import request from 'supertest'
import { MikroORM, RequestContext } from '@mikro-orm/postgresql'
import { subscriptionRouter } from '../api/subscription'
import { DI } from '../di'
import { createTestDatabase, clearDatabase, closeDatabase } from './testDb'
import { createTestUser, createTestOrganization, createTestOrganizationMembership } from './testHelpers'
import { generateAccessToken } from '../lib/tokenUtils'
import { userMiddleware } from '../middleware/userMiddleware'
import { User } from '../entities/User'
import { Organization } from '../entities/Organization'
import { OrganizationMembership, OrganizationMembershipRole } from '../entities/OrganizationMembership'
import cookieParser from 'cookie-parser'
import * as subscriptionService from '../services/subscriptionService'
import * as usageTrackingService from '../services/usageTrackingService'

// Mock external dependencies
jest.mock('../services/subscriptionService')
jest.mock('../services/usageTrackingService')

describe('Subscription API', () => {
    let app: Express
    let orm: MikroORM

    beforeAll(async () => {
        orm = await createTestDatabase()
        DI.orm = orm
        DI.em = orm.em
        DI.users = orm.em.getRepository(User)
        DI.organizations = orm.em.getRepository(Organization)
        DI.organizationMemberships = orm.em.getRepository(OrganizationMembership)

        app = express()
        app.use(express.json())
        app.use(cookieParser())
        app.use((req, res, next) => RequestContext.create(orm.em, next))
        app.use(userMiddleware())
        app.use('/api/organization/:organization_uuid/subscription', subscriptionRouter)
    })

    afterAll(async () => {
        await closeDatabase(orm)
    })

    afterEach(async () => {
        await clearDatabase(orm)
        jest.clearAllMocks()
    })

    describe('GET /api/organization/:organization_uuid/subscription', () => {
        it('should return 401 when not authenticated', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)

            const response = await request(app).get(`/api/organization/${org.uuid}/subscription`)

            expect(response.status).toBe(401)
        })

        it('should return 403 when user is not organization member', async () => {
            await createTestUser(orm, 'user1@example.com', 'password123')
            const user2 = await createTestUser(orm, 'user2@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user2)
            await createTestOrganizationMembership(orm, user2, org)

            const token = generateAccessToken('user1@example.com')

            const response = await request(app)
                .get(`/api/organization/${org.uuid}/subscription`)
                .set('Cookie', [`accessToken=${token}`])

            expect(response.status).toBe(403)
        })

        it('should return 404 when organization does not exist', async () => {
            await createTestUser(orm, 'test@example.com', 'password123')
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .get('/api/organization/00000000-0000-0000-0000-000000000000/subscription')
                .set('Cookie', [`accessToken=${token}`])

            expect(response.status).toBe(404)
        })
    })

    describe('POST /api/organization/:organization_uuid/subscription/checkout', () => {
        it('should require owner role', async () => {
            const owner = await createTestUser(orm, 'owner@example.com', 'password123')
            const member = await createTestUser(orm, 'member@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', owner)
            await createTestOrganizationMembership(orm, member, org, OrganizationMembershipRole.MEMBER)

            const token = generateAccessToken('member@example.com')

            const response = await request(app)
                .post(`/api/organization/${org.uuid}/subscription/checkout`)
                .set('Cookie', [`accessToken=${token}`])
                .send({
                    plan_slug: 'pro',
                    success_url: 'https://example.com/success',
                    cancel_url: 'https://example.com/cancel',
                })

            expect(response.status).toBe(403)
        })

        it('should return 400 when required fields are missing', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org, OrganizationMembershipRole.OWNER)

            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post(`/api/organization/${org.uuid}/subscription/checkout`)
                .set('Cookie', [`accessToken=${token}`])
                .send({
                    plan_slug: 'pro',
                })

            expect(response.status).toBe(400)
            expect(response.body.error).toContain('required')
        })

        it('should create checkout session with valid data', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org, OrganizationMembershipRole.OWNER)

            const mockCheckoutSession = { url: 'https://checkout.stripe.com/session123' }
            ;(subscriptionService.SubscriptionService as jest.Mock).mockImplementation(() => ({
                createCheckoutSession: jest.fn().mockResolvedValue(mockCheckoutSession),
            }))

            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post(`/api/organization/${org.uuid}/subscription/checkout`)
                .set('Cookie', [`accessToken=${token}`])
                .send({
                    plan_slug: 'pro',
                    success_url: 'https://example.com/success',
                    cancel_url: 'https://example.com/cancel',
                })

            expect(response.status).toBe(200)
            expect(response.body.checkout_url).toBe('https://checkout.stripe.com/session123')
        })
    })

    describe('POST /api/organization/:organization_uuid/subscription/upgrade', () => {
        it('should require owner role', async () => {
            const owner = await createTestUser(orm, 'owner@example.com', 'password123')
            const member = await createTestUser(orm, 'member@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', owner)
            await createTestOrganizationMembership(orm, member, org, OrganizationMembershipRole.MEMBER)

            const token = generateAccessToken('member@example.com')

            const response = await request(app)
                .post(`/api/organization/${org.uuid}/subscription/upgrade`)
                .set('Cookie', [`accessToken=${token}`])
                .send({
                    plan_slug: 'pro',
                    success_url: 'https://example.com/success',
                    cancel_url: 'https://example.com/cancel',
                })

            expect(response.status).toBe(403)
        })

        it('should return checkout_required when saved payment fails', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org, OrganizationMembershipRole.OWNER)

            const mockCheckoutSession = { url: 'https://checkout.stripe.com/session123' }
            ;(subscriptionService.SubscriptionService as jest.Mock).mockImplementation(() => ({
                tryCreateSubscriptionWithSavedPayment: jest.fn().mockResolvedValue({
                    success: false,
                    error: 'No saved payment method',
                }),
                createCheckoutSession: jest.fn().mockResolvedValue(mockCheckoutSession),
            }))

            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post(`/api/organization/${org.uuid}/subscription/upgrade`)
                .set('Cookie', [`accessToken=${token}`])
                .send({
                    plan_slug: 'pro',
                    success_url: 'https://example.com/success',
                    cancel_url: 'https://example.com/cancel',
                })

            expect(response.status).toBe(200)
            expect(response.body.status).toBe('checkout_required')
            expect(response.body.checkout_url).toBeDefined()
        })

        it('should return subscription_created when saved payment succeeds', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org, OrganizationMembershipRole.OWNER)

            const mockSubscription = {
                id: 1n,
                organization: org,
                plan: {
                    id: 1n,
                    slug: 'pro',
                    name: 'Pro Plan',
                    monthly_price: '29.99',
                    features: {},
                    isDefault: false,
                },
                status: 'active',
                current_period_start: new Date(),
                current_period_end: new Date(),
                cancel_at_period_end: false,
            }

            ;(subscriptionService.SubscriptionService as jest.Mock).mockImplementation(() => ({
                tryCreateSubscriptionWithSavedPayment: jest.fn().mockResolvedValue({
                    success: true,
                    subscription: mockSubscription,
                }),
            }))

            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post(`/api/organization/${org.uuid}/subscription/upgrade`)
                .set('Cookie', [`accessToken=${token}`])
                .send({
                    plan_slug: 'pro',
                    success_url: 'https://example.com/success',
                    cancel_url: 'https://example.com/cancel',
                })

            expect(response.status).toBe(200)
            expect(response.body.status).toBe('subscription_created')
            expect(response.body.subscription).toBeDefined()
        })
    })

    describe('POST /api/organization/:organization_uuid/subscription/portal', () => {
        it('should require owner role', async () => {
            const owner = await createTestUser(orm, 'owner@example.com', 'password123')
            const member = await createTestUser(orm, 'member@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', owner)
            await createTestOrganizationMembership(orm, member, org, OrganizationMembershipRole.MEMBER)

            const token = generateAccessToken('member@example.com')

            const response = await request(app)
                .post(`/api/organization/${org.uuid}/subscription/portal`)
                .set('Cookie', [`accessToken=${token}`])
                .send({
                    return_url: 'https://example.com/return',
                })

            expect(response.status).toBe(403)
        })

        it('should return 400 when return_url is missing', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org, OrganizationMembershipRole.OWNER)

            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post(`/api/organization/${org.uuid}/subscription/portal`)
                .set('Cookie', [`accessToken=${token}`])
                .send({})

            expect(response.status).toBe(400)
            expect(response.body.error).toBe('return_url is required')
        })
    })

    describe('POST /api/organization/:organization_uuid/subscription/change_plan', () => {
        it('should require owner role', async () => {
            const owner = await createTestUser(orm, 'owner@example.com', 'password123')
            const member = await createTestUser(orm, 'member@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', owner)
            await createTestOrganizationMembership(orm, member, org, OrganizationMembershipRole.MEMBER)

            const token = generateAccessToken('member@example.com')

            const response = await request(app)
                .post(`/api/organization/${org.uuid}/subscription/change_plan`)
                .set('Cookie', [`accessToken=${token}`])
                .send({
                    plan_slug: 'enterprise',
                })

            expect(response.status).toBe(403)
        })

        it('should return 400 when plan_slug is missing', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org, OrganizationMembershipRole.OWNER)

            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post(`/api/organization/${org.uuid}/subscription/change_plan`)
                .set('Cookie', [`accessToken=${token}`])
                .send({})

            expect(response.status).toBe(400)
            expect(response.body.error).toBe('plan_slug is required')
        })
    })

    describe('POST /api/organization/:organization_uuid/subscription/cancel_scheduled_change', () => {
        it('should require owner role', async () => {
            const owner = await createTestUser(orm, 'owner@example.com', 'password123')
            const member = await createTestUser(orm, 'member@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', owner)
            await createTestOrganizationMembership(orm, member, org, OrganizationMembershipRole.MEMBER)

            const token = generateAccessToken('member@example.com')

            const response = await request(app)
                .post(`/api/organization/${org.uuid}/subscription/cancel_scheduled_change`)
                .set('Cookie', [`accessToken=${token}`])

            expect(response.status).toBe(403)
        })
    })

    describe('GET /api/organization/:organization_uuid/subscription/usage', () => {
        it('should return usage data for organization member', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)

            const mockUsageData = {
                memo_operations: 100,
                chat_queries: 50,
                projects: 3,
            }

            ;(usageTrackingService.UsageTrackingService as jest.Mock).mockImplementation(() => ({
                getCurrentUsage: jest.fn().mockResolvedValue(mockUsageData),
            }))

            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .get(`/api/organization/${org.uuid}/subscription/usage`)
                .set('Cookie', [`accessToken=${token}`])

            expect(response.status).toBe(200)
            expect(response.body).toEqual(mockUsageData)
        })

        it('should return 403 when user is not organization member', async () => {
            await createTestUser(orm, 'user1@example.com', 'password123')
            const user2 = await createTestUser(orm, 'user2@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user2)
            await createTestOrganizationMembership(orm, user2, org)

            const token = generateAccessToken('user1@example.com')

            const response = await request(app)
                .get(`/api/organization/${org.uuid}/subscription/usage`)
                .set('Cookie', [`accessToken=${token}`])

            expect(response.status).toBe(403)
        })
    })

    describe('GET /api/organization/:organization_uuid/subscription/usage_history', () => {
        it('should return 401 when not authenticated', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)

            const response = await request(app).get(`/api/organization/${org.uuid}/subscription/usage_history`)

            expect(response.status).toBe(401)
        })

        it('should return 403 when user is not organization member', async () => {
            await createTestUser(orm, 'user1@example.com', 'password123')
            const user2 = await createTestUser(orm, 'user2@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user2)
            await createTestOrganizationMembership(orm, user2, org)

            const token = generateAccessToken('user1@example.com')

            const response = await request(app)
                .get(`/api/organization/${org.uuid}/subscription/usage_history`)
                .set('Cookie', [`accessToken=${token}`])

            expect(response.status).toBe(403)
        })
    })
})
