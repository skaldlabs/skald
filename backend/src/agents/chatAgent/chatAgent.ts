import { LLMService } from '@/services/llmService'
import { CHAT_AGENT_INSTRUCTIONS, CHAT_AGENT_INSTRUCTIONS_WITH_SOURCES } from '@/agents/chatAgent/prompts'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import * as Sentry from '@sentry/node'

interface ChatAgentResult {
    output: string
    intermediate_steps?: any[]
}

interface StreamChunk {
    type: 'token' | 'error' | 'done'
    content?: string
}

export async function runChatAgent({
    query,
    context = '',
    clientSystemPrompt = null,
    conversationHistory = [],
    options = {
        enableReferences: false,
    },
}: {
    query: string
    context?: string
    clientSystemPrompt?: string | null
    conversationHistory?: Array<[string, string]>
    options?: {
        llmProvider?: 'openai' | 'anthropic' | 'local' | 'groq'
        enableReferences?: boolean
    }
}): Promise<ChatAgentResult> {
    const { llmProvider, enableReferences } = options

    // Use the LLM directly for non-streaming
    const llm = LLMService.getLLM(0, llmProvider)
    const prompts: [string, string][] = [
        ['system', enableReferences ? CHAT_AGENT_INSTRUCTIONS_WITH_SOURCES : CHAT_AGENT_INSTRUCTIONS],
    ]
    if (clientSystemPrompt) {
        prompts.push(['system', clientSystemPrompt || ''])
    }

    prompts.push(...conversationHistory)
    prompts.push(['human', '{input}'])

    const prompt = ChatPromptTemplate.fromMessages(prompts)

    const chain = prompt.pipe(llm)

    const result = await chain.invoke({
        input: query,
        context,
    })

    return {
        output: typeof result.content === 'string' ? result.content : String(result.content),
        intermediate_steps: [],
    }
}

export async function* streamChatAgent({
    query,
    context = '',
    clientSystemPrompt = null,
    conversationHistory = [],
    options = {
        enableReferences: false,
    },
}: {
    query: string
    context?: string
    clientSystemPrompt?: string | null
    conversationHistory?: Array<[string, string]>
    llmProvider?: 'openai' | 'anthropic' | 'local' | 'groq'
    options?: {
        llmProvider?: 'openai' | 'anthropic' | 'local' | 'groq'
        enableReferences?: boolean
    }
}): AsyncGenerator<StreamChunk> {
    const { llmProvider, enableReferences } = options

    try {
        // For streaming, we'll use the LLM directly instead of the agent
        const llm = LLMService.getLLM(0, llmProvider)

        const prompts: [string, string][] = [
            ['system', enableReferences ? CHAT_AGENT_INSTRUCTIONS_WITH_SOURCES : CHAT_AGENT_INSTRUCTIONS],
        ]
        if (clientSystemPrompt) {
            prompts.push(['system', clientSystemPrompt || ''])
        }

        prompts.push(...conversationHistory)
        prompts.push(['human', '{input}'])

        const prompt = ChatPromptTemplate.fromMessages(prompts)

        const chain = prompt.pipe(llm)

        const stream = await chain.stream({
            input: query,
            context,
        })

        for await (const chunk of stream) {
            if (chunk.content) {
                yield {
                    type: 'token',
                    content: String(chunk.content),
                }
            }
        }
    } catch (error) {
        Sentry.captureException(error)
        yield {
            type: 'error',
            content: error instanceof Error ? error.message : String(error),
        }
    }
}
