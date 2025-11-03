import { LLMService } from '@/services/llmService'
import { CHAT_AGENT_INSTRUCTIONS } from '@/agents/chatAgent/prompts'
import { ChatPromptTemplate } from '@langchain/core/prompts'

interface ChatAgentResult {
    output: string
    intermediate_steps?: any[]
}

interface StreamChunk {
    type: 'token' | 'error' | 'done'
    content?: string
}

export async function runChatAgent(
    query: string,
    context: string = '',
    clientSystemPrompt: string | null = null
): Promise<ChatAgentResult> {
    // Use the LLM directly for non-streaming
    const llm = LLMService.getLLM(0)
    const prompts: [string, string][] = [['system', CHAT_AGENT_INSTRUCTIONS]]
    if (clientSystemPrompt) {
        prompts.push(['system', clientSystemPrompt || ''])
    }
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

export async function* streamChatAgent(
    query: string,
    context: string = '',
    clientSystemPrompt: string | null = null
): AsyncGenerator<StreamChunk> {
    try {
        // For streaming, we'll use the LLM directly instead of the agent
        const llm = LLMService.getLLM(0)

        const prompts: [string, string][] = [['system', CHAT_AGENT_INSTRUCTIONS]]
        if (clientSystemPrompt) {
            prompts.push(['system', clientSystemPrompt || ''])
        }

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

        yield { type: 'done' }
    } catch (error) {
        yield {
            type: 'error',
            content: error instanceof Error ? error.message : String(error),
        }
    }
}
