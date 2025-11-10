import { QueryRewriteService } from '../services/queryRewriteService'
import { LLMService } from '../services/llmService'

// Mock the LLMService
jest.mock('../services/llmService')
jest.mock('@sentry/node', () => ({
    captureException: jest.fn(),
}))

// Mock logger
jest.mock('../lib/logger', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    },
}))

// Mock settings
jest.mock('../settings', () => ({
    LLM_PROVIDER: 'openai',
}))

describe('QueryRewriteService', () => {
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
            const result = await QueryRewriteService.rewrite(query, [])

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

            await QueryRewriteService.rewrite(query, conversationHistory)

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
            const result = await QueryRewriteService.rewrite(query, [])

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
            const result = await QueryRewriteService.rewrite(query, [])

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

            await QueryRewriteService.rewrite(query, conversationHistory)

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
