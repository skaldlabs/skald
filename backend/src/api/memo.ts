import express, { Request, Response } from 'express'
import { z } from 'zod'
import multer from 'multer'
import { DI } from '@/di'
import { NextFunction } from 'express'
import { createNewMemo, sendMemoForAsyncProcessing } from '@/lib/createMemoUtils'
import { requireProjectAccess } from '@/middleware/authMiddleware'
import { trackUsage } from '@/middleware/usageTracking'
import { Project } from '@/entities/Project'
import { MemoContent } from '@/entities/MemoContent'
import { MemoSummary } from '@/entities/MemoSummary'
import { MemoTag } from '@/entities/MemoTag'
import { MemoChunk } from '@/entities/MemoChunk'
import { Memo } from '@/entities/Memo'
import { logger } from '@/lib/logger'
import { uploadFileToS3, generateS3Key, deleteFileFromS3 } from '@/lib/s3Utils'

// Configure multer for file uploads (store in memory)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
})

const CreatePlaintextMemoRequest = z.object({
    title: z.string().min(1, 'Title is required').max(255, 'Title must be 255 characters or less'),
    content: z.string().min(1, 'Content is required'),
    source: z.string().max(255).optional().nullable(),
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

    const contentType = req.headers['content-type']
    if (!contentType) {
        return res.status(400).json({ error: 'Content-Type header is required' })
    }

    const isMultipart = contentType.startsWith('multipart/form-data')
    const isJson = contentType.startsWith('application/json')

    if (!isMultipart && !isJson) {
        return res.status(400).json({
            error: 'Content-Type must be multipart/form-data or application/json',
        })
    }

    if (isMultipart) {
        upload.single('file')(req, res, async (err) => {
            if (err) {
                if (err instanceof multer.MulterError) {
                    if (err.code === 'LIMIT_FILE_SIZE') {
                        return res.status(400).json({ error: 'File size exceeds 10MB limit' })
                    }
                    return res.status(400).json({ error: `File upload error: ${err.message}` })
                }
                return res.status(500).json({ error: 'Internal server error during file upload' })
            }

            const file = req.file
            if (!file) {
                return res.status(400).json({ error: 'No file provided' })
            }

            try {
                const title = req.body.title || file.originalname
                const source = req.body.source || null
                const reference_id = req.body.reference_id || null
                const expiration_date = req.body.expiration_date ? new Date(req.body.expiration_date) : null
                const tags = req.body.tags ? JSON.parse(req.body.tags) : []
                const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : {}

                // Create memo first to get UUID
                const memoData = {
                    title: title.substring(0, 255),
                    source,
                    reference_id,
                    expiration_date,
                    tags,
                    metadata: {
                        ...metadata,
                        original_filename: file.originalname,
                        mimetype: file.mimetype,
                        size: file.size,
                    },
                }

                const memo = await createNewMemo({ ...memoData, type: 'document' }, project)

                // Upload file to S3
                const s3Key = generateS3Key(project.uuid, memo.uuid, file.originalname)
                await uploadFileToS3(file.buffer, s3Key, file.mimetype, {
                    'memo-uuid': memo.uuid,
                    'project-uuid': project.uuid,
                    'original-filename': file.originalname,
                })

                // Update memo metadata with S3 key
                memo.metadata = {
                    ...memo.metadata,
                    s3_key: s3Key,
                }
                await DI.em.persistAndFlush(memo)

                return res.status(201).json({ memo_uuid: memo.uuid })
            } catch (error) {
                logger.error({ err: error }, 'Error processing file upload')
                return res.status(500).json({ error: 'Failed to process uploaded file' })
            }
        })
        return
    }

    // Handle JSON request
    const validatedData = CreatePlaintextMemoRequest.safeParse(req.body)
    if (!validatedData.success) {
        return res.status(400).json({ error: validatedData.error.flatten() })
    }

    const memo = await createNewMemo({ ...validatedData.data, type: 'plaintext' }, project)

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
        return res.status(400).json({ error: validatedData.error.flatten() })
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
                if (validatedData.data[field] === null || validatedData.data[field] === undefined) {
                    continue
                }

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
        logger.error({ err: error }, 'Error in memo endpoint')
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

    // Delete file from S3 if it exists
    if (memo.metadata && memo.metadata.s3_key) {
        try {
            await deleteFileFromS3(memo.metadata.s3_key as string)
        } catch (error) {
            logger.error({ err: error, memoUuid: memo.uuid }, 'Failed to delete file from S3')
            // Continue with memo deletion even if S3 deletion fails
        }
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
