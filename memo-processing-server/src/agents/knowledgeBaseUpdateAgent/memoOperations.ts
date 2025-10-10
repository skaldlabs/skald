import { keywordExtractorAgent } from "../keywordExtractorAgent"
import { memoSummaryAgent } from "../memoSummaryAgent"
import { memoTagsAgent } from "../memoTagsAgent"
import { createMemoChunkKeywords, createMemoSummary, createMemoTags, createMemoChunk } from "../../db/memo"
import { generateVectorEmbeddingForStorage } from "../../vectorEmbeddings/voyage"
import { Chunk, RecursiveChunker } from "@chonkiejs/core"
import { FetchMemoResult } from "../../db/memo"

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

export const createMemoChunks = async (memoUuid: string, content: string): Promise<void> => {
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
export const extractTagsFromMemo = async (memo: { uuid: string, content: string }) => {
    const tags = await memoTagsAgent.extractTags(memo.content)
    await createMemoTags(memo.uuid, tags.tags)
}

export const generateMemoSummary = async (memo: { uuid: string, content: string }) => {
    const summary = await memoSummaryAgent.summarize(memo.content)
    const embedding = await generateVectorEmbeddingForStorage(summary.summary)
    await createMemoSummary(memo.uuid, summary.summary, embedding)
}
