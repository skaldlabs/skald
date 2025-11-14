import { LLMService } from '@/services/llmService'
import { CHAT_AGENT_INSTRUCTIONS, CHAT_AGENT_INSTRUCTIONS_WITH_SOURCES } from '@/agents/chatAgent/prompts'
import { ChatPromptTemplate } from '@langchain/core/prompts'

interface ChatAgentResult {
    output: string
    intermediate_steps?: any[]
    references?: Record<number, { memo_uuid: string; memo_title: string }>
}

interface StreamChunk {
    type: 'token' | 'error' | 'done' | 'references'
    content?: string
}

interface RerankResult {
    memo_uuid?: string
    memo_title?: string
}

export async function runChatAgent({
    query,
    context = '',
    clientSystemPrompt = null,
    conversationHistory = [],
    rerankResults = [],
    options = {
        enableReferences: false,
    },
}: {
    query: string
    context?: string
    clientSystemPrompt?: string | null
    conversationHistory?: Array<[string, string]>
    rerankResults?: RerankResult[]
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

    const chatResult: ChatAgentResult = {
        output: typeof result.content === 'string' ? result.content : String(result.content),
        intermediate_steps: [],
    }

    // Build references object if enableReferences is on
    if (enableReferences && rerankResults.length > 0) {
        const references: Record<number, { memo_uuid: string; memo_title: string }> = {}
        for (let i = 0; i < rerankResults.length; i++) {
            const rerankResult = rerankResults[i]
            if (rerankResult.memo_uuid && rerankResult.memo_title) {
                references[i + 1] = {
                    memo_uuid: rerankResult.memo_uuid,
                    memo_title: rerankResult.memo_title,
                }
            }
        }
        chatResult.references = references
    }

    return chatResult
}

export async function* streamChatAgent({
    query,
    prompt,
    contextStr,
    rerankResults,
    enableReferences,
    llmProvider,
}: {
    query: string
    prompt: ChatPromptTemplate
    contextStr: string
    rerankResults: RerankResult[]
    enableReferences: boolean
    llmProvider: 'openai' | 'anthropic' | 'local' | 'groq'
}): AsyncGenerator<StreamChunk> {
    const llm = LLMService.getLLM(0, llmProvider)
    const chain = prompt.pipe(llm)
    const stream = await chain.stream({
        input: query,
        context: contextStr,
    })
    for await (const chunk of stream) {
        if (chunk.content) {
            yield {
                type: 'token',
                content: String(chunk.content),
            }
        }
    }
    if (enableReferences && rerankResults.length > 0) {
        const references: Record<number, { memo_uuid: string; memo_title: string }> = {}
        for (let i = 0; i < rerankResults.length; i++) {
            const rerankResult = rerankResults[i]
            if (rerankResult.memo_uuid && rerankResult.memo_title) {
                references[i + 1] = {
                    memo_uuid: rerankResult.memo_uuid,
                    memo_title: rerankResult.memo_title,
                }
            }
        }
        if (Object.keys(references).length > 0) {
            yield {
                type: 'references',
                content: JSON.stringify(references),
            }
        }
    }
}

// export async function* streamChatAgent({
//     query,
//     context = '',
//     clientSystemPrompt = null,
//     conversationHistory = [],
//     rerankResults = [],
//     options = {
//         enableReferences: false,
//     },
// }: {
//     query: string
//     context?: string
//     clientSystemPrompt?: string | null
//     conversationHistory?: Array<[string, string]>
//     rerankResults?: RerankResult[]
//     llmProvider?: 'openai' | 'anthropic' | 'local' | 'groq'
//     options?: {
//         llmProvider?: 'openai' | 'anthropic' | 'local' | 'groq'
//         enableReferences?: boolean
//     }
// }): AsyncGenerator<StreamChunk> {
//     const { llmProvider, enableReferences } = options

//     try {
//         // For streaming, we'll use the LLM directly instead of the agent
//         const llm = LLMService.getLLM(0, llmProvider)

//         const prompts: [string, string][] = [
//             ['system', enableReferences ? CHAT_AGENT_INSTRUCTIONS_WITH_SOURCES : CHAT_AGENT_INSTRUCTIONS],
//         ]
//         if (clientSystemPrompt) {
//             prompts.push(['system', clientSystemPrompt || ''])
//         }

//         prompts.push(...conversationHistory)
//         prompts.push(['human', '{input}'])

//         const prompt = ChatPromptTemplate.fromMessages(prompts)

//         const chain = prompt.pipe(llm)

//         const stream = await chain.stream({
//             input: query,
//             context,
//         })

//         for await (const chunk of stream) {
//             if (chunk.content) {
//                 yield {
//                     type: 'token',
//                     content: String(chunk.content),
//                 }
//             }
//         }

//         // After streaming completes, send references if enabled
//         if (enableReferences && rerankResults.length > 0) {
//             const references: Record<number, { memo_uuid: string; memo_title: string }> = {}
//             for (let i = 0; i < rerankResults.length; i++) {
//                 const rerankResult = rerankResults[i]
//                 if (rerankResult.memo_uuid && rerankResult.memo_title) {
//                     references[i + 1] = {
//                         memo_uuid: rerankResult.memo_uuid,
//                         memo_title: rerankResult.memo_title,
//                     }
//                 }
//             }
//             if (Object.keys(references).length > 0) {
//                 yield {
//                     type: 'references',
//                     content: JSON.stringify(references),
//                 }
//             }
//         }
//     } catch (error) {
//         Sentry.captureException(error)
//         yield {
//             type: 'error',
//             content: error instanceof Error ? error.message : String(error),
//         }
//     }
// }
