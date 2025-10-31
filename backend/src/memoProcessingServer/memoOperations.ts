import { memoSummaryAgent } from '@/agents/memoSummaryAgent'
import { memoTagsAgent } from '@/agents/memoTagsAgent'
import { RecursiveChunker } from '@chonkiejs/core'
import { EmbeddingService } from '@/services/embeddingService'
import { EntityManager } from '@mikro-orm/core'
import { randomUUID } from 'crypto'
import { MemoChunk } from '@/entities/MemoChunk'
import { MemoTag } from '@/entities/MemoTag'
import { MemoSummary } from '@/entities/MemoSummary'

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
    em: EntityManager,
    memoUuid: string,
    projectId: string,
    chunkContent: string,
    chunkIndex: number
): Promise<MemoChunk> => {
    const vectorEmbedding = await EmbeddingService.generateEmbedding(chunkContent, 'storage')
    return em.create(MemoChunk, {
        uuid: randomUUID(),
        memo: memoUuid,
        project: projectId,
        chunk_content: chunkContent,
        chunk_index: chunkIndex,
        embedding: JSON.stringify(vectorEmbedding) as any,
    })
}

export const createMemoChunks = async (
    em: EntityManager,
    memoUuid: string,
    projectId: string,
    content: string
): Promise<void> => {
    const chunks = await _chunkMemoContent(content)

    const promises = []
    for (let index = 0; index < chunks.length; index++) {
        const chunk = chunks[index]
        promises.push(_createMemoChunk(em, memoUuid, projectId, chunk.text, index))
    }
    const memoChunks = await Promise.all(promises)
    await em.persistAndFlush(memoChunks)
}

export const extractTagsFromMemo = async (em: EntityManager, memoUuid: string, content: string, projectId: string) => {
    const tags = await memoTagsAgent.extractTags(content)
    const memoTags = tags.tags.map((tag) =>
        em.create(MemoTag, { uuid: randomUUID(), memo: memoUuid, project: projectId, tag })
    )
    await em.persistAndFlush(memoTags)
}

export const generateMemoSummary = async (em: EntityManager, memoUuid: string, content: string, projectId: string) => {
    const summary = await memoSummaryAgent.summarize(content)
    const embedding = await EmbeddingService.generateEmbedding(summary.summary, 'storage')
    const memoSummary = em.create(MemoSummary, {
        uuid: randomUUID(),
        memo: memoUuid,
        project: projectId,
        summary: summary.summary,
        embedding: JSON.stringify(embedding) as any,
    })
    await em.persistAndFlush(memoSummary)
}
