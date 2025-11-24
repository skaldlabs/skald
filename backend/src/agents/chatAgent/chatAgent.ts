import { LLMService } from '@/services/llmService'
import { ChatPromptTemplate } from '@langchain/core/prompts'

interface StreamChunk {
    type: 'token' | 'error' | 'done' | 'references'
    content?: string
}

interface RerankResult {
    memo_uuid?: string
    memo_title?: string
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
    llmProvider: 'openai' | 'anthropic' | 'local' | 'groq' | 'gemini'
}): AsyncGenerator<StreamChunk> {
    const llm = LLMService.getLLM(0, llmProvider)
    const chain = prompt.pipe(llm)
    const stream = await chain.stream({
        input: query,
        context: contextStr,
    })
    for await (const chunk of stream) {
        if (chunk.content) {
            // Normalize content to string, handling different LLM response formats
            let normalizedContent: string
            if (typeof chunk.content === 'string') {
                normalizedContent = chunk.content
            } else if (typeof chunk.content === 'object') {
                // Extract text from dict (Anthropic format)
                const content = chunk.content as any
                normalizedContent = content.text || content.content || String(content)
            } else {
                normalizedContent = String(chunk.content)
            }

            yield {
                type: 'token',
                content: normalizedContent,
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
