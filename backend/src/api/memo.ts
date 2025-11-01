import express, { Request, Response } from 'express'
import { z } from 'zod'
import { DI } from '@/di'
import { NextFunction } from 'express'
import { sendErrorResponse } from '@/lib/errorHandler'
import { createNewMemo, sendMemoForAsyncProcessing } from '@/lib/createMemoUtils'
import { requireProjectAccess } from '@/middleware/authMiddleware'
import { trackUsage } from '@/middleware/usageTracking'
import { Project } from '@/entities/Project'
import { MemoContent } from '@/entities/MemoContent'
import { MemoSummary } from '@/entities/MemoSummary'
import { MemoTag } from '@/entities/MemoTag'
import { MemoChunk } from '@/entities/MemoChunk'
import { Memo } from '@/entities/Memo'

const CreateMemoRequest = z.object({
    title: z.string().min(1, 'Title is required').max(255, 'Title must be 255 characters or less'),
    content: z.string().min(1, 'Content is required'),
    source: z.string().max(255).optional().nullable(),
    type: z.string().max(255).optional().nullable(),
    reference_id: z.string().max(255).optional().nullable(),
    expiration_date: z.coerce
        .date()
        .optional()
        .nullable()
        .refine((date) => (date ? date > new Date() : true), {
            message: 'Expiration date must be in the future',
        }),
    tags: z.array(z.string()).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
})

const UpdateMemoRequest = z.object({
    title: z.string().max(255).optional().nullable(),
    metadata: z.record(z.string(), z.unknown()).optional().nullable(),
    client_reference_id: z.string().max(255).optional().nullable(),
    source: z.string().max(255).optional().nullable(),
    expiration_date: z.coerce.date().optional().nullable(),
    content: z.string().optional().nullable(),
})

const validateMemoOperationRequestMiddleware = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const project = req.context?.requestUser?.project
        if (!project) {
            return res.status(404).json({ error: 'Project not found' })
        }

        const idType = (req.query.id_type as string) || 'memo_uuid'

        if (idType !== 'memo_uuid' && idType !== 'reference_id') {
            return res.status(400).json({
                error: "id_type must be either 'memo_uuid' or 'reference_id'",
            })
        }

        return next()
    }
}

const createMemo = async (req: Request, res: Response) => {
    const project = req.context?.requestUser?.project
    if (!project) {
        return res.status(404).json({ error: 'Project not found' })
    }
    const validatedData = CreateMemoRequest.safeParse(req.body)
    if (!validatedData.success) {
        return sendErrorResponse(res, validatedData.error, 400)
    }

    const memo = await createNewMemo(validatedData.data, project)

    return res.status(201).json({ memo_uuid: memo.uuid })
}

