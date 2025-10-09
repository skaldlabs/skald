import { keywordExtractorAgent } from "./agents/keywordExtractorAgent"
import { KnowledgeBaseUpdateAction, knowledgeBaseUpdateAgent } from "./agents/knowledgeBaseUpdateAgent/knowledgeBaseUpdateAgent"
import { memoSummaryAgent } from "./agents/memoSummaryAgent"
import { memoTagsAgent } from "./agents/memoTagsAgent"
import { createMemoChunk, createMemoChunkKeywords, createMemoSummary, createMemoTags, fetchMemo, fetchMemoChunks, FetchMemoChunksResult, FetchMemoResult, updateMemo } from "./db/memo"
import { generateVectorEmbeddingForStorage } from "./vectorEmbeddings/voyage"
import { Chunk, RecursiveChunker } from "@chonkiejs/core"

// Initialize chunker with the same configuration as Python version
// RecursiveChunker in TypeScript doesn't have recipes yet, so we'll use the default markdown-friendly configuration
let chunker: RecursiveChunker | null = null

const initChunker = async (): Promise<RecursiveChunker> => {
    if (!chunker) {
        chunker = await RecursiveChunker.create({ 
            chunkSize: 4096, 
            minCharactersPerChunk: 128 
        })
    }
    return chunker
}

export const processMemo = async (memoUuid: string) => {
    const startTime = Date.now()
    const memo = await fetchMemo(memoUuid)

    console.log(`Time taken to process memo: ${Date.now() - startTime}ms`)

    const knowledgeBaseUpdateStartTime = Date.now()

    const actions = await _knowledgeBaseUpdate(memo)
    console.log(actions)
    for (const action of actions) {
        if (action.action === 'INSERT' && action.content === 'provided_content_unchanged') {
            await updateMemo(memo.uuid, [{
                column: 'pending',
                value: false
            }])
            const promises = [
                _createMemoChunks(memo.uuid, memo.content),
                _extractTagsFromMemo(memo),
                _generateMemoSummary(memo)
            ]

            await Promise.all(promises)
        }
    }
    const knowledgeBaseUpdateEndTime = Date.now()
    console.log(`Time taken to update knowledge base: ${knowledgeBaseUpdateEndTime - knowledgeBaseUpdateStartTime}ms`)
    const endTime = Date.now()
    console.log(`Total time taken to process memo: ${endTime - startTime}ms`)

    // if there's an INSERT action, create the memo chunks and set pending to False
}

const _chunkMemoContent = async (content: string) => {
    const chunkerInstance = await initChunker()
    return chunkerInstance.chunk(content)
}

const _createMemoChunk = async (memoUuid: string, chunkContent: string, chunkIndex: number) => {
    const vectorEmbedding = await generateVectorEmbeddingForStorage(chunkContent)
    const memoChunkUuid = await createMemoChunk({
        memo_uuid: memoUuid,
        chunk_content: chunkContent,
        chunk_index: chunkIndex,
        embedding: vectorEmbedding
    })
    const keywords = await keywordExtractorAgent.extractKeywords(chunkContent)
    await createMemoChunkKeywords(memoChunkUuid, keywords.keywords)
}

const _createMemoChunks = async (memoUuid: string, content: string): Promise<void> => {
    const chunks = await _chunkMemoContent(content)
    const chunkPromises = []
    
    for (let index = 0; index < chunks.length; index++) {
        const chunk = chunks[index]

        chunkPromises.push(
            _createMemoChunk(memoUuid, chunk.text, index)
        )
    }
        
    await Promise.all(chunkPromises)
}


const _knowledgeBaseUpdate = async (memo: FetchMemoResult): Promise<KnowledgeBaseUpdateAction[]> => {
    const actions = await knowledgeBaseUpdateAgent.determineActions(memo.uuid, memo.content, memo.title)
    return actions.actions
}

const _extractTagsFromMemo = async (memo: FetchMemoResult) => {
    const tags = await memoTagsAgent.extractTags(memo.content)
    await createMemoTags(memo.uuid, tags.tags)
}

const _generateMemoSummary = async (memo: FetchMemoResult) => {
    const summary = await memoSummaryAgent.summarize(memo.content)
    const embedding = await generateVectorEmbeddingForStorage(summary.summary)
    await createMemoSummary(memo.uuid, summary.summary, embedding)
}

const _extractKeywordsFromChunks = async (memoChunks: FetchMemoChunksResult[]): Promise<void> => {
    const keywordExtractPromises = []
    for (const chunk of memoChunks) {
        const promise = keywordExtractorAgent.extractKeywords(chunk.chunk_content)
        keywordExtractPromises.push(promise)

    }
    const results = await Promise.all(keywordExtractPromises)

    const createKeywordPromises = []
    for (let i = 0; i < results.length; ++i) {
        const promise = createMemoChunkKeywords(memoChunks[i].uuid, results[i].keywords)
        createKeywordPromises.push(promise)
    }
    await Promise.all(createKeywordPromises)

}
