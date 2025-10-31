import { Request, Response } from 'express'
import { parseFilter } from '@/lib/filterUtils'
import { Project } from '@/entities/Project'
import { MemoFilter } from '@/lib/filterUtils'
import { EmbeddingService } from '@/services/embeddingService'
import { memoChunkVectorSearch } from '@/embeddings/vectorSearch'
import { getTitleAndSummaryForMemoList } from '@/queries/memo'

interface SearchResult {
    chunk_uuid: string
    memo_title: string
    memo_summary: string
    chunk_content: string
    distance: number
}

export const search = async (req: Request, res: Response) => {
    const query = req.body.query
    const limit = req.body.limit || 10
    const filters = req.body.filters || []

    const project = req.context?.requestUser?.project

    if (!project) {
        return res.status(400).json({ error: 'Project is required' })
    }

    if (!query) {
        return res.status(400).json({ error: 'Query is required' })
    }

    if (limit > 50) {
        return res.status(400).json({ error: 'Limit must be less than or equal to 50' })
    }

    const memoFilters = []
    for (const filter of filters) {
        const { filter: memoFilter, error } = parseFilter(filter)
        if (memoFilter && !error) {
            memoFilters.push(memoFilter)
        } else {
            return res.status(400).json({ error: `Invalid filter: ${error}` })
        }
    }

    const results: SearchResult[] = await _chunkVectorSearch(project, query, limit, filters)

    return res.status(200).json({ results })
}

const _chunkVectorSearch = async (
    project: Project,
    query: string,
    limit: number,
    filters: MemoFilter[]
): Promise<SearchResult[]> => {
    const embeddingVector = await EmbeddingService.generateEmbedding(query, 'search')
    const chunkResults = await memoChunkVectorSearch(project, embeddingVector, limit, 0.75, filters)

    const memoPropertiesMap = await getTitleAndSummaryForMemoList(
        project.uuid,
        Array.from(new Set(chunkResults.map((c) => c.chunk.memo_uuid)))
    )

    const results = chunkResults.map((result) => ({
        chunk_uuid: result.chunk.memo_uuid,
        memo_title: memoPropertiesMap.get(result.chunk.memo_uuid)?.title || '',
        memo_summary: memoPropertiesMap.get(result.chunk.memo_uuid)?.summary || '',
        chunk_content: result.chunk.chunk_content || '',
        distance: result.distance,
    }))
    return results
}
