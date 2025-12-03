import { Request, Response } from 'express'
import { parseFilter } from '@/lib/filterUtils'
import { MemoFilter } from '@/lib/filterUtils'
import { DI } from '@/di'
import { SearchRequest } from '@/entities/SearchRequest'
import { randomUUID } from 'crypto'
import * as Sentry from '@sentry/node'
import { searchGraph, SearchResult } from '../lib/searchGraph'

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

    const memoFilters: MemoFilter[] = []
    for (const filter of filters) {
        const { filter: memoFilter, error } = parseFilter(filter)
        if (memoFilter && !error) {
            memoFilters.push(memoFilter)
        } else {
            return res.status(400).json({ error: `Invalid filter: ${error}` })
        }
    }

    const initialState = {
        project,
        query,
        limit,
        filters: memoFilters,
        chunkResults: null,
        memoPropertiesMap: null,
        rerankedResults: [],
        results: [],
    }

    const finalState = await searchGraph.invoke(initialState)
    const results: SearchResult[] = finalState.results

    const createSearchRequest = async () => {
        try {
            const searchRequest = DI.em.create(SearchRequest, {
                uuid: randomUUID(),
                project,
                query,
                filters,
                results: results.map((result) => ({
                    chunk_uuid: result.chunk_uuid,
                    memo_title: result.memo_title,
                    distance: result.distance,
                })),
                created_at: new Date(),
            })
            await DI.em.persistAndFlush(searchRequest)
        } catch (error) {
            Sentry.captureException(error)
        }
    }

    void createSearchRequest()

    return res.status(200).json({ results })
}
