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
import { requireProjectAccess } from '../middleware/authMiddleware'
import { User } from '../entities/User'
import { Project } from '../entities/Project'
import { Organization } from '../entities/Organization'
import { OrganizationMembership } from '../entities/OrganizationMembership'
import cookieParser from 'cookie-parser'
import { chat } from '../api/chat'
import * as chatAgentPreprocessing from '../agents/chatAgent/preprocessing'
import * as chatAgent from '../agents/chatAgent/chatAgent'
import { ChatMessage } from '@/entities/ChatMessage'
import { Chat } from '@/entities/Chat'
import { randomUUID } from 'crypto'

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
                llmProvider: 'openai',
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
                llmProvider: 'openai',
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
                llmProvider: 'openai',
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
                llmProvider: 'openai',
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
                llmProvider: 'openai',
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
            expect(runChatArgs.llmProvider).toBe('anthropic') // llmProvider
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
            expect(runChatArgs.llmProvider).toBe('openai') // Default LLM_PROVIDER from mocked settings
        })
    })
})
