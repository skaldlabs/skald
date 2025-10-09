import { randomUUID } from "crypto"
import { runQuery } from "./db"
import { Memo, MemoContent, MemoChunk, MemoChunkKeyword, MemoSummary, MemoTag } from "./models"

export type FetchMemoResult = Pick<Memo, 'uuid' | 'title' | 'created_at' | 'updated_at'>

export const fetchMemo = async (memoUuid: string): Promise<FetchMemoResult> => {
    const result = await runQuery<FetchMemoResult>(`
        SELECT uuid, title, created_at, updated_at FROM skald_memo WHERE uuid = $1
    `, [memoUuid])

    if (result.error) {
        throw new Error(result.error)
    }

    if (!result.rows) {
        throw new Error('No memo found')
    }

    return result.rows[0]
}

export interface CreateMemoParams {
    title: string
    metadata?: Record<string, any> | null
    client_reference_id?: string | null
    source?: string | null
    expiration_date?: Date | null
    content_length: number
    content_hash: string
}

export const createMemo = async (params: CreateMemoParams): Promise<string> => {
    const uuid = randomUUID()
    const result = await runQuery(`
        INSERT INTO skald_memo (
            uuid, title, metadata, client_reference_id, source, 
            expiration_date, content_length, content_hash, summary, archived
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
        uuid,
        params.title,
        params.metadata ?? {},
        params.client_reference_id ?? null,
        params.source ?? null,
        params.expiration_date ?? null,
        params.content_length,
        params.content_hash,
        '', // summary defaults to empty string
        false // archived defaults to false
    ])

    if (result.error) {
        throw new Error(result.error)
    }

    return uuid
}

export interface CreateMemoContentParams {
    memo_uuid: string
    content: string
}

export const createMemoContent = async (params: CreateMemoContentParams): Promise<string> => {
    const uuid = randomUUID()
    const result = await runQuery(`
        INSERT INTO skald_memocontent (uuid, memo_id, content)
        VALUES ($1, $2, $3)
    `, [uuid, params.memo_uuid, params.content])

    if (result.error) {
        throw new Error(result.error)
    }

    return uuid
}

export interface CreateMemoChunkParams {
    memo_uuid: string
    chunk_content: string
    chunk_index: number
    embedding: number[]
}

export const createMemoChunk = async (params: CreateMemoChunkParams): Promise<string> => {
    const uuid = randomUUID()
    const result = await runQuery(`
        INSERT INTO skald_memochunk (uuid, memo_id, chunk_content, chunk_index, embedding)
        VALUES ($1, $2, $3, $4, $5)
    `, [
        uuid,
        params.memo_uuid,
        params.chunk_content,
        params.chunk_index,
        JSON.stringify(params.embedding)
    ])

    if (result.error) {
        throw new Error(result.error)
    }

    return uuid
}

export interface CreateMemoChunkKeywordParams {
    memo_chunk_uuid: string
    keyword: string
}

export const createMemoChunkKeyword = async (params: CreateMemoChunkKeywordParams): Promise<string> => {
    const uuid = randomUUID()
    const result = await runQuery(`
        INSERT INTO skald_memochunkkeyword (uuid, memo_chunk_id, keyword)
        VALUES ($1, $2, $3)
    `, [uuid, params.memo_chunk_uuid, params.keyword])

    if (result.error) {
        throw new Error(result.error)
    }

    return uuid
}

export interface CreateMemoSummaryParams {
    memo_uuid: string
    summary: string
    embedding: number[]
}

export const createMemoSummary = async (params: CreateMemoSummaryParams): Promise<string> => {
    const uuid = randomUUID()
    const result = await runQuery(`
        INSERT INTO skald_memosummary (uuid, memo_id, summary, embedding)
        VALUES ($1, $2, $3, $4)
    `, [
        uuid,
        params.memo_uuid,
        params.summary,
        JSON.stringify(params.embedding)
    ])

    if (result.error) {
        throw new Error(result.error)
    }

    return uuid
}

export interface CreateMemoTagParams {
    memo_uuid: string
    tag: string
}

export const createMemoTag = async (params: CreateMemoTagParams): Promise<string> => {
    const uuid = randomUUID()
    const result = await runQuery(`
        INSERT INTO skald_memotag (uuid, memo_id, tag)
        VALUES ($1, $2, $3)
    `, [uuid, params.memo_uuid, params.tag])

    if (result.error) {
        throw new Error(result.error)
    }

    return uuid
}

export const fetchAllMemoTags = async (): Promise<string[]> => {
    const result = await runQuery<{ tag: string }>(`
        SELECT DISTINCT tag FROM skald_memotag
    `, [])

    if (result.error) {
        throw new Error(result.error)
    }

    if (!result.rows) {
        return []
    }

    return result.rows.map(row => row.tag)
}



