import express, { Express } from 'express'
import request from 'supertest'
import { MikroORM, RequestContext } from '@mikro-orm/postgresql'
import { DI } from '../di'
import { createTestDatabase, clearDatabase, closeDatabase } from './testDb'
import {
    createTestUser,
    createTestOrganization,
    createTestProject,
    createTestOrganizationMembership,
} from './testHelpers'
import { generateAccessToken } from '../lib/tokenUtils'
import { userMiddleware } from '../middleware/userMiddleware'
import { requireProjectAccess } from '../middleware/authMiddleware'
import { User } from '../entities/User'
import { Project } from '../entities/Project'
import { Organization } from '../entities/Organization'
import { OrganizationMembership } from '../entities/OrganizationMembership'
import cookieParser from 'cookie-parser'
import { chat } from '../api/chat'
import * as chatAgentPreprocessing from '../agents/chatAgent/preprocessing'
import * as chatAgent from '../agents/chatAgent/chatAgent'

// Mock external dependencies
jest.mock('../agents/chatAgent/preprocessing')
jest.mock('../agents/chatAgent/chatAgent')

describe('Chat API', () => {
    let app: Express
    let orm: MikroORM

    beforeAll(async () => {
        orm = await createTestDatabase()
        DI.orm = orm
        DI.em = orm.em
        DI.users = orm.em.getRepository(User)
        DI.projects = orm.em.getRepository(Project)
        DI.organizations = orm.em.getRepository(Organization)
        DI.organizationMemberships = orm.em.getRepository(OrganizationMembership)

        app = express()
        app.use(express.json())
        app.use(cookieParser())
        app.use((req, res, next) => RequestContext.create(orm.em, next))
        app.use(userMiddleware())
        app.post('/api/chat', [requireProjectAccess()], chat)
    })

    afterAll(async () => {
        await closeDatabase(orm)
    })

    afterEach(async () => {
        await clearDatabase(orm)
        jest.clearAllMocks()
    })

    describe('POST /api/chat', () => {
        it('should return chat response with valid query', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            const mockRerankedResults = [
                { document: 'Result 1 content', score: 0.9 },
                { document: 'Result 2 content', score: 0.8 },
            ]

            const mockChatResult = {
                output: 'This is the AI response',
                intermediate_steps: [],
            }

            ;(chatAgentPreprocessing.prepareContextForChatAgent as jest.Mock).mockResolvedValue(mockRerankedResults)
            ;(chatAgent.runChatAgent as jest.Mock).mockResolvedValue(mockChatResult)

            const response = await request(app)
                .post('/api/chat')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })
                .send({
                    query: 'What is in the documents?',
                })

            expect(response.status).toBe(200)
            expect(response.body.ok).toBe(true)
            expect(response.body.response).toBe('This is the AI response')
            expect(response.body.intermediate_steps).toEqual([])
        })

        it('should return 400 when query is missing', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post('/api/chat')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })
                .send({})

            expect(response.status).toBe(400)
            expect(response.body.error).toBe('Query is required')
        })

        it('should return 400 when filters is not an array', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post('/api/chat')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })
                .send({
                    query: 'test query',
                    filters: 'not-an-array',
                })

            expect(response.status).toBe(400)
            expect(response.body.error).toBe('Filters must be a list')
        })

        it('should use empty filters array by default', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            ;(chatAgentPreprocessing.prepareContextForChatAgent as jest.Mock).mockResolvedValue([])
            ;(chatAgent.runChatAgent as jest.Mock).mockResolvedValue({ output: 'response', intermediate_steps: [] })

            await request(app)
                .post('/api/chat')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })
                .send({
                    query: 'test query',
                })

            expect(chatAgentPreprocessing.prepareContextForChatAgent).toHaveBeenCalledWith(
                'test query',
                expect.anything(),
                []
            )
        })

        it('should return 400 for invalid filter', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post('/api/chat')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })
                .send({
                    query: 'test query',
                    filters: [{ invalid: 'filter' }],
                })

            expect(response.status).toBe(400)
            expect(response.body.error).toBe('Invalid filter: Filter must have field, operator, value, and filter_type')
        })

        // FIXME: it should *not* return a 500
        it('should return 503 when chat agent fails', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            ;(chatAgentPreprocessing.prepareContextForChatAgent as jest.Mock).mockResolvedValue([])
            ;(chatAgent.runChatAgent as jest.Mock).mockRejectedValue(new Error('Chat agent error'))

            const response = await request(app)
                .post('/api/chat')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })
                .send({
                    query: 'test query',
                })

            expect(response.status).toBe(503)
            expect(response.body.error).toBe('Chat agent unavailable')
        })

        it('should return 403 for unauthenticated users', async () => {
            const response = await request(app).post('/api/chat').send({
                query: 'test query',
            })

            expect(response.status).toBe(403)
        })

        it('should return 400 when project_id is missing', async () => {
            await createTestUser(orm, 'test@example.com', 'password123')
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post('/api/chat')
                .set('Cookie', [`accessToken=${token}`])
                .send({
                    query: 'test query',
                })

            expect(response.status).toBe(400)
            expect(response.body.error).toBe('Project ID is required')
        })

        it('should return 403 for users not in project organization', async () => {
            const user1 = await createTestUser(orm, 'user1@example.com', 'password123')
            const user2 = await createTestUser(orm, 'user2@example.com', 'password123')

            const org1 = await createTestOrganization(orm, 'Org 1', user1)
            const org2 = await createTestOrganization(orm, 'Org 2', user2)

            await createTestOrganizationMembership(orm, user1, org1)
            await createTestOrganizationMembership(orm, user2, org2)

            const project2 = await createTestProject(orm, 'Project 2', org2, user2)

            const user1Token = generateAccessToken('user1@example.com')

            const response = await request(app)
                .post('/api/chat')
                .set('Cookie', [`accessToken=${user1Token}`])
                .query({ project_id: project2.uuid })
                .send({
                    query: 'test query',
                })

            expect(response.status).toBe(403)
        })

        it('should handle streaming response', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            const mockRerankedResults = [{ document: 'Result 1', score: 0.9 }]

            async function* mockStreamGenerator() {
                yield { content: 'chunk1' }
                yield { content: 'chunk2' }
            }

            ;(chatAgentPreprocessing.prepareContextForChatAgent as jest.Mock).mockResolvedValue(mockRerankedResults)
            ;(chatAgent.streamChatAgent as jest.Mock).mockReturnValue(mockStreamGenerator())

            const response = await request(app)
                .post('/api/chat')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })
                .send({
                    query: 'test query',
                    stream: true,
                })

            // For streaming responses, we just check that it starts successfully
            // Full streaming testing would require more complex setup
            expect(response.status).toBe(200)
        })

        it('should format context string from reranked results', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            const mockRerankedResults = [
                { document: 'First result', score: 0.9 },
                { document: 'Second result', score: 0.8 },
            ]

            ;(chatAgentPreprocessing.prepareContextForChatAgent as jest.Mock).mockResolvedValue(mockRerankedResults)
            ;(chatAgent.runChatAgent as jest.Mock).mockResolvedValue({ output: 'response', intermediate_steps: [] })

            await request(app)
                .post('/api/chat')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })
                .send({
                    query: 'test query',
                })

            expect(chatAgent.runChatAgent).toHaveBeenCalledWith(
                'test query',
                'Result 1: First result\n\nResult 2: Second result\n\n'
            )
        })
    })
})