export const getMemo = async (req: Request, res: Response) => {
    const project = req.context?.requestUser?.project as Project
    const { id } = req.params
    const idType = (req.query.id_type as string) || 'memo_uuid'

    const whereClause = idType === 'memo_uuid' ? { uuid: id, project } : { client_reference_id: id, project }

    const memo = await DI.memos.findOne(whereClause, {
        populate: ['project'],
    })

    if (!memo) {
        return res.status(404).json({ error: 'Memo not found' })
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
export const updateMemo = async (req: Request, res: Response) => {
    const project = req.context?.requestUser?.project as Project
    const { id } = req.params
    const idType = (req.query.id_type as string) || 'memo_uuid'

    const whereClause = idType === 'memo_uuid' ? { uuid: id, project } : { client_reference_id: id, project }

    const memo = await DI.memos.findOne(whereClause, {
        populate: ['project'],
    })

    if (!memo) {
        return res.status(404).json({ error: 'Memo not found' })
    }

    const validatedData = UpdateMemoRequest.safeParse(req.body)
    if (!validatedData.success) {
        return sendErrorResponse(res, validatedData.error, 400)
    }

    const em = DI.em.fork()

    try {
        await em.begin()

        let contentUpdated = false
        for (const field of Object.keys(validatedData.data) as (keyof typeof validatedData.data)[]) {
            if (field === 'content') {
                contentUpdated = true
                DI.memoContents.findOne({ memo })
                const [memoSummary, memoTags, memoChunks] = await Promise.all([
                    DI.memoSummaries.findOne({ memo }),
                    DI.memoTags.find({ memo }),
                    DI.memoChunks.find({ memo }),
                ])
                const memoContent = await DI.memoContents.findOne({ memo })
                if (memoContent) {
                    memoContent.content = validatedData.data['content'] as string
                    em.persist(memoContent)
                }
                if (memoSummary) {
                    em.remove(memoSummary)
                }
                em.remove(memoTags)
                em.remove(memoChunks)
            } else {
                memo[field] = validatedData.data[field]
            }
        }

        if (contentUpdated) {
            await sendMemoForAsyncProcessing(memo)
        }

        await em.persistAndFlush(memo)
        await em.commit()

        return res.status(200).json({ ok: true })
    } catch (error) {
        console.error(error)
        await em.rollback()
        return res.status(503).json({ error: 'Service unavailable' })
    }
}

export const listMemos = async (req: Request, res: Response) => {
    const project = req.context?.requestUser?.project as Project

    if (!project) {
        return res.status(404).json({ error: 'Project not found' })
    }

    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.page_size as string) || 20
    const maxPageSize = 100

    if (pageSize > maxPageSize) {
        return res.status(400).json({ error: `page_size must be less than or equal to ${maxPageSize}` })
    }

    if (page < 1) {
        return res.status(400).json({ error: 'page must be greater than or equal to 1' })
    }

    const offset = (page - 1) * pageSize

    const [memos, totalCount] = await DI.memos.findAndCount(
        { project },
        {
            orderBy: { created_at: 'DESC' },
            limit: pageSize,
            offset: offset,
        }
    )

    // Load summaries for all memos
    const memoSummaries = await DI.memoSummaries.find({
        memo: { $in: memos.map((m) => m.uuid) },
    })

    const summaryMap = new Map(memoSummaries.map((s) => [s.memo.uuid, s.summary]))

    const results = memos.map((memo) => ({
        uuid: memo.uuid,
        created_at: memo.created_at,
        updated_at: memo.updated_at,
        title: memo.title,
        summary: summaryMap.get(memo.uuid) || null,
        content_length: memo.content_length,
        metadata: memo.metadata,
        client_reference_id: memo.client_reference_id,
    }))

    return res.status(200).json({
        results,
        count: totalCount,
        page,
        page_size: pageSize,
        total_pages: Math.ceil(totalCount / pageSize),
    })
}

export const deleteMemo = async (req: Request, res: Response) => {
    const project = req.context?.requestUser?.project as Project
    const { id } = req.params
    const idType = (req.query.id_type as string) || 'memo_uuid'

    const whereClause = idType === 'memo_uuid' ? { uuid: id, project } : { client_reference_id: id, project }

    const memo = await DI.memos.findOne(whereClause, {
        populate: ['project'],
    })

    if (!memo) {
        return res.status(404).json({ error: 'Memo not found' })
    }

    // delete memo and all related data -- content, summary, tags, chunks
    await DI.em.transactional(async (em) => {
        await em.nativeDelete(MemoContent, { memo: { $in: [memo.uuid] } })
        await em.nativeDelete(MemoSummary, { memo: { $in: [memo.uuid] } })
        await em.nativeDelete(MemoTag, { memo: { $in: [memo.uuid] } })
        await em.nativeDelete(MemoChunk, { memo: { $in: [memo.uuid] } })
        await em.nativeDelete(Memo, { uuid: memo.uuid })
    })

    return res.status(204).send()
}

export const memoRouter = express.Router({ mergeParams: true })
memoRouter.use(requireProjectAccess())
memoRouter.get('/', listMemos)
memoRouter.post('/', trackUsage('memo_operations'), createMemo)
memoRouter.get('/:id', [validateMemoOperationRequestMiddleware()], getMemo)
memoRouter.patch('/:id', [validateMemoOperationRequestMiddleware(), trackUsage('memo_operations')], updateMemo)
memoRouter.delete(
    '/:id',
    [validateMemoOperationRequestMiddleware(), trackUsage('memo_operations', { increment: false })],
    deleteMemo
)
