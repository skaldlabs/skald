import { Project } from '@/entities/Project'
import { getOptimizedChatHistory } from '@/lib/chatUtils'
import { StateGraph, END } from '@langchain/langgraph'
import { Annotation } from '@langchain/langgraph'
import { rewrite } from './queryRewrite'
import { MemoFilter } from '@/lib/filterUtils'
import { EmbeddingService } from '@/services/embeddingService'
import { memoChunkVectorSearch, MemoChunkWithDistance } from '@/embeddings/vectorSearch'
import { getTitleAndSummaryAndContentForMemoList } from '@/queries/memo'
import { RerankService } from '@/services/rerankService'
import { CHAT_AGENT_INSTRUCTIONS, CHAT_AGENT_INSTRUCTIONS_WITH_SOURCES } from './prompts'
import { ChatPromptTemplate } from '@langchain/core/prompts'

interface RerankResult {
    index: number
    document: string
    relevance_score: number
    memo_uuid?: string
    memo_title?: string
}

export interface RAGConfig {
    llmProvider: 'openai' | 'anthropic' | 'local' | 'groq'
    references: {
        enabled: boolean
    }
    queryRewrite: {
        enabled: boolean
    }
    vectorSearch: {
        topK: number
        similarityThreshold: number
    }
    reranking: {
        enabled: boolean
        topK: number
    }
}

// Define your state schema
const RAGState = Annotation.Root({
    project: Annotation<Project>,
    query: Annotation<string>,
    filters: Annotation<MemoFilter[]>,
    clientSystemPrompt: Annotation<string | null>,
    ragConfig: Annotation<RAGConfig>,
    chatId: Annotation<string | null>,
    conversationHistory: Annotation<Array<['human' | 'ai' | 'system', string]> | null>,
    rewrittenQuery: Annotation<string | null>,
    chunkResults: Annotation<MemoChunkWithDistance[] | null>,
    rerankedResults: Annotation<RerankResult[]>,
    memoPropertiesMap: Annotation<Map<string, { title: string; summary: string; content: string }> | null>,
    prompt: Annotation<ChatPromptTemplate>,
    contextStr: Annotation<string | null>,
})

export const CLOUD_LLM_PROVIDERS = ['openai', 'anthropic', 'groq']

async function getChatHistoryNode(state: typeof RAGState.State) {
    const { chatId, project } = state
    if (!chatId) {
        return { conversationHistory: null }
    }
    const conversationHistory = await getOptimizedChatHistory(chatId, project)
    return { conversationHistory }
}

async function queryRewriteNode(state: typeof RAGState.State) {
    const { query, conversationHistory, ragConfig } = state

    if (!ragConfig.queryRewrite.enabled) {
        return { rewrittenQuery: null }
    }

    const conversationMessages = (conversationHistory || [])
        .map(([userMsg, assistantMsg]) => [
            { role: 'user' as const, content: userMsg },
            { role: 'assistant' as const, content: assistantMsg },
        ])
        .flat()

    const rewrittenQuery = await rewrite(query, conversationMessages)

    if (rewrittenQuery !== query) {
        return { rewrittenQuery }
    }

    return { rewrittenQuery: null }
}

async function vectorSearchNode(state: typeof RAGState.State) {
    const { rewrittenQuery, query, project, filters, ragConfig } = state

    const searchQuery = rewrittenQuery || query

    const embeddingVector = await EmbeddingService.generateEmbedding(searchQuery, 'search')
    const chunkResults = await memoChunkVectorSearch(
        project,
        embeddingVector,
        ragConfig.vectorSearch.topK,
        ragConfig.vectorSearch.similarityThreshold,
        filters
    )

    return { chunkResults }
}

async function getMemoPropertiesNode(state: typeof RAGState.State) {
    const { chunkResults, project, ragConfig } = state
    if (!chunkResults || !ragConfig.reranking.enabled) {
        return { memoPropertiesMap: null }
    }

    const relevantMemoUuids = Array.from(new Set(chunkResults.map((c) => c.chunk.memo_uuid)))

    const memoPropertiesMap = await getTitleAndSummaryAndContentForMemoList(project.uuid, relevantMemoUuids)

    return { memoPropertiesMap }
}

