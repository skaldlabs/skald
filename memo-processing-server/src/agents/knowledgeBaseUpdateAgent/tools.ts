import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import {
    getMemoTitlesByTag,
    getMemoMetadata,
    getMemoContent,
    keywordSearch,
    updateMemo,
    deleteMemo,
} from '../../db/memo'
import {
    memoChunkVectorSearchWithMemoInfo,
    memoSummaryVectorSearchWithMemoInfo,
} from '../../vectorEmbeddings/vectorSearch'
import { generateVectorEmbeddingForSearch } from '../../vectorEmbeddings/voyage'
import { createMemoChunks, extractTagsFromMemo, generateMemoSummary } from './memoOperations'
import { FetchMemoResult } from '../../db/memo'
import { handleNewMemoCreation } from './knowledgeBaseUpdateUtils'

const getMemoTitlesByTagSchema = z.object({
    tag: z.string().describe('The tag to search for'),
})

export const getMemoTitlesByTagTool = tool(
    async (input) => {
        const parsed = getMemoTitlesByTagSchema.parse(input)
        const memos = await getMemoTitlesByTag(parsed.tag)
        console.log(
            'get_memo_titles_by_tag called! tag:',
            parsed.tag,
            'returning memos:',
            memos.map((m) => m.uuid)
        )
        return JSON.stringify(memos)
    },
    {
        name: 'get_memo_titles_by_tag',
        schema: getMemoTitlesByTagSchema,
        description: 'Get all the titles of the memos in the knowledge base that are tagged with a given tag',
    }
)

const getMemoMetadataSchema = z.object({
    memo_uuid: z.string().describe('The UUID of the memo'),
})

export const getMemoMetadataTool = tool(
    async (input) => {
        const parsed = getMemoMetadataSchema.parse(input)
        console.log('get_memo_metadata called! returning metadata of memo:', parsed.memo_uuid)
        const metadata = await getMemoMetadata(parsed.memo_uuid)
        return JSON.stringify(metadata)
    },
    {
        name: 'get_memo_metadata',
        schema: getMemoMetadataSchema,
        description: 'Get metadata for a given memo, including the title and the summary',
    }
)

const getMemoContentSchema = z.object({
    memo_uuid: z.string().describe('The UUID of the memo'),
})

export const getMemoContentTool = tool(
    async (input) => {
        const parsed = getMemoContentSchema.parse(input)
        console.log('get_memo_content called! returning content of memo:', parsed.memo_uuid)
        const content = await getMemoContent(parsed.memo_uuid)
        return content
    },
    {
        name: 'get_memo_content',
        schema: getMemoContentSchema,
        description: 'Get the full raw content of a given memo',
    }
)

const keywordSearchSchema = z.object({
    query: z.string().describe('The keyword to search for'),
})

export const keywordSearchTool = tool(
    async (input) => {
        const parsed = keywordSearchSchema.parse(input)
        const memos = await keywordSearch(parsed.query)
        console.log(
            'keyword_search called! query:',
            parsed.query,
            'returning memos:',
            memos.map((m) => m.uuid)
        )
        return JSON.stringify(memos)
    },
    {
        name: 'keyword_search',
        schema: keywordSearchSchema,
        description: 'Perform a keyword search on the knowledge base for memos that contain a given keyword',
    }
)

const vectorSearchSchema = z.object({
    query: z.string().describe('The query to search for'),
})

export const summaryVectorSearchTool = tool(
    async (input) => {
        const parsed = vectorSearchSchema.parse(input)
        const embeddingVector = await generateVectorEmbeddingForSearch(parsed.query)
        const memoSummaries = await memoSummaryVectorSearchWithMemoInfo(embeddingVector)
        console.log(
            'summary_vector_search called! query:',
            parsed.query,
            'returning memo_summaries:',
            memoSummaries.map((ms) => ms.uuid)
        )
        return JSON.stringify(memoSummaries)
    },
    {
        name: 'summary_vector_search',
        schema: vectorSearchSchema,
        description:
            'Perform a vector search on the knowledge base for summaries of memos that are similar to the given query',
    }
)

export const vectorSearchTool = tool(
    async (input) => {
        const parsed = vectorSearchSchema.parse(input)
        const embeddingVector = await generateVectorEmbeddingForSearch(parsed.query)
        const memoChunks = await memoChunkVectorSearchWithMemoInfo(embeddingVector)
        console.log(
            'vector_search called! query:',
            parsed.query,
            'returning memo_chunks:',
            memoChunks.map((mc) => mc.uuid)
        )
        return JSON.stringify(memoChunks)
    },
    {
        name: 'vector_search',
        schema: vectorSearchSchema,
        description: 'Perform a vector search on the knowledge base for memos that are similar to the given query',
    }
)

const insertActionSchema = z.object({
    content: z.string().describe('The full raw content of the memo to insert'),
    title: z.string().describe('The title of the memo to insert'),
})

export const createInsertActionTool = (memo: FetchMemoResult) => {
    return tool(
        async (input): Promise<string> => {
            console.log('insert_action called! input:', input)
            const parsed = insertActionSchema.parse(input)
            const content = parsed.content
            if (content === 'provided_content_unchanged') {
                await updateMemo(memo.uuid, [
                    {
                        column: 'pending',
                        value: false,
                    },
                ])
                const promises = [
                    createMemoChunks(memo.uuid, memo.project_id, memo.content),
                    extractTagsFromMemo(memo),
                    generateMemoSummary(memo),
                ]

                await Promise.all(promises)
                return memo.uuid
            }

            const newMemoUuid = await handleNewMemoCreation(memo.project_id, parsed.title, content)
            return newMemoUuid
        },
        {
            name: 'insert_action',
            schema: insertActionSchema,
            description: 'Insert a new memo into the knowledge base',
        }
    )
}

const deleteActionSchema = z.object({
    memo_uuid: z.string().describe('The UUID of the memo to delete'),
})

export const deleteActionTool = tool(
    async (input): Promise<string> => {
        const parsed = deleteActionSchema.parse(input)
        console.log('delete_action called! memo_uuid:', parsed.memo_uuid)
        await deleteMemo(parsed.memo_uuid)
        return parsed.memo_uuid
    },
    {
        name: 'delete_action',
        schema: deleteActionSchema,
        description: 'Delete a memo from the knowledge base',
    }
)

export const updateActionSchema = z.object({
    memo_uuid: z.string().describe('The UUID of the memo to update'),
    content: z.string().describe('The full raw content of the memo to update'),
    title: z.string().describe('The title of the memo to update'),
})

export const createUpdateActionTool = (memo: FetchMemoResult) => {
    return tool(
        async (input): Promise<string> => {
            const parsed = updateActionSchema.parse(input)
            console.log(
                'update_action called! memo_uuid:',
                parsed.memo_uuid,
                'content:',
                parsed.content,
                'title:',
                parsed.title
            )
            await deleteMemo(parsed.memo_uuid)
            await handleNewMemoCreation(memo.project_id, parsed.title, parsed.content)
            return parsed.memo_uuid
        },
        {
            name: 'update_action',
            schema: updateActionSchema,
            description: 'Update a memo in the knowledge base',
        }
    )
}
