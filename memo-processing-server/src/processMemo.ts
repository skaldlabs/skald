import { keywordExtractorAgent } from "./agents/keywordExtractorAgent"
import { memoSummaryAgent } from "./agents/memoSummaryAgent"
import { memoTagsAgent } from "./agents/memoTagsAgent"
import { createMemoChunkKeywords, createMemoSummary, createMemoTags, fetchMemo, fetchMemoChunks, FetchMemoChunksResult, FetchMemoResult } from "./db/memo"
import { generateVectorEmbeddingForStorage } from "./vectorEmbeddings/voyage"


export const processMemo = async (memoUuid: string) => {
    const startTime = Date.now()
    const memo = await fetchMemo(memoUuid)
    const memoChunks = await fetchMemoChunks(memoUuid)
    const promises = [
        _extractTagsFromMemo(memo),
        _extractKeywordsFromChunks(memoChunks),
        _generateMemoSummary(memo)
    ]

    await Promise.all(promises)
    const endTime = Date.now()
    console.log(`Time taken to fetch memo: ${endTime - startTime}ms`)
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
