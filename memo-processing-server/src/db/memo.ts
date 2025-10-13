import { randomUUID } from 'crypto'
import { runQuery, insertData } from './db'
import { MemoContent } from './models'

export interface FetchMemoResult {
    uuid: string
    project_id: string
    title: string
    created_at: Date
    updated_at: Date
    content: string
    pending: boolean
}

export interface FetchMemoChunksResult {
    uuid: string
    memo_id: string
    chunk_content: string
    chunk_index: number
}

export const fetchMemo = async (memoUuid: string): Promise<FetchMemoResult> => {
    const result = await runQuery<FetchMemoResult>(
        `
        SELECT skald_memo.uuid AS uuid, skald_memo.project_id AS project_id, title, created_at, updated_at, skald_memocontent.content AS content
        FROM skald_memo 
        JOIN skald_memocontent ON skald_memo.uuid = skald_memocontent.memo_id
        WHERE skald_memo.uuid = $1
    `,
        [memoUuid]
    )

    if (result.error) {
        throw new Error(result.error)
    }

    if (!result.rows) {
        throw new Error('No memo found')
    }

    return result.rows[0]
}

export const fetchMemoChunks = async (memoUuid: string): Promise<FetchMemoChunksResult[]> => {
    const result = await runQuery<FetchMemoChunksResult>(
        `
        SELECT uuid, memo_id, chunk_content, chunk_index FROM skald_memochunk WHERE memo_id = $1
    `,
        [memoUuid]
    )

    if (result.error) {
        throw new Error(result.error)
    }

    return result.rows || []
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

export const createMemo = async (
    params: CreateMemoParams
): Promise<Pick<FetchMemoResult, 'uuid' | 'title' | 'created_at' | 'updated_at'>> => {
    const uuid = randomUUID()
    const result = await insertData<FetchMemoResult>(
        'skald_memo',
        [
            {
                uuid,
                title: params.title,
                metadata: params.metadata ?? {},
                client_reference_id: params.client_reference_id ?? null,
                source: params.source ?? null,
                expiration_date: params.expiration_date ?? null,
                content_length: params.content_length,
                content_hash: params.content_hash,
                archived: false,
                pending: false,
                created_at: new Date(),
                updated_at: new Date(),
            },
        ],
        { returnColumns: ['uuid', 'title', 'created_at', 'updated_at'] }
    )

    if (result.error || !result.rows) {
        throw new Error(result.error ?? 'Failed to create memo')
    }

    return result.rows[0]
}

// TODO: we need to figure out a way to make this more efficient,
// maybe by baking in ON DELETE CASCADE to the fkeys at the db level
export const deleteMemo = async (memoUuid: string): Promise<boolean> => {
    const selectMemoChunkUuidsResult = await runQuery<{ memo_chunk_uuid: string }>(
        `
        SELECT uuid AS memo_chunk_uuid FROM skald_memochunk WHERE memo_id = $1
    `,
        [memoUuid]
    )

    if (selectMemoChunkUuidsResult.error) {
        throw new Error(selectMemoChunkUuidsResult.error)
    }

    const deleteMemoChunksPromises = []
    for (const memoChunkUuid of selectMemoChunkUuidsResult.rows || []) {
        deleteMemoChunksPromises.push(
            runQuery(
                `
                DELETE FROM skald_memochunk WHERE uuid = $1;
            `,
                [memoChunkUuid.memo_chunk_uuid]
            )
        )
    }

    await Promise.all(deleteMemoChunksPromises)

    await runQuery(
        `
        DELETE FROM skald_memosummary WHERE memo_id = $1;
    `,
        [memoUuid]
    )
    await runQuery(
        `
        DELETE FROM skald_memotag WHERE memo_id = $1;
    `,
        [memoUuid]
    )
    await runQuery(
        `
        DELETE FROM skald_memocontent WHERE memo_id = $1;
    `,
        [memoUuid]
    )
    await runQuery(
        `
        DELETE FROM skald_memo WHERE uuid = $1;
    `,
        [memoUuid]
    )

    return true
}

export interface UpdateMemoParams {
    title?: string | null
    metadata?: Record<string, any> | null
    client_reference_id?: string | null
    source?: string | null
    expiration_date?: Date | null
    pending?: boolean
}

export const updateMemo = async (memoUuid: string, updates: { column: string; value: any }[]): Promise<void> => {
    // update this to use params and values
    const updateString = updates.map((update) => `${update.column} = ${update.value}`).join(', ')
    const result = await runQuery(
        `
        UPDATE skald_memo SET ${updateString} WHERE uuid = $1
    `,
        [memoUuid]
    )

    if (result.error) {
        throw new Error(result.error)
    }
}

export interface CreateMemoContentParams {
    memo_uuid: string
    content: string
}

export const createMemoContent = async (params: CreateMemoContentParams): Promise<string> => {
    const uuid = randomUUID()
    const result = await insertData<MemoContent>(
        'skald_memocontent',
        [
            {
                uuid,
                memo_id: params.memo_uuid,
                content: params.content,
            },
        ],
        { returnColumns: ['uuid'] }
    )

    if (result.error || !result.rows) {
        throw new Error(result.error ?? 'Failed to create memo content')
    }

    return result.rows[0].uuid
}

export interface CreateMemoChunkParams {
    memo_uuid: string
    project_id: string
    chunk_content: string
    chunk_index: number
    embedding: number[]
}

export const createMemoChunk = async (params: CreateMemoChunkParams): Promise<string> => {
    const uuid = randomUUID()
    const result = await runQuery(
        `
        INSERT INTO skald_memochunk (uuid, memo_id, project_id, chunk_content, chunk_index, embedding)
        VALUES ($1, $2, $3, $4, $5, $6)
    `,
        [
            uuid,
            params.memo_uuid,
            params.project_id,
            params.chunk_content,
            params.chunk_index,
            JSON.stringify(params.embedding),
        ]
    )

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

export const createMemoSummary = async (
    memoUuid: string,
    projectId: string,
    summary: string,
    embedding: number[]
): Promise<string> => {
    const uuid = randomUUID()
    const result = await runQuery(
        `
        INSERT INTO skald_memosummary (uuid, memo_id, project_id, summary, embedding)
        VALUES ($1, $2, $3, $4, $5)
    `,
        [uuid, memoUuid, projectId, summary, JSON.stringify(embedding)]
    )

    if (result.error) {
        throw new Error(result.error)
    }

    return uuid
}

export interface CreateMemoTagParams {
    memo_uuid: string
    tag: string
}

export const createMemoTags = async (memoUuid: string, projectId: string, tags: string[]): Promise<void> => {
    const result = await insertData(
        'skald_memotag',
        tags.map((tag) => ({
            uuid: randomUUID(),
            memo_id: memoUuid,
            project_id: projectId,
            tag,
        }))
    )

    if (result.error) {
        throw new Error(result.error)
    }

    if (result.insertedCount !== tags.length) {
        throw new Error('Failed to create memo tags')
    }
}

export const fetchAllMemoTags = async (): Promise<string[]> => {
    const result = await runQuery<{ tag: string }>(
        `
        SELECT DISTINCT tag FROM skald_memotag
    `,
        []
    )

    if (result.error) {
        throw new Error(result.error)
    }

    if (!result.rows) {
        return []
    }

    return result.rows.map((row) => row.tag)
}

export interface MemoTitleAndUuid {
    title: string
    uuid: string
}

export const getMemoTitlesByTag = async (tag: string): Promise<MemoTitleAndUuid[]> => {
    const result = await runQuery<MemoTitleAndUuid>(
        `
        SELECT DISTINCT skald_memo.title, skald_memo.uuid
        FROM skald_memo
        JOIN skald_memotag ON skald_memo.uuid = skald_memotag.memo_id
        WHERE skald_memotag.tag = $1 AND skald_memo.pending = false AND skald_memo.archived = false
    `,
        [tag]
    )

    if (result.error) {
        throw new Error(result.error)
    }

    return result.rows || []
}

export const getMemoMetadata = async (memoUuid: string): Promise<Record<string, any>> => {
    const result = await runQuery<{ metadata: Record<string, any> }>(
        `
        SELECT metadata FROM skald_memo WHERE uuid = $1 AND archived = false AND pending = false
    `,
        [memoUuid]
    )

    if (result.error) {
        throw new Error(result.error)
    }

    if (!result.rows || result.rows.length === 0) {
        throw new Error('Memo not found')
    }

    return result.rows[0].metadata
}

export const getMemoContent = async (memoUuid: string): Promise<string> => {
    const result = await runQuery<{ content: string }>(
        `
        SELECT content FROM skald_memocontent WHERE memo_id = $1
    `,
        [memoUuid]
    )

    if (result.error) {
        throw new Error(result.error)
    }

    if (!result.rows || result.rows.length === 0) {
        return ''
    }

    return result.rows[0].content
}

export const keywordSearch = async (query: string): Promise<MemoTitleAndUuid[]> => {
    const result = await runQuery<MemoTitleAndUuid>(
        `
        SELECT DISTINCT skald_memo.title, skald_memo.uuid
        FROM skald_memo
        JOIN skald_memochunk ON skald_memo.uuid = skald_memochunk.memo_id
        JOIN skald_memochunkkeyword ON skald_memochunk.uuid = skald_memochunkkeyword.memo_chunk_id
        WHERE skald_memochunkkeyword.keyword ILIKE $1
    `,
        [`%${query}%`]
    )

    if (result.error) {
        throw new Error(result.error)
    }

    return result.rows || []
}
