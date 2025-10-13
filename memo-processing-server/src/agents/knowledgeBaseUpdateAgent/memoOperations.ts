import { memoSummaryAgent } from '../memoSummaryAgent'
import { memoTagsAgent } from '../memoTagsAgent'
import { createMemoSummary, createMemoTags, createMemoChunk } from '../../db/memo'
import { generateVectorEmbeddingForStorage } from '../../vectorEmbeddings/voyage'
import { RecursiveChunker } from '@chonkiejs/core'

// Initialize chunker with the same configuration as Python version
// RecursiveChunker in TypeScript doesn't have recipes yet, so we'll use the default markdown-friendly configuration
let chunker: RecursiveChunker | null = null

const initChunker = async (): Promise<RecursiveChunker> => {
    if (!chunker) {
        chunker = await RecursiveChunker.create({
            chunkSize: 1024,
            minCharactersPerChunk: 128,
        })
    }
    return chunker
}

const _chunkMemoContent = async (content: string) => {
    const chunkerInstance = await initChunker()
    return chunkerInstance.chunk(content)
}

const _createMemoChunk = async (
    memoUuid: string,
    projectId: string,
    chunkContent: string,
    chunkIndex: number
): Promise<void> => {
    const vectorEmbedding = await generateVectorEmbeddingForStorage(chunkContent)
    await createMemoChunk({
        memo_uuid: memoUuid,
        project_id: projectId,
        chunk_content: chunkContent,
        chunk_index: chunkIndex,
        embedding: vectorEmbedding,
    })
}

export const createMemoChunks = async (memoUuid: string, projectId: string, content: string): Promise<void> => {
    const chunks = await _chunkMemoContent(content)
    const chunkPromises = []

    for (let index = 0; index < chunks.length; index++) {
        const chunk = chunks[index]

        chunkPromises.push(_createMemoChunk(memoUuid, projectId, chunk.text, index))
    }

    await Promise.all(chunkPromises)
}
export const extractTagsFromMemo = async (memo: { uuid: string; project_id: string; content: string }) => {
    const tags = await memoTagsAgent.extractTags(memo.content)
    await createMemoTags(memo.uuid, memo.project_id, tags.tags)
}

export const generateMemoSummary = async (memo: { uuid: string; project_id: string; content: string }) => {
    const summary = await memoSummaryAgent.summarize(memo.content)
    const embedding = await generateVectorEmbeddingForStorage(summary.summary)
    await createMemoSummary(memo.uuid, memo.project_id, summary.summary, embedding)
}
