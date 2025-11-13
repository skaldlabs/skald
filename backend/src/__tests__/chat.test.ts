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
    createTestChat,
} from './testHelpers'
import { generateAccessToken } from '../lib/tokenUtils'
import { userMiddleware } from '../middleware/userMiddleware'
import { User } from '../entities/User'
import { Project } from '../entities/Project'
import { Organization } from '../entities/Organization'
import { OrganizationMembership } from '../entities/OrganizationMembership'
import cookieParser from 'cookie-parser'
import { chatRouter } from '../api/chat'
import * as chatAgentPreprocessing from '../agents/chatAgent/preprocessing'
import * as chatAgent from '../agents/chatAgent/chatAgent'
import { ChatMessage } from '@/entities/ChatMessage'
import { Chat } from '@/entities/Chat'
import { randomUUID } from 'crypto'
import { rewrite } from '../agents/chatAgent/queryRewrite'
import { LLMService } from '../services/llmService'

// Mock external dependencies
jest.mock('../agents/chatAgent/preprocessing')
jest.mock('../agents/chatAgent/chatAgent')
jest.mock('../services/llmService')
jest.mock('@sentry/node', () => ({
    captureException: jest.fn(),
}))
jest.mock('../lib/logger', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    },
}))
jest.mock('../settings', () => {
    const originalModule = jest.requireActual('../settings')
    return {
        ...originalModule,
        SECRET_KEY: process.env.SECRET_KEY || 'UNSAFE_DEFAULT_SECRET_KEY',
    }
})

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
        DI.chats = orm.em.getRepository(Chat)
        DI.chatMessages = orm.em.getRepository(ChatMessage)

        app = express()
        app.use(express.json())
        app.use(cookieParser())
        app.use((req, res, next) => RequestContext.create(orm.em, next))
        app.use(userMiddleware())
        app.use('/api/chat', chatRouter)
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

        it('should create a chat message pair when chat_id is not provided', async () => {
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

            const em = orm.em.fork()
            const chats = await em.find(Chat, { project: project.uuid })
            expect(chats).toHaveLength(1)
            const chat = chats[0]
            expect(chat.project.uuid).toBe(project.uuid)
            expect(chat.created_at).toBeDefined()

            const chatMessages = await em.find(ChatMessage, { chat: chat.uuid })
            expect(chatMessages).toHaveLength(2)
            expect(chatMessages[0].chat.uuid).toBe(chat.uuid)
            expect(chatMessages[0].content).toBe('What is in the documents?')
        })

        it('it should create messages for an existing chat if chat_id is provided', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const testChat = await createTestChat(orm, project)
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
                    chat_id: testChat.uuid,
                })

            expect(response.status).toBe(200)

            const em = orm.em.fork()
            const chatMessages = await em.find(ChatMessage, { chat: testChat.uuid })
            expect(chatMessages).toHaveLength(2)
            expect(chatMessages[0].chat.uuid).toBe(testChat.uuid)
            expect(chatMessages[0].content).toBe('What is in the documents?')
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

            expect(chatAgent.runChatAgent).toHaveBeenCalledWith({
                query: 'test query',
                context: 'Result 1: First result\n\nResult 2: Second result\n\n',
                clientSystemPrompt: null,
                conversationHistory: [],
                rerankResults: mockRerankedResults,
                options: {
                    llmProvider: 'openai',
                    enableReferences: false,
                },
            })
        })

        it('should pass custom prompt to chat agent when provided', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            const mockRerankedResults = [{ document: 'Result content', score: 0.9 }]

            ;(chatAgentPreprocessing.prepareContextForChatAgent as jest.Mock).mockResolvedValue(mockRerankedResults)
            ;(chatAgent.runChatAgent as jest.Mock).mockResolvedValue({ output: 'response', intermediate_steps: [] })

            const customPrompt = 'You are a helpful assistant focused on technical documentation.'

            await request(app)
                .post('/api/chat')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })
                .send({
                    query: 'test query',
                    system_prompt: customPrompt,
                })

            expect(chatAgent.runChatAgent).toHaveBeenCalledWith({
                query: 'test query',
                context: 'Result 1: Result content\n\n',
                clientSystemPrompt: customPrompt,
                conversationHistory: [],
                rerankResults: mockRerankedResults,
                options: {
                    llmProvider: 'openai',
                    enableReferences: false,
                },
            })

            const em = orm.em.fork()
            const chatMessages = await em.find(ChatMessage, { project: project.uuid }, { orderBy: { sent_at: 'ASC' } })
            expect(chatMessages).toHaveLength(2)

            // ensure the client system prompt has been saved to the first message
            expect(chatMessages[0].client_system_prompt).toBe(customPrompt)

            // ensure the model and user messages are in the same message group
            expect(chatMessages[0].message_group_id).toEqual(chatMessages[1].message_group_id)
        })

        it('should pass null prompt to chat agent when not provided', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            const mockRerankedResults = [{ document: 'Result content', score: 0.9 }]

            ;(chatAgentPreprocessing.prepareContextForChatAgent as jest.Mock).mockResolvedValue(mockRerankedResults)
            ;(chatAgent.runChatAgent as jest.Mock).mockResolvedValue({ output: 'response', intermediate_steps: [] })

            await request(app)
                .post('/api/chat')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })
                .send({
                    query: 'test query',
                })

            expect(chatAgent.runChatAgent).toHaveBeenCalledWith({
                query: 'test query',
                context: 'Result 1: Result content\n\n',
                clientSystemPrompt: null,
                conversationHistory: [],
                rerankResults: mockRerankedResults,
                options: {
                    llmProvider: 'openai',
                    enableReferences: false,
                },
            })
        })

        it('should pass client system prompt to streaming chat agent when provided', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            const mockRerankedResults = [{ document: 'Result content', score: 0.9 }]

            async function* mockStreamGenerator() {
                yield { content: 'chunk1' }
                yield { content: 'chunk2' }
            }

            ;(chatAgentPreprocessing.prepareContextForChatAgent as jest.Mock).mockResolvedValue(mockRerankedResults)
            ;(chatAgent.streamChatAgent as jest.Mock).mockReturnValue(mockStreamGenerator())

            const clientSystemPrompt = 'Answer in a concise manner.'

            await request(app)
                .post('/api/chat')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })
                .send({
                    query: 'test query',
                    stream: true,
                    system_prompt: clientSystemPrompt,
                })

            expect(chatAgent.streamChatAgent).toHaveBeenCalledWith({
                query: 'test query',
                context: 'Result 1: Result content\n\n',
                clientSystemPrompt: clientSystemPrompt,
                conversationHistory: [],
                rerankResults: mockRerankedResults,
                options: {
                    llmProvider: 'openai',
                    enableReferences: false,
                },
            })
            // check that the created chat messages have the correct client system prompt
            const em = orm.em.fork()
            const chatMessages = await em.find(ChatMessage, { project: project.uuid }, { orderBy: { sent_at: 'ASC' } })
            expect(chatMessages).toHaveLength(2)

            // ensure the client system prompt has been saved to the first message
            expect(chatMessages[0].client_system_prompt).toBe(clientSystemPrompt)

            // ensure the model and user messages are in the same message group
            expect(chatMessages[0].message_group_id).toEqual(chatMessages[1].message_group_id)
        })

        it('should pass null client system prompt to streaming chat agent when not provided', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            const mockRerankedResults = [{ document: 'Result content', score: 0.9 }]

            async function* mockStreamGenerator() {
                yield { content: 'chunk1' }
                yield { content: 'chunk2' }
            }

            ;(chatAgentPreprocessing.prepareContextForChatAgent as jest.Mock).mockResolvedValue(mockRerankedResults)
            ;(chatAgent.streamChatAgent as jest.Mock).mockReturnValue(mockStreamGenerator())

            await request(app)
                .post('/api/chat')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })
                .send({
                    query: 'test query',
                    stream: true,
                })

            expect(chatAgent.streamChatAgent).toHaveBeenCalledWith({
                query: 'test query',
                context: 'Result 1: Result content\n\n',
                clientSystemPrompt: null,
                conversationHistory: [],
                rerankResults: mockRerankedResults,
                options: {
                    llmProvider: 'openai',
                    enableReferences: false,
                },
            })
        })

        it('should return chat_id in non-streaming response', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            const mockRerankedResults = [{ document: 'Result content', score: 0.9 }]

            ;(chatAgentPreprocessing.prepareContextForChatAgent as jest.Mock).mockResolvedValue(mockRerankedResults)
            ;(chatAgent.runChatAgent as jest.Mock).mockResolvedValue({ output: 'response', intermediate_steps: [] })

            const response = await request(app)
                .post('/api/chat')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })
                .send({
                    query: 'test query',
                })

            expect(response.status).toBe(200)
            expect(response.body.chat_id).toBeDefined()
            expect(typeof response.body.chat_id).toBe('string')
        })

        it('should return chat_id in streaming response done event', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            const mockRerankedResults = [{ document: 'Result content', score: 0.9 }]

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

            expect(response.status).toBe(200)
            expect(response.text).toContain('chat_id')
        })

        it('should accept chat_id parameter', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const testChat = await createTestChat(orm, project)
            const token = generateAccessToken('test@example.com')

            const mockRerankedResults = [{ document: 'Result content', score: 0.9 }]

            ;(chatAgentPreprocessing.prepareContextForChatAgent as jest.Mock).mockResolvedValue(mockRerankedResults)
            ;(chatAgent.runChatAgent as jest.Mock).mockResolvedValue({ output: 'response', intermediate_steps: [] })

            const response = await request(app)
                .post('/api/chat')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })
                .send({
                    query: 'test query',
                    chat_id: testChat.uuid,
                })

            expect(response.status).toBe(200)
            expect(response.body.chat_id).toBe(testChat.uuid)
        })

        it('should pass conversation history to chat agent when chat_id provided', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const testChat = await createTestChat(orm, project)
            const token = generateAccessToken('test@example.com')

            // Create some existing messages
            const em = orm.em.fork()
            const userMessage = em.create(ChatMessage, {
                uuid: randomUUID(),
                message_group_id: randomUUID(),
                project: project,
                chat: testChat,
                content: 'Previous user message',
                sent_by: 'user',
                sent_at: new Date(Date.now() - 1000),
            })
            const modelMessage = em.create(ChatMessage, {
                uuid: randomUUID(),
                message_group_id: userMessage.message_group_id,
                project: project,
                chat: testChat,
                content: 'Previous model response',
                sent_by: 'model',
                sent_at: new Date(Date.now() - 500),
            })
            await em.persistAndFlush([userMessage, modelMessage])

            const mockRerankedResults = [{ document: 'Result content', score: 0.9 }]

            ;(chatAgentPreprocessing.prepareContextForChatAgent as jest.Mock).mockResolvedValue(mockRerankedResults)
            ;(chatAgent.runChatAgent as jest.Mock).mockResolvedValue({ output: 'response', intermediate_steps: [] })

            await request(app)
                .post('/api/chat')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })
                .send({
                    query: 'new query',
                    chat_id: testChat.uuid,
                })

            // Verify that runChatAgent was called with conversation history
            expect(chatAgent.runChatAgent).toHaveBeenCalled()
            const callArgs = (chatAgent.runChatAgent as jest.Mock).mock.calls[0][0]
            expect(callArgs.query).toBe('new query')
            expect(callArgs.conversationHistory).toBeDefined()
            expect(Array.isArray(callArgs.conversationHistory)).toBe(true)
            // Should have previous messages in history
            expect(callArgs.conversationHistory.length).toBeGreaterThan(0)
        })

        it('should not pass conversation history when chat_id not provided', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            const mockRerankedResults = [{ document: 'Result content', score: 0.9 }]

            ;(chatAgentPreprocessing.prepareContextForChatAgent as jest.Mock).mockResolvedValue(mockRerankedResults)
            ;(chatAgent.runChatAgent as jest.Mock).mockResolvedValue({ output: 'response', intermediate_steps: [] })

            await request(app)
                .post('/api/chat')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })
                .send({
                    query: 'test query',
                })

            // Verify that runChatAgent was called with empty conversation history
            expect(chatAgent.runChatAgent).toHaveBeenCalled()
            const callArgs = (chatAgent.runChatAgent as jest.Mock).mock.calls[0][0]
            expect(callArgs.conversationHistory).toEqual([]) // conversationHistory should be empty array
        })

        it('should create new chat when invalid chat_id provided', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            const mockRerankedResults = [{ document: 'Result content', score: 0.9 }]

            ;(chatAgentPreprocessing.prepareContextForChatAgent as jest.Mock).mockResolvedValue(mockRerankedResults)
            ;(chatAgent.runChatAgent as jest.Mock).mockResolvedValue({ output: 'response', intermediate_steps: [] })

            const invalidChatId = randomUUID()

            const response = await request(app)
                .post('/api/chat')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })
                .send({
                    query: 'test query',
                    chat_id: invalidChatId,
                })

            expect(response.status).toBe(200)
            // Should return a new chat_id, not the invalid one
            expect(response.body.chat_id).toBeDefined()
            expect(response.body.chat_id).not.toBe(invalidChatId)
        })

        it('should scope chat history to correct project', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project1 = await createTestProject(orm, 'Project 1', org, user)
            const project2 = await createTestProject(orm, 'Project 2', org, user)
            const testChat = await createTestChat(orm, project1)
            const token = generateAccessToken('test@example.com')

            // Create messages in project1's chat
            const em = orm.em.fork()
            const userMessage = em.create(ChatMessage, {
                uuid: randomUUID(),
                message_group_id: randomUUID(),
                project: project1,
                chat: testChat,
                content: 'Message in project 1',
                sent_by: 'user',
                sent_at: new Date(),
            })
            await em.persistAndFlush([userMessage])

            const mockRerankedResults = [{ document: 'Result content', score: 0.9 }]

            ;(chatAgentPreprocessing.prepareContextForChatAgent as jest.Mock).mockResolvedValue(mockRerankedResults)
            ;(chatAgent.runChatAgent as jest.Mock).mockResolvedValue({ output: 'response', intermediate_steps: [] })

            // Try to access chat from project2 (should not see project1's messages)
            await request(app)
                .post('/api/chat')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project2.uuid })
                .send({
                    query: 'test query',
                    chat_id: testChat.uuid,
                })

            // Should create a new chat since chat doesn't belong to project2
            const em2 = orm.em.fork()
            const chats = await em2.find(Chat, { project: project2.uuid })
            expect(chats.length).toBeGreaterThan(0)
        })

        it('should pass conversation history and llmProvider to runChatAgent', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const testChat = await createTestChat(orm, project)
            const token = generateAccessToken('test@example.com')

            // Create some existing messages
            const em = orm.em.fork()
            const userMessage = em.create(ChatMessage, {
                uuid: randomUUID(),
                message_group_id: randomUUID(),
                project: project,
                chat: testChat,
                content: 'What is authentication?',
                sent_by: 'user',
                sent_at: new Date(Date.now() - 1000),
            })
            const modelMessage = em.create(ChatMessage, {
                uuid: randomUUID(),
                message_group_id: userMessage.message_group_id,
                project: project,
                chat: testChat,
                content: 'Authentication is the process of verifying identity...',
                sent_by: 'model',
                sent_at: new Date(Date.now() - 500),
            })
            await em.persistAndFlush([userMessage, modelMessage])

            const mockRerankedResults = [{ document: 'Result content', score: 0.9 }]

            ;(chatAgentPreprocessing.prepareContextForChatAgent as jest.Mock).mockResolvedValue(mockRerankedResults)
            ;(chatAgent.runChatAgent as jest.Mock).mockResolvedValue({ output: 'response', intermediate_steps: [] })

            await request(app)
                .post('/api/chat')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })
                .send({
                    query: 'tell me more',
                    chat_id: testChat.uuid,
                    llm_provider: 'anthropic',
                })

            // Verify that prepareContextForChatAgent was called with only query, project, and filters
            expect(chatAgentPreprocessing.prepareContextForChatAgent).toHaveBeenCalled()
            const prepareContextArgs = (chatAgentPreprocessing.prepareContextForChatAgent as jest.Mock).mock.calls[0]
            expect(prepareContextArgs[0]).toBe('tell me more') // query
            expect(prepareContextArgs[1]).toBeDefined() // project
            expect(prepareContextArgs[2]).toEqual([]) // filters (empty array)
            expect(prepareContextArgs.length).toBe(3) // Only 3 arguments

            // Verify that runChatAgent was called with conversation history and llmProvider
            expect(chatAgent.runChatAgent).toHaveBeenCalled()
            const runChatArgs = (chatAgent.runChatAgent as jest.Mock).mock.calls[0][0]
            expect(runChatArgs.query).toBe('tell me more')
            expect(runChatArgs.conversationHistory).toBeDefined()
            expect(Array.isArray(runChatArgs.conversationHistory)).toBe(true)
            expect(runChatArgs.conversationHistory.length).toBeGreaterThan(0) // Should have conversation history
            expect(runChatArgs.options.llmProvider).toBe('anthropic') // llmProvider
        })

        it('should pass default llm provider to runChatAgent when not specified', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            const mockRerankedResults = [{ document: 'Result content', score: 0.9 }]

            ;(chatAgentPreprocessing.prepareContextForChatAgent as jest.Mock).mockResolvedValue(mockRerankedResults)
            ;(chatAgent.runChatAgent as jest.Mock).mockResolvedValue({ output: 'response', intermediate_steps: [] })

            await request(app)
                .post('/api/chat')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })
                .send({
                    query: 'test query',
                })

            // Verify that runChatAgent was called with default LLM_PROVIDER
            expect(chatAgent.runChatAgent).toHaveBeenCalled()
            const runChatArgs = (chatAgent.runChatAgent as jest.Mock).mock.calls[0][0]
            expect(runChatArgs.options.llmProvider).toBe('openai') // Default LLM_PROVIDER from mocked settings
        })
    })

    describe('GET /api/chat/', () => {
        it('should list all chats for a project', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            // Create test chats with messages
            const em = orm.em.fork()
            const chat1 = await createTestChat(orm, project)
            const chat2 = await createTestChat(orm, project)

            // Add messages to chat1
            const message1 = em.create(ChatMessage, {
                uuid: randomUUID(),
                message_group_id: randomUUID(),
                project: project,
                chat: chat1,
                content: 'First question',
                sent_by: 'user',
                sent_at: new Date(Date.now() - 1000),
            })
            const message2 = em.create(ChatMessage, {
                uuid: randomUUID(),
                message_group_id: message1.message_group_id,
                project: project,
                chat: chat1,
                content: 'First response',
                sent_by: 'model',
                sent_at: new Date(Date.now() - 500),
            })

            // Add messages to chat2
            const message3 = em.create(ChatMessage, {
                uuid: randomUUID(),
                message_group_id: randomUUID(),
                project: project,
                chat: chat2,
                content: 'Second question',
                sent_by: 'user',
                sent_at: new Date(),
            })

            await em.persistAndFlush([message1, message2, message3])

            const response = await request(app)
                .get('/api/chat/')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })

            expect(response.status).toBe(200)
            expect(response.body.results).toHaveLength(2)
            expect(response.body.count).toBe(2)
            expect(response.body.results[0].title).toBeDefined()
            expect(response.body.results[0].message_count).toBeGreaterThan(0)
        })

        it('should return empty list when no chats exist', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .get('/api/chat/')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })

            expect(response.status).toBe(200)
            expect(response.body.results).toHaveLength(0)
            expect(response.body.count).toBe(0)
        })

        it('should support pagination', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            // Create 3 chats
            await createTestChat(orm, project)
            await createTestChat(orm, project)
            await createTestChat(orm, project)

            const response = await request(app)
                .get('/api/chat/')
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid, page: 1, page_size: 2 })

            expect(response.status).toBe(200)
            expect(response.body.results).toHaveLength(2)
            expect(response.body.count).toBe(3)
            expect(response.body.page).toBe(1)
            expect(response.body.page_size).toBe(2)
            expect(response.body.total_pages).toBe(2)
        })
    })

    describe('GET /api/chat/:id', () => {
        it('should return chat details with all messages', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            const testChat = await createTestChat(orm, project)

            // Add messages
            const em = orm.em.fork()
            const message1 = em.create(ChatMessage, {
                uuid: randomUUID(),
                message_group_id: randomUUID(),
                project: project,
                chat: testChat,
                content: 'User question',
                sent_by: 'user',
                sent_at: new Date(Date.now() - 1000),
            })
            const message2 = em.create(ChatMessage, {
                uuid: randomUUID(),
                message_group_id: message1.message_group_id,
                project: project,
                chat: testChat,
                content: 'Model response',
                sent_by: 'model',
                sent_at: new Date(),
            })
            await em.persistAndFlush([message1, message2])

            const response = await request(app)
                .get(`/api/chat/${testChat.uuid}`)
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })

            expect(response.status).toBe(200)
            expect(response.body.uuid).toBe(testChat.uuid)
            expect(response.body.messages).toHaveLength(2)
            expect(response.body.messages[0].content).toBe('User question')
            expect(response.body.messages[1].content).toBe('Model response')
        })

        it('should return 404 for non-existent chat', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            const nonExistentChatId = randomUUID()

            const response = await request(app)
                .get(`/api/chat/${nonExistentChatId}`)
                .set('Cookie', [`accessToken=${token}`])
                .query({ project_id: project.uuid })

            expect(response.status).toBe(404)
            expect(response.body.error).toBe('Chat not found')
        })
    })

    describe('Query Rewrite', () => {
        beforeEach(() => {
            jest.clearAllMocks()
        })

        describe('rewrite', () => {
            it('should call LLMService.getLLM with correct parameters', async () => {
                const mockInvoke = jest.fn().mockResolvedValue({
                    content: 'How to authenticate users with API?',
                })

                const mockLLM = {
                    invoke: mockInvoke,
                }

                ;(LLMService.getLLM as jest.Mock).mockReturnValue(mockLLM)

                const query = 'how to auth users api'
                const result = await rewrite(query, [])

                expect(LLMService.getLLM).toHaveBeenCalledWith(0.3)
                expect(mockInvoke).toHaveBeenCalledWith([
                    { role: 'system', content: expect.any(String) },
                    { role: 'user', content: expect.stringContaining(query) },
                ])
                expect(result).toBe('How to authenticate users with API?')
            })

            it('should include conversation history in the prompt', async () => {
                const mockInvoke = jest.fn().mockResolvedValue({
                    content: 'Tell me more about database migrations',
                })

                const mockLLM = {
                    invoke: mockInvoke,
                }

                ;(LLMService.getLLM as jest.Mock).mockReturnValue(mockLLM)

                const query = 'tell me more'
                const conversationHistory = [
                    { role: 'user' as const, content: 'What are database migrations?' },
                    { role: 'assistant' as const, content: 'Database migrations are...' },
                ]

                await rewrite(query, conversationHistory)

                const callArgs = mockInvoke.mock.calls[0][0]
                const userMessage = callArgs[1].content

                expect(userMessage).toContain('CONVERSATION CONTEXT')
                expect(userMessage).toContain('What are database migrations?')
                expect(userMessage).toContain('Database migrations are...')
            })

            it('should return original query on API error', async () => {
                const mockInvoke = jest.fn().mockRejectedValue(new Error('API Error'))

                const mockLLM = {
                    invoke: mockInvoke,
                }

                ;(LLMService.getLLM as jest.Mock).mockReturnValue(mockLLM)

                const query = 'how to auth'
                const result = await rewrite(query, [])

                expect(result).toBe(query) // Should fall back to original
            })

            it('should return original query when LLM returns empty response', async () => {
                const mockInvoke = jest.fn().mockResolvedValue({
                    content: '',
                })

                const mockLLM = {
                    invoke: mockInvoke,
                }

                ;(LLMService.getLLM as jest.Mock).mockReturnValue(mockLLM)

                const query = 'how to auth'
                const result = await rewrite(query, [])

                expect(result).toBe(query)
            })

            it('should limit conversation history to last 3 conversation pairs', async () => {
                const mockInvoke = jest.fn().mockResolvedValue({
                    content: 'Enhanced query',
                })

                const mockLLM = {
                    invoke: mockInvoke,
                }

                ;(LLMService.getLLM as jest.Mock).mockReturnValue(mockLLM)

                const query = 'tell me more'
                const conversationHistory = [
                    { role: 'user' as const, content: 'Message 1' },
                    { role: 'assistant' as const, content: 'Response 1' },
                    { role: 'user' as const, content: 'Message 2' },
                    { role: 'assistant' as const, content: 'Response 2' },
                    { role: 'user' as const, content: 'Message 3' },
                    { role: 'assistant' as const, content: 'Response 3' },
                    { role: 'user' as const, content: 'Message 4' },
                    { role: 'assistant' as const, content: 'Response 4' },
                ]

                await rewrite(query, conversationHistory)

                const callArgs = mockInvoke.mock.calls[0][0]
                const userMessage = callArgs[1].content

                // Should only include last 3 messages from the 8-element array
                // slice(-3) gives indices [5, 6, 7] which are: Response 3, Message 4, Response 4
                expect(userMessage).toContain('Response 3')
                expect(userMessage).toContain('Message 4')
                expect(userMessage).toContain('Response 4')
                expect(userMessage).not.toContain('Message 1')
                expect(userMessage).not.toContain('Message 2')
            })
        })
    })
})
