import express, { Express } from 'express'
import request from 'supertest'
import { MikroORM, RequestContext } from '@mikro-orm/postgresql'
import { planRouter } from '../api/plan'
import { DI } from '../di'
import { createTestDatabase, clearDatabase, closeDatabase } from './testDb'
import { Plan } from '../entities/Plan'

describe('Plan API', () => {
    let app: Express
    let orm: MikroORM

    beforeAll(async () => {
        orm = await createTestDatabase()
        DI.orm = orm
        DI.em = orm.em
        DI.plans = orm.em.getRepository(Plan)

        app = express()
        app.use(express.json())
        app.use((req, res, next) => RequestContext.create(orm.em, next))
        app.use('/api/plans', planRouter)
    })

    afterAll(async () => {
        await closeDatabase(orm)
    })

    afterEach(async () => {
        await clearDatabase(orm)
    })

    describe('GET /api/plans', () => {
        it('should return empty array when no active plans exist', async () => {
            const response = await request(app).get('/api/plans')

            expect(response.status).toBe(200)
            expect(response.body).toEqual([])
        })

        it('should return only active plans', async () => {
            const em = orm.em.fork()

            // Create active plan
            em.create(Plan, {
                slug: 'starter',
                name: 'Starter Plan',
                monthly_price: '9.99',
                features: { feature1: true },
                isActive: true,
                isDefault: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            // Create inactive plan
            em.create(Plan, {
                slug: 'inactive',
                name: 'Inactive Plan',
                monthly_price: '19.99',
                features: { feature1: false },
                isActive: false,
                isDefault: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            await em.flush()

            const response = await request(app).get('/api/plans')

            expect(response.status).toBe(200)
            expect(response.body).toHaveLength(1)
            expect(response.body[0]).toMatchObject({
                slug: 'starter',
                name: 'Starter Plan',
                monthly_price: '9.99',
            })
        })

        it('should return plans ordered by monthly_price ascending', async () => {
            const em = orm.em.fork()

            em.create(Plan, {
                slug: 'enterprise',
                name: 'Enterprise',
                monthly_price: '99.99',
                features: {},
                isActive: true,
                isDefault: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            em.create(Plan, {
                slug: 'starter',
                name: 'Starter',
                monthly_price: '9.99',
                features: {},
                isActive: true,
                isDefault: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            em.create(Plan, {
                slug: 'pro',
                name: 'Pro',
                monthly_price: '29.99',
                features: {},
                isActive: true,
                isDefault: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            await em.flush()

            const response = await request(app).get('/api/plans')

            expect(response.status).toBe(200)
            expect(response.body).toHaveLength(3)
            expect(response.body[0].slug).toBe('starter')
            expect(response.body[1].slug).toBe('pro')
            expect(response.body[2].slug).toBe('enterprise')
        })

        it('should include all plan fields in response', async () => {
            const em = orm.em.fork()

            em.create(Plan, {
                slug: 'test-plan',
                name: 'Test Plan',
                stripe_price_id: 'price_123',
                monthly_price: '19.99',
                memo_operations_limit: 1000,
                chat_queries_limit: 500,
                projects_limit: 5,
                features: { search: true, chat: true },
                isActive: true,
                isDefault: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            await em.flush()

            const response = await request(app).get('/api/plans')

            expect(response.status).toBe(200)
            expect(response.body).toHaveLength(1)
            expect(response.body[0]).toMatchObject({
                slug: 'test-plan',
                name: 'Test Plan',
                stripe_price_id: 'price_123',
                monthly_price: '19.99',
                memo_operations_limit: 1000,
                chat_queries_limit: 500,
                projects_limit: 5,
                features: { search: true, chat: true },
                is_default: true,
            })
            expect(response.body[0].id).toBeDefined()
        })

        it('should handle plans with null optional fields', async () => {
            const em = orm.em.fork()

            em.create(Plan, {
                slug: 'basic',
                name: 'Basic Plan',
                monthly_price: '0.00',
                features: {},
                isActive: true,
                isDefault: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            await em.flush()

            const response = await request(app).get('/api/plans')

            expect(response.status).toBe(200)
            expect(response.body).toHaveLength(1)
            expect(response.body[0].stripe_price_id).toBeNull()
            expect(response.body[0].memo_operations_limit).toBeNull()
            expect(response.body[0].chat_queries_limit).toBeNull()
            expect(response.body[0].projects_limit).toBeNull()
        })

        it('should return multiple active plans', async () => {
            const em = orm.em.fork()

            for (let i = 1; i <= 5; i++) {
                em.create(Plan, {
                    slug: `plan-${i}`,
                    name: `Plan ${i}`,
                    monthly_price: `${i * 10}.00`,
                    features: {},
                    isActive: true,
                    isDefault: i === 1,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })
            }

            await em.flush()

            const response = await request(app).get('/api/plans')

            expect(response.status).toBe(200)
            expect(response.body).toHaveLength(5)
        })
    })
})
