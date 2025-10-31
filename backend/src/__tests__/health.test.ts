import express, { Express } from 'express'
import request from 'supertest'
import { MikroORM, RequestContext } from '@mikro-orm/postgresql'
import { health } from '../api/health'
import { DI } from '../di'
import { createTestDatabase, closeDatabase } from './testDb'

describe('Health API', () => {
    let app: Express
    let orm: MikroORM

    beforeAll(async () => {
        orm = await createTestDatabase()
        DI.orm = orm
        DI.em = orm.em

        app = express()
        app.use(express.json())
        app.use((req, res, next) => RequestContext.create(orm.em, next))
        app.get('/api/health', health)
    })

    afterAll(async () => {
        await closeDatabase(orm)
    })

    describe('GET /api/health', () => {
        it('should return status ok with database check passing', async () => {
            const response = await request(app).get('/api/health')

            expect(response.status).toBe(200)
            expect(response.body).toHaveProperty('status', 'ok')
            expect(response.body).toHaveProperty('checks')
            expect(response.body.checks).toHaveProperty('database', true)
        })

        it('should return status ok even if database check structure is present', async () => {
            const response = await request(app).get('/api/health')

            expect(response.status).toBe(200)
            expect(response.body.status).toBe('ok')
            expect(response.body.checks).toBeDefined()
        })
    })
})
