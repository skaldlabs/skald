import express, { Express } from 'express'
import request from 'supertest'
import { MikroORM, RequestContext } from '@mikro-orm/postgresql'
import cookieParser from 'cookie-parser'
import { memoRouter } from '../api/memo'
import { DI } from '../di'
import { createTestDatabase, clearDatabase, closeDatabase } from './testDb'
import {
    createTestUser,
    createTestOrganization,
    createTestProject,
    createTestOrganizationMembership,
    createTestMemo,
} from './testHelpers'
import { generateAccessToken } from '../lib/tokenUtils'
import { userMiddleware } from '../middleware/userMiddleware'
import { User } from '../entities/User'
import { Project } from '../entities/Project'
import { Memo } from '../entities/Memo'
import { MemoContent } from '../entities/MemoContent'
import { MemoSummary } from '../entities/MemoSummary'
import { MemoTag } from '../entities/MemoTag'
import { MemoChunk } from '../entities/MemoChunk'
import { Organization } from '../entities/Organization'
import { OrganizationMembership } from '../entities/OrganizationMembership'

describe('Memo API Tests', () => {
    let app: Express
    let orm: MikroORM

    beforeAll(async () => {
        orm = await createTestDatabase()
        DI.orm = orm
        DI.em = orm.em
        DI.users = orm.em.getRepository(User)
        DI.projects = orm.em.getRepository(Project)
        DI.memos = orm.em.getRepository(Memo)
        DI.memoContents = orm.em.getRepository(MemoContent)
        DI.memoSummaries = orm.em.getRepository(MemoSummary)
        DI.memoTags = orm.em.getRepository(MemoTag)
        DI.memoChunks = orm.em.getRepository(MemoChunk)
        DI.organizations = orm.em.getRepository(Organization)
        DI.organizationMemberships = orm.em.getRepository(OrganizationMembership)

        app = express()
        app.use(express.json())
        app.use(cookieParser())
        app.use((req, res, next) => RequestContext.create(orm.em, next))
        app.use(userMiddleware())
        app.use('/api/memos', memoRouter)
    })

    afterAll(async () => {
        await closeDatabase(orm)
    })

    afterEach(async () => {
        await clearDatabase(orm)
    })

    describe('POST /api/memos - Create Memo', () => {
        it('should create a memo with valid data', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post('/api/memos')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })
                .send({
                    title: 'Test Memo',
                    content: 'This is test content',
                    source: 'test',
                    type: 'note',
                })

            expect(response.status).toBe(201)
            expect(response.body.memo_uuid).toBeDefined()
        })

        it('should create a memo with optional fields', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post('/api/memos')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })
                .send({
                    title: 'Test Memo',
                    content: 'This is test content',
                    reference_id: 'ref123',
                    metadata: { key: 'value' },
                    tags: ['tag1', 'tag2'],
                })

            expect(response.status).toBe(201)
            expect(response.body.memo_uuid).toBeDefined()
        })

        it('should reject memo without title', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post('/api/memos')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })
                .send({
                    content: 'This is test content',
                })

            expect(response.status).toBe(400)
        })

        it('should reject memo without content', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post('/api/memos')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })
                .send({
                    title: 'Test Memo',
                })

            expect(response.status).toBe(400)
        })

        it('should reject memo with title exceeding 255 characters', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post('/api/memos')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })
                .send({
                    title: 'a'.repeat(256),
                    content: 'This is test content',
                })

            expect(response.status).toBe(400)
        })

        it('should require authentication', async () => {
            const response = await request(app).post('/api/memos').send({
                title: 'Test Memo',
                content: 'This is test content',
            })

            // requireProjectAccess middleware returns 403 for unauthenticated users
            expect(response.status).toBe(403)
        })

        it('should require project_id', async () => {
            await createTestUser(orm, 'test@example.com', 'password123')
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post('/api/memos')
                .set('Cookie', [`accessToken=${token}`])
                .send({
                    title: 'Test Memo',
                    content: 'This is test content',
                })

            expect(response.status).toBe(400)
            expect(response.body.error).toBe('Project ID is required')
        })

        it('should reject memo with expiration_date in the past', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post('/api/memos')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })
                .send({
                    title: 'Test Memo',
                    content: 'This is test content',
                    expiration_date: new Date(Date.now() - 1000 * 60 * 60 * 24),
                })

            expect(response.status).toBe(400)
        })

        it('should accept expiration_date as string', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post('/api/memos')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })
                .send({
                    title: 'Test Memo',
                    content: 'This is test content',
                    expiration_date: new Date(Date.now() + 1000).toISOString(),
                })

            expect(response.status).toBe(201)
            expect(response.body.memo_uuid).toBeDefined()
        })

        it('should accept expiration_date as Date', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post('/api/memos')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })
                .send({
                    title: 'Test Memo',
                    content: 'This is test content',
                    expiration_date: new Date(Date.now() + 1000),
                })

            expect(response.status).toBe(201)
            expect(response.body.memo_uuid).toBeDefined()
        })
    })

    describe('GET /api/memos/:id - Get Memo', () => {
        it('should get a memo by uuid', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const memo = await createTestMemo(orm, project, {
                title: 'Test Memo',
                content: 'Test content',
            })
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .get(`/api/memos/${memo.uuid}`)
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })

            expect(response.status).toBe(200)
            expect(response.body.uuid).toBe(memo.uuid)
            expect(response.body.title).toBe('Test Memo')
        })

        it('should get a memo by reference_id', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const memo = await createTestMemo(orm, project, {
                title: 'Test Memo',
                content: 'Test content',
                client_reference_id: 'ref123',
            })
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .get(`/api/memos/ref123`)
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid, id_type: 'reference_id' })

            expect(response.status).toBe(200)
            expect(response.body.uuid).toBe(memo.uuid)
            expect(response.body.client_reference_id).toBe('ref123')
        })

        it('should return 404 for non-existent memo', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .get('/api/memos/00000000-0000-0000-0000-000000000000')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })

            expect(response.status).toBe(404)
            expect(response.body.error).toBe('Memo not found')
        })

        it('should reject invalid id_type', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const memo = await createTestMemo(orm, project, {
                title: 'Test Memo',
                content: 'Test content',
            })
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .get(`/api/memos/${memo.uuid}`)
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid, id_type: 'invalid' })

            expect(response.status).toBe(400)
            expect(response.body.error).toBe("id_type must be either 'memo_uuid' or 'reference_id'")
        })
    })

    describe('PATCH /api/memos/:id - Update Memo', () => {
        it('should update memo title', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const memo = await createTestMemo(orm, project, {
                title: 'Original Title',
                content: 'Test content',
            })
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .patch(`/api/memos/${memo.uuid}`)
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })
                .send({
                    title: 'Updated Title',
                })

            expect(response.status).toBe(200)
            expect(response.body.ok).toBe(true)
        })

        it('should update memo metadata', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const memo = await createTestMemo(orm, project, {
                title: 'Test Memo',
                content: 'Test content',
            })
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .patch(`/api/memos/${memo.uuid}`)
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })
                .send({
                    metadata: { key: 'new value' },
                })

            expect(response.status).toBe(200)
            expect(response.body.ok).toBe(true)
        })

        it('should return 404 for non-existent memo', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .patch('/api/memos/00000000-0000-0000-0000-000000000000')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })
                .send({
                    title: 'Updated Title',
                })

            expect(response.status).toBe(404)
            expect(response.body.error).toBe('Memo not found')
        })
    })

    describe('GET /api/memos - List Memos', () => {
        it('should list memos for a project', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            await createTestMemo(orm, project, { title: 'Memo 1', content: 'Content 1' })
            await createTestMemo(orm, project, { title: 'Memo 2', content: 'Content 2' })
            await createTestMemo(orm, project, { title: 'Memo 3', content: 'Content 3' })
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .get('/api/memos')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })

            expect(response.status).toBe(200)
            expect(response.body.results).toHaveLength(3)
            expect(response.body.count).toBe(3)
            expect(response.body.page).toBe(1)
        })

        it('should paginate memos', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            for (let i = 1; i <= 25; i++) {
                await createTestMemo(orm, project, { title: `Memo ${i}`, content: `Content ${i}` })
            }
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .get('/api/memos')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid, page: 2, page_size: 10 })

            expect(response.status).toBe(200)
            expect(response.body.results).toHaveLength(10)
            expect(response.body.count).toBe(25)
            expect(response.body.page).toBe(2)
            expect(response.body.total_pages).toBe(3)
        })

        it('should reject page_size over 100', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .get('/api/memos')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid, page_size: 101 })

            expect(response.status).toBe(400)
            expect(response.body.error).toBe('page_size must be less than or equal to 100')
        })

        it('should reject page less than 1', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .get('/api/memos')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid, page: -1 })

            expect(response.status).toBe(400)
            expect(response.body.error).toBe('page must be greater than or equal to 1')
        })
    })

    describe('DELETE /api/memos/:id - Delete Memo', () => {
        it('should delete a memo', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const memo = await createTestMemo(orm, project, {
                title: 'Test Memo',
                content: 'Test content',
            })
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .delete(`/api/memos/${memo.uuid}`)
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })

            expect(response.status).toBe(204)

            // Verify memo is deleted
            const em = orm.em.fork()
            const deletedMemo = await em.findOne(Memo, { uuid: memo.uuid })
            expect(deletedMemo).toBeNull()
        })

        it('should delete a memo by reference_id', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            await createTestMemo(orm, project, {
                title: 'Test Memo',
                content: 'Test content',
                client_reference_id: 'ref123',
            })
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .delete('/api/memos/ref123')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid, id_type: 'reference_id' })

            expect(response.status).toBe(204)
        })

        it('should return 404 for non-existent memo', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .delete('/api/memos/00000000-0000-0000-0000-000000000000')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })

            expect(response.status).toBe(404)
            expect(response.body.error).toBe('Memo not found')
        })
    })

    describe('Security - Cross-Project Access', () => {
        it('should not allow access to memos from another project', async () => {
            const user1 = await createTestUser(orm, 'user1@example.com', 'password123')
            const user2 = await createTestUser(orm, 'user2@example.com', 'password123')

            const org1 = await createTestOrganization(orm, 'Org 1', user1)
            const org2 = await createTestOrganization(orm, 'Org 2', user2)

            await createTestOrganizationMembership(orm, user1, org1)
            await createTestOrganizationMembership(orm, user2, org2)

            const project1 = await createTestProject(orm, 'Project 1', org1, user1)
            const project2 = await createTestProject(orm, 'Project 2', org2, user2)

            const memo2 = await createTestMemo(orm, project2, {
                title: 'User2 Memo',
                content: 'Private content',
            })

            const user1Token = generateAccessToken('user1@example.com')

            // User1 tries to access User2's memo
            const response = await request(app)
                .get(`/api/memos/${memo2.uuid}`)
                .set('Cookie', [`accessToken=${user1Token}`])
                .query({ project_id: project1.uuid })

            expect(response.status).toBe(404)
        })

        it('should not allow updating memos from another project', async () => {
            const user1 = await createTestUser(orm, 'user1@example.com', 'password123')
            const user2 = await createTestUser(orm, 'user2@example.com', 'password123')

            const org1 = await createTestOrganization(orm, 'Org 1', user1)
            const org2 = await createTestOrganization(orm, 'Org 2', user2)

            await createTestOrganizationMembership(orm, user1, org1)
            await createTestOrganizationMembership(orm, user2, org2)

            const project1 = await createTestProject(orm, 'Project 1', org1, user1)
            const project2 = await createTestProject(orm, 'Project 2', org2, user2)

            const memo2 = await createTestMemo(orm, project2, {
                title: 'User2 Memo',
                content: 'Private content',
            })

            const user1Token = generateAccessToken('user1@example.com')

            // User1 tries to update User2's memo
            const response = await request(app)
                .patch(`/api/memos/${memo2.uuid}`)
                .set('Cookie', [`accessToken=${user1Token}`])
                .query({ project_id: project1.uuid })
                .send({
                    title: 'Hacked Title',
                })

            expect(response.status).toBe(404)
        })

        it('should not allow deleting memos from another project', async () => {
            const user1 = await createTestUser(orm, 'user1@example.com', 'password123')
            const user2 = await createTestUser(orm, 'user2@example.com', 'password123')

            const org1 = await createTestOrganization(orm, 'Org 1', user1)
            const org2 = await createTestOrganization(orm, 'Org 2', user2)

            await createTestOrganizationMembership(orm, user1, org1)
            await createTestOrganizationMembership(orm, user2, org2)

            const project1 = await createTestProject(orm, 'Project 1', org1, user1)
            const project2 = await createTestProject(orm, 'Project 2', org2, user2)

            const memo2 = await createTestMemo(orm, project2, {
                title: 'User2 Memo',
                content: 'Private content',
            })

            const user1Token = generateAccessToken('user1@example.com')

            // User1 tries to delete User2's memo
            const response = await request(app)
                .delete(`/api/memos/${memo2.uuid}`)
                .set('Cookie', [`accessToken=${user1Token}`])
                .query({ project_id: project1.uuid })

            expect(response.status).toBe(404)

            // Verify memo is NOT deleted
            const em = orm.em.fork()
            const stillExists = await em.findOne(Memo, { uuid: memo2.uuid })
            expect(stillExists).not.toBeNull()
        })

        it('should not list memos from another project', async () => {
            const user1 = await createTestUser(orm, 'user1@example.com', 'password123')
            const user2 = await createTestUser(orm, 'user2@example.com', 'password123')

            const org1 = await createTestOrganization(orm, 'Org 1', user1)
            const org2 = await createTestOrganization(orm, 'Org 2', user2)

            await createTestOrganizationMembership(orm, user1, org1)
            await createTestOrganizationMembership(orm, user2, org2)

            const project1 = await createTestProject(orm, 'Project 1', org1, user1)
            const project2 = await createTestProject(orm, 'Project 2', org2, user2)

            await createTestMemo(orm, project1, { title: 'User1 Memo', content: 'Content 1' })
            await createTestMemo(orm, project2, { title: 'User2 Memo', content: 'Content 2' })

            const user1Token = generateAccessToken('user1@example.com')

            const response = await request(app)
                .get('/api/memos')
                .set('Cookie', [`accessToken=${user1Token}`])
                .query({ project_id: project1.uuid })

            expect(response.status).toBe(200)
            expect(response.body.results).toHaveLength(1)
            expect(response.body.results[0].title).toBe('User1 Memo')
        })

        it('should allow users in the same organization to access project memos', async () => {
            const user1 = await createTestUser(orm, 'user1@example.com', 'password123')
            const user2 = await createTestUser(orm, 'user2@example.com', 'password123')

            const org = await createTestOrganization(orm, 'Shared Org', user1)

            await createTestOrganizationMembership(orm, user1, org)
            await createTestOrganizationMembership(orm, user2, org)

            const project = await createTestProject(orm, 'Shared Project', org, user1)

            const memo = await createTestMemo(orm, project, {
                title: 'Shared Memo',
                content: 'Shared content',
            })

            const user2Token = generateAccessToken('user2@example.com')

            // User2 should be able to access the memo since they're in the same org
            const response = await request(app)
                .get(`/api/memos/${memo.uuid}`)
                .set('Cookie', [`accessToken=${user2Token}`])
                .query({ project_id: project.uuid })

            expect(response.status).toBe(200)
            expect(response.body.title).toBe('Shared Memo')
        })

        it('should prevent access when user is not an org member', async () => {
            const user1 = await createTestUser(orm, 'user1@example.com', 'password123')
            await createTestUser(orm, 'user2@example.com', 'password123')

            const org = await createTestOrganization(orm, 'Org', user1)
            await createTestOrganizationMembership(orm, user1, org)
            // user2 is NOT a member

            const project = await createTestProject(orm, 'Project', org, user1)

            const memo = await createTestMemo(orm, project, {
                title: 'Private Memo',
                content: 'Private content',
            })

            const user2Token = generateAccessToken('user2@example.com')

            const response = await request(app)
                .get(`/api/memos/${memo.uuid}`)
                .set('Cookie', [`accessToken=${user2Token}`])
                .query({ project_id: project.uuid })

            expect(response.status).toBe(403)
        })
    })

    describe('Input Validation & Security', () => {
        it('should handle XSS attempts in memo title', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            const xssPayload = '<script>alert("xss")</script>'

            const response = await request(app)
                .post('/api/memos')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })
                .send({
                    title: xssPayload,
                    content: 'Test content',
                })

            expect(response.status).toBe(201)
            // XSS should be stored but escaped on output by frontend
        })

        it('should handle very long content', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            const longContent = 'a'.repeat(1000000) // 1MB

            const response = await request(app)
                .post('/api/memos')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })
                .send({
                    title: 'Long Content Memo',
                    content: longContent,
                })

            // Should handle gracefully
            expect([201, 413, 500]).toContain(response.status)
        })

        it('should handle malformed metadata JSON', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post('/api/memos')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })
                .send({
                    title: 'Test Memo',
                    content: 'Test content',
                    metadata: 'not-an-object',
                })

            expect(response.status).toBe(400)
        })

        it('should handle null values in request', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post('/api/memos')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })
                .send({
                    title: null,
                    content: null,
                })

            expect(response.status).toBe(400)
        })
    })

    describe('GET /api/memos/:id/status - Get Memo Status', () => {
        it('should return processing status when memo status is received', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const memo = await createTestMemo(orm, project, {
                title: 'Test Memo',
                content: 'Test content',
            })
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .get(`/api/memos/${memo.uuid}/status`)
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })

            expect(response.status).toBe(200)
            expect(response.body.memo_uuid).toBe(memo.uuid)
            expect(response.body.status).toBe('processing') // 'received' transforms to 'processing'
            expect(response.body.processing_started_at).toBeNull()
            expect(response.body.processing_completed_at).toBeNull()
            expect(response.body.error_reason).toBeNull()
        })

        it('should return processing status when memo is being processed', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const memo = await createTestMemo(orm, project, {
                title: 'Test Memo',
                content: 'Test content',
            })

            // Update memo to processing status
            const em = orm.em.fork()
            const memoToUpdate = await em.findOne(Memo, { uuid: memo.uuid })
            if (memoToUpdate) {
                memoToUpdate.processing_status = 'processing'
                memoToUpdate.processing_started_at = new Date()
                await em.persistAndFlush(memoToUpdate)
            }

            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .get(`/api/memos/${memo.uuid}/status`)
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })

            expect(response.status).toBe(200)
            expect(response.body.status).toBe('processing')
            expect(response.body.processing_started_at).toBeDefined()
            expect(response.body.processing_completed_at).toBeNull()
        })

        it('should return processed status when memo processing is complete', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const memo = await createTestMemo(orm, project, {
                title: 'Test Memo',
                content: 'Test content',
            })

            // Update memo to processed status
            const em = orm.em.fork()
            const memoToUpdate = await em.findOne(Memo, { uuid: memo.uuid })
            if (memoToUpdate) {
                memoToUpdate.processing_status = 'processed'
                memoToUpdate.processing_started_at = new Date()
                memoToUpdate.processing_completed_at = new Date()
                await em.persistAndFlush(memoToUpdate)
            }

            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .get(`/api/memos/${memo.uuid}/status`)
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })

            expect(response.status).toBe(200)
            expect(response.body.status).toBe('processed')
            expect(response.body.processing_started_at).toBeDefined()
            expect(response.body.processing_completed_at).toBeDefined()
            expect(response.body.error_reason).toBeNull()
        })

        it('should return error status with error reason when memo processing fails', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const memo = await createTestMemo(orm, project, {
                title: 'Test Memo',
                content: 'Test content',
            })

            // Update memo to error status
            const em = orm.em.fork()
            const memoToUpdate = await em.findOne(Memo, { uuid: memo.uuid })
            if (memoToUpdate) {
                memoToUpdate.processing_status = 'error'
                memoToUpdate.processing_started_at = new Date()
                memoToUpdate.processing_completed_at = new Date()
                memoToUpdate.processing_error = 'Failed to generate embeddings'
                await em.persistAndFlush(memoToUpdate)
            }

            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .get(`/api/memos/${memo.uuid}/status`)
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })

            expect(response.status).toBe(200)
            expect(response.body.status).toBe('error')
            expect(response.body.error_reason).toBe('Failed to generate embeddings')
        })

        it('should get memo status by reference_id', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const memo = await createTestMemo(orm, project, {
                title: 'Test Memo',
                content: 'Test content',
                client_reference_id: 'ref123',
            })
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .get('/api/memos/ref123/status')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid, id_type: 'reference_id' })

            expect(response.status).toBe(200)
            expect(response.body.memo_uuid).toBe(memo.uuid)
            expect(response.body.status).toBe('processing')
        })

        it('should return 404 for non-existent memo status', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .get('/api/memos/00000000-0000-0000-0000-000000000000/status')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })

            expect(response.status).toBe(404)
            expect(response.body.error).toBe('Memo not found')
        })

        it('should set appropriate cache headers for processed status', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const memo = await createTestMemo(orm, project, {
                title: 'Test Memo',
                content: 'Test content',
            })

            // Update memo to processed status
            const em = orm.em.fork()
            const memoToUpdate = await em.findOne(Memo, { uuid: memo.uuid })
            if (memoToUpdate) {
                memoToUpdate.processing_status = 'processed'
                await em.persistAndFlush(memoToUpdate)
            }

            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .get(`/api/memos/${memo.uuid}/status`)
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })

            expect(response.status).toBe(200)
            expect(response.headers['cache-control']).toContain('immutable')
        })

        it('should set no-cache header for processing status', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const memo = await createTestMemo(orm, project, {
                title: 'Test Memo',
                content: 'Test content',
            })
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .get(`/api/memos/${memo.uuid}/status`)
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })

            expect(response.status).toBe(200)
            expect(response.headers['cache-control']).toBe('no-cache')
        })

        it('should require authentication', async () => {
            const response = await request(app).get('/api/memos/test-uuid/status')

            expect(response.status).toBe(403)
        })

        it('should not allow access to status from another project', async () => {
            const user1 = await createTestUser(orm, 'user1@example.com', 'password123')
            const user2 = await createTestUser(orm, 'user2@example.com', 'password123')

            const org1 = await createTestOrganization(orm, 'Org 1', user1)
            const org2 = await createTestOrganization(orm, 'Org 2', user2)

            await createTestOrganizationMembership(orm, user1, org1)
            await createTestOrganizationMembership(orm, user2, org2)

            const project1 = await createTestProject(orm, 'Project 1', org1, user1)
            const project2 = await createTestProject(orm, 'Project 2', org2, user2)

            const memo2 = await createTestMemo(orm, project2, {
                title: 'User2 Memo',
                content: 'Private content',
            })

            const user1Token = generateAccessToken('user1@example.com')

            // User1 tries to access User2's memo status
            const response = await request(app)
                .get(`/api/memos/${memo2.uuid}/status`)
                .set('Cookie', [`accessToken=${user1Token}`])
                .query({ project_id: project1.uuid })

            expect(response.status).toBe(404)
        })
    })
})
