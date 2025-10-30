import express, { Request, Response } from 'express'
import { z } from 'zod'
import { DI } from '../di'

import { createNewMemo } from '../lib/createMemoUtils'

const CreateMemoRequest = z.object({
    title: z.string().min(1, 'Title is required').max(255, 'Title must be 255 characters or less'),
    content: z.string().min(1, 'Content is required'),
    source: z.string().max(255).optional().nullable(),
    type: z.string().max(255).optional().nullable(),
    reference_id: z.string().max(255).optional().nullable(),
    expiration_date: z.date().optional().nullable(),
    tags: z.array(z.string()).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
})

const createMemo = async (req: Request, res: Response) => {
    const project = req.context?.requestUser?.project
    if (!project) {
        return res.status(404).json({ error: 'Project not found' })
    }
    const validatedData = CreateMemoRequest.safeParse(req.body)
    if (!validatedData.success) {
        return res.status(400).json({ error: 'Invalid request data', details: validatedData.error.issues })
    }

    await createNewMemo(validatedData.data, project)

    return res.status(201).json({ ok: true })
}

export const getMemo = async (req: Request, res: Response) => {
    const project = req.context?.requestUser?.project
    if (!project) {
        return res.status(404).json({ error: 'Project not found' })
    }

    const { id } = req.params
    const idType = (req.query.id_type as string) || 'memo_uuid'

    if (idType !== 'memo_uuid' && idType !== 'reference_id') {
        return res.status(400).json({
            error: "id_type must be either 'memo_uuid' or 'reference_id'",
        })
    }

    const whereClause = idType === 'memo_uuid' ? { uuid: id, project } : { client_reference_id: id, project }

    const memo = await DI.memos.findOne(whereClause, {
        populate: ['project'],
    })

    if (!memo) {
        return res.status(404).json({ error: 'Memo not found' })
    }

    // Verify user can access this memo's project
    if (req.context?.requestUser?.userType === 'projectAPIKeyUser') {
        if (memo.project.uuid !== project.uuid) {
            return res.status(403).json({ error: 'Resource does not belong to the project' })
        }
    } else if (req.context?.requestUser?.userType === 'authenticatedUser') {
        const user = req.context.requestUser.userInstance
        if (user) {
            const { isUserOrgMember } = await import('../middleware/authMiddleware')
            const isMember = await isUserOrgMember(user, memo.project.organization)
            if (!isMember) {
                return res.status(403).json({ error: 'Access denied' })
            }
        }
    }

    // Load related data for detailed response
    const [memoContent, memoSummary, memoTags, memoChunks] = await Promise.all([
        DI.memoContents.findOne({ memo }),
        DI.memoSummaries.findOne({ memo }),
        DI.memoTags.find({ memo }),
        DI.memoChunks.find({ memo }, { orderBy: { chunk_index: 'asc' } }),
    ])

    const detailedMemo = {
        uuid: memo.uuid,
        created_at: memo.created_at,
        updated_at: memo.updated_at,
        title: memo.title,
        content: memoContent?.content || null,
        summary: memoSummary?.summary || null,
        content_length: memo.content_length,
        metadata: memo.metadata,
        client_reference_id: memo.client_reference_id,
        source: memo.source,
        type: memo.type,
        expiration_date: memo.expiration_date,
        archived: memo.archived,
        pending: memo.pending,
        tags: memoTags.map((tag) => ({ uuid: tag.uuid, tag: tag.tag })),
        chunks: memoChunks.map((chunk) => ({
            uuid: chunk.uuid,
            chunk_content: chunk.chunk_content,
            chunk_index: chunk.chunk_index,
        })),
    }

    return res.status(200).json(detailedMemo)
}

export const memoRouter = express.Router({ mergeParams: true })
memoRouter.post('/', createMemo)
memoRouter.get('/:id', getMemo)
