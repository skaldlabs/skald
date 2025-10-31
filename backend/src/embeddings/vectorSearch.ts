import { Project } from '@/entities/Project'
import { buildFilterConditions, MemoFilter } from '@/lib/filterUtils'
import { DI } from '@/di'
import { VECTOR_SEARCH_TOP_K } from '@/settings'
import { Operator } from '@/lib/filterUtils'

export interface MemoChunkWithDistance {
    chunk: {
        uuid: string
        chunk_content: string
        chunk_index: number
        embedding: number[]
        memo_uuid: string
        project_uuid: string
    }
    distance: number
}

interface FieldFilterDefinition {
    getWhereClause: (field: string) => string
    getFormattedValue: (value: any) => any
}

export const filterByOperator: Record<Operator, FieldFilterDefinition> = {
    eq: {
        getWhereClause: (field: string) => `${field} = ?`,
        getFormattedValue: (value: any) => value,
    },
    neq: {
        getWhereClause: (field: string) => `${field} != ?`,
        getFormattedValue: (value: any) => value,
    },
    contains: {
        getWhereClause: (field: string) => `${field} ILIKE ?`,
        getFormattedValue: (value: any) => `%${value}%`,
    },
    startswith: {
        getWhereClause: (field: string) => `${field} LIKE ?`,
        getFormattedValue: (value: any) => `${value}%`,
    },
    endswith: {
        getWhereClause: (field: string) => `${field} LIKE ?`,
        getFormattedValue: (value: any) => `%${value}`,
    },
    in: {
        getWhereClause: (field: string) => `${field} = ANY(?)`,
        getFormattedValue: (value: any) => value,
    },
    not_in: {
        getWhereClause: (field: string) => `${field} != ALL(?)`,
        getFormattedValue: (value: any) => value,
    },
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
    const allParams = [JSON.stringify(embeddingVector), JSON.stringify(embeddingVector), ...params]

    let whereClause = `
        WHERE (skald_memochunk.embedding <=> ?::vector) <= ${similarityThreshold}
        AND skald_memochunk.project_id = '${project.uuid}'
    `

    if (whereConditions.length > 0) {
        whereClause += ' AND ' + whereConditions.join(' AND ')
    }

    const sql = `
        SELECT
            skald_memochunk.*,
            (skald_memochunk.embedding <=> ?::vector) as distance
        FROM skald_memochunk
        JOIN skald_memo ON skald_memochunk.memo_id = skald_memo.uuid
        ${whereClause}
        ORDER BY distance
        LIMIT ${topK}
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
                    memo_uuid: row.memo_id,
                    project_uuid: row.project_id,
                } as any,
                distance: row.distance,
            })) || []
        )
    } catch (error) {
        throw new Error(`Vector search error: ${error}`)
    }
}
