import { MemoChunk } from '../entities/MemoChunk'
import { Project } from '../entities/Project'
import { MemoFilter } from '../lib/filterUtils'
import { DI } from '../index'
import { VECTOR_SEARCH_TOP_K } from '../settings'

export interface MemoChunkWithDistance {
    chunk: MemoChunk
    distance: number
}

/**
 * Build WHERE clause conditions for filters
 */
function buildFilterConditions(filters?: MemoFilter[]): { whereConditions: string[]; params: any[] } {
    const whereConditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (!filters || filters.length === 0) {
        return { whereConditions, params }
    }

    for (const filter of filters) {
        if (filter.filter_type === 'native_field' && filter.field === 'tags') {
            // Tags are in a separate MemoTag table
            const tagSubquery = `EXISTS (
                SELECT 1 FROM skald_memotag
                WHERE skald_memotag.memo_id = skald_memo.uuid
                AND skald_memotag.tag = ANY($${paramIndex})
            )`
            whereConditions.push(tagSubquery)
            params.push(filter.value)
            paramIndex++
        } else if (filter.filter_type === 'native_field') {
            // Native fields like title, source, client_reference_id
            const fieldPath = `skald_memo.${filter.field}`

            if (filter.operator === 'eq') {
                whereConditions.push(`${fieldPath} = $${paramIndex}`)
                params.push(filter.value)
                paramIndex++
            } else if (filter.operator === 'neq') {
                whereConditions.push(`${fieldPath} != $${paramIndex}`)
                params.push(filter.value)
                paramIndex++
            } else if (filter.operator === 'contains') {
                whereConditions.push(`${fieldPath} ILIKE $${paramIndex}`)
                params.push(`%${filter.value}%`)
                paramIndex++
            } else if (filter.operator === 'startswith') {
                whereConditions.push(`${fieldPath} LIKE $${paramIndex}`)
                params.push(`${filter.value}%`)
                paramIndex++
            } else if (filter.operator === 'endswith') {
                whereConditions.push(`${fieldPath} LIKE $${paramIndex}`)
                params.push(`%${filter.value}`)
                paramIndex++
            } else if (filter.operator === 'in') {
                whereConditions.push(`${fieldPath} = ANY($${paramIndex})`)
                params.push(filter.value)
                paramIndex++
            } else if (filter.operator === 'not_in') {
                whereConditions.push(`${fieldPath} != ALL($${paramIndex})`)
                params.push(filter.value)
                paramIndex++
            }
        } else if (filter.filter_type === 'custom_metadata') {
            // Custom metadata fields
            const metadataPath = `skald_memo.metadata->>'${filter.field}'`

            if (filter.operator === 'eq') {
                whereConditions.push(`${metadataPath} = $${paramIndex}`)
                params.push(filter.value)
                paramIndex++
            } else if (filter.operator === 'neq') {
                whereConditions.push(`${metadataPath} != $${paramIndex}`)
                params.push(filter.value)
                paramIndex++
            } else if (filter.operator === 'contains') {
                whereConditions.push(`${metadataPath} ILIKE $${paramIndex}`)
                params.push(`%${filter.value}%`)
                paramIndex++
            } else if (filter.operator === 'startswith') {
                whereConditions.push(`${metadataPath} LIKE $${paramIndex}`)
                params.push(`${filter.value}%`)
                paramIndex++
            } else if (filter.operator === 'endswith') {
                whereConditions.push(`${metadataPath} LIKE $${paramIndex}`)
                params.push(`%${filter.value}`)
                paramIndex++
            } else if (filter.operator === 'in') {
                whereConditions.push(`${metadataPath} = ANY($${paramIndex})`)
                params.push(filter.value)
                paramIndex++
            } else if (filter.operator === 'not_in') {
                whereConditions.push(`${metadataPath} != ALL($${paramIndex})`)
                params.push(filter.value)
                paramIndex++
            }
        }
    }

    return { whereConditions, params }
}

/**
 * Search for the most similar memo chunks using cosine distance with optional filtering
 */
export const memoChunkVectorSearch = async (
    project: Project,
    embeddingVector: number[],
    topK: number = VECTOR_SEARCH_TOP_K,
    similarityThreshold: number = 0.55,
    filters?: MemoFilter[]
): Promise<MemoChunkWithDistance[]> => {
    const { whereConditions, params } = buildFilterConditions(filters)

    // Base parameters: embedding vector, similarity threshold, project UUID, topK
    const baseParams = [JSON.stringify(embeddingVector), similarityThreshold, project.uuid, topK]
    const allParams = [...baseParams, ...params]

    // Build WHERE clause
    let whereClause = `
        WHERE (skald_memochunk.embedding <=> $1::vector) <= $2
        AND skald_memochunk.project_id = $3
    `

    if (whereConditions.length > 0) {
        // Adjust parameter indices in where conditions since we have 4 base params
        const adjustedConditions = whereConditions.map((condition) => {
            // Replace parameter indices by adding 4 (for the base params)
            return condition.replace(/\$(\d+)/g, (match, num) => `$${parseInt(num) + 4}`)
        })
        whereClause += ' AND ' + adjustedConditions.join(' AND ')
    }

    const sql = `
        SELECT
            skald_memochunk.*,
            (skald_memochunk.embedding <=> $1::vector) as distance
        FROM skald_memochunk
        JOIN skald_memo ON skald_memochunk.memo_id = skald_memo.uuid
        ${whereClause}
        ORDER BY distance
        LIMIT $4
    `

    try {
        const results = await DI.em.getConnection().execute<any[]>(sql, allParams)

        // Map results to MemoChunkWithDistance objects
        return (
            results?.map((row) => ({
                chunk: {
                    uuid: row.uuid,
                    chunk_content: row.chunk_content,
                    chunk_index: row.chunk_index,
                    embedding: row.embedding,
                    memo: row.memo_id,
                    project: row.project_id,
                } as any,
                distance: row.distance,
            })) || []
        )
    } catch (error) {
        throw new Error(`Vector search error: ${error}`)
    }
}