async function rerankNode(state: typeof RAGState.State) {
    const { chunkResults, memoPropertiesMap, query, rewrittenQuery, ragConfig } = state
    if (!chunkResults) {
        return { rerankedResults: [] }
    }

    if (!ragConfig.reranking.enabled) {
        // map chunks to rerank results
        const rerankedResults: RerankResult[] = []
        for (let i = 0; i < chunkResults.length; i++) {
            const chunk = chunkResults[i]
            const similarity = Math.max(0, Math.min(1, 1 - chunk.distance / 2))

            rerankedResults.push({
                index: i,
                document: chunk.chunk.chunk_content,
                relevance_score: similarity,
                memo_uuid: chunk.chunk.memo_uuid,
                memo_title: memoPropertiesMap?.get(chunk.chunk.memo_uuid)?.title || '',
            })
        }
        return { rerankedResults }
    }

    const searchQuery = rewrittenQuery || query
    const rerankData: string[] = []
    const rerankMetadata: Array<{ memo_uuid: string; memo_title: string }> = []

    for (const chunkResult of chunkResults) {
        const chunk = chunkResult.chunk

        let rerankSnippet = chunk.chunk_content
        if (memoPropertiesMap) {
            const memo = memoPropertiesMap.get(chunk.memo_uuid)
            rerankSnippet = `Title: ${memo?.title}\n\nFull content summary: ${memo?.summary}\n\nChunk content: ${chunk.chunk_content}\n\n`
        }

        rerankData.push(rerankSnippet)
        rerankMetadata.push({
            memo_uuid: chunk.memo_uuid,
            memo_title: memoPropertiesMap?.get(chunk.memo_uuid)?.title || '',
        })
    }

    // split into batches of 25 to ensure we're under token limits for the reranker
    // KLUDGE: this is hardcoded right now based on ~1k tokens per chunk and 32k token limit for the voyage reranker
    const rerankDataBatches: string[][] = []
    const rerankMetadataBatches: Array<Array<{ memo_uuid: string; memo_title: string }>> = []

    for (let i = 0; i < rerankData.length; i += 25) {
        rerankDataBatches.push(rerankData.slice(i, i + 25))
        rerankMetadataBatches.push(rerankMetadata.slice(i, i + 25))
    }

    // rerank all batches concurrently using the processed query
    const results = (
        await Promise.all(
            rerankDataBatches.map((batch, idx) => RerankService.rerank(searchQuery, batch, rerankMetadataBatches[idx]))
        )
    ).flat()

    // sort
    results.sort((a, b) => b.relevance_score - a.relevance_score)
    return { rerankedResults: results.slice(0, ragConfig.reranking.topK) }
}

function buildLLMInputsNode(state: typeof RAGState.State) {
    const { conversationHistory, ragConfig, rerankedResults, clientSystemPrompt } = state

    let contextStr = ''
    for (let i = 0; i < rerankedResults.length; i++) {
        contextStr += `Result ${i + 1}: ${rerankedResults[i].document}\n\n`
    }

    const prompts: [string, string][] = [
        ['system', ragConfig.references.enabled ? CHAT_AGENT_INSTRUCTIONS_WITH_SOURCES : CHAT_AGENT_INSTRUCTIONS],
    ]

    if (clientSystemPrompt) {
        prompts.push(['system', clientSystemPrompt || ''])
    }

    prompts.push(...(conversationHistory || []))
    prompts.push(['human', '{input}'])

    const prompt = ChatPromptTemplate.fromMessages(prompts)

    return { prompt, contextStr }
}

// ideally we'd dynamically skip nodes based on the ragConfig but
// that's annoyingly very hard with TypeScript it seems
// so we let the nodes themselves decide whether to run or not
const ragGraphDefinition = new StateGraph(RAGState)
    .addNode('getChatHistory', getChatHistoryNode)
    .addNode('queryRewrite', queryRewriteNode)
    .addNode('vectorSearch', vectorSearchNode)
    .addNode('getMemoProperties', getMemoPropertiesNode)
    .addNode('rerank', rerankNode)
    .addNode('buildLLMInputs', buildLLMInputsNode)
    .addEdge('__start__', 'getChatHistory')
    .addEdge('getChatHistory', 'queryRewrite')
    .addEdge('queryRewrite', 'vectorSearch')
    .addEdge('vectorSearch', 'getMemoProperties')
    .addEdge('getMemoProperties', 'rerank')
    .addEdge('rerank', 'buildLLMInputs')
    .addEdge('buildLLMInputs', END)

export const ragGraph = ragGraphDefinition.compile()
