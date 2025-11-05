import { MemoContent } from '@/entities/MemoContent'
import { createMemoChunks, extractTagsFromMemo, generateMemoSummary } from '@/memoProcessingServer/memoOperations'
import { EntityManager } from '@mikro-orm/core'
import { updateMemoStatus } from '@/lib/memoStatusUtils'
import { logger } from '@/lib/logger'

const processMemoContent = async (em: EntityManager, memoUuid: string) => {
    const memoContent = await em.findOne(MemoContent, { memo: { uuid: memoUuid } }, { populate: ['project', 'memo'] })
    if (!memoContent) {
        throw new Error(`Memo not found: ${memoUuid}`)
    }
    const promises = [
        createMemoChunks(em, memoContent.memo.uuid, memoContent.project.uuid, memoContent.content),
        extractTagsFromMemo(em, memoContent.memo.uuid, memoContent.content, memoContent.project.uuid),
        generateMemoSummary(em, memoContent.memo.uuid, memoContent.content, memoContent.project.uuid),
    ]

    await Promise.all(promises)
}

export const processMemo = async (em: EntityManager, memoUuid: string) => {
    try {
        await updateMemoStatus(em, memoUuid, {
            processing_status: 'processing',
            processing_started_at: new Date(),
        })

        await processMemoContent(em, memoUuid)

        await updateMemoStatus(em, memoUuid, {
            processing_status: 'processed',
            processing_completed_at: new Date(),
            processing_error: null,
        })

        logger.info({ memoUuid }, 'Memo processing completed successfully')
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown processing error'

        await updateMemoStatus(em, memoUuid, {
            processing_status: 'error',
            processing_completed_at: new Date(),
            processing_error: errorMessage,
        })

        logger.error({ err: error, memoUuid }, 'Memo processing failed')

        // Re-throw to allow queue retry logic
        throw error
    }
}
