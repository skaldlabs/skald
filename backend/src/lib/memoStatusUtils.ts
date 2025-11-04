import { EntityManager } from '@mikro-orm/core'
import { Memo, MemoProcessingStatus } from '@/entities/Memo'
import { logger } from '@/lib/logger'

export interface MemoStatusUpdate {
    processing_status?: MemoProcessingStatus
    processing_started_at?: Date | null
    processing_completed_at?: Date | null
    processing_error?: string | null
}

/**
 * Updates the processing status of a memo
 */
export async function updateMemoStatus(em: EntityManager, memoUuid: string, updates: MemoStatusUpdate): Promise<void> {
    try {
        const memo = await em.findOne(Memo, { uuid: memoUuid })

        if (!memo) {
            logger.error({ memoUuid }, 'Memo not found for status update')
            throw new Error(`Memo not found: ${memoUuid}`)
        }

        if (updates.processing_status !== undefined) {
            memo.processing_status = updates.processing_status
        }
        if (updates.processing_started_at !== undefined) {
            memo.processing_started_at = updates.processing_started_at || undefined
        }
        if (updates.processing_completed_at !== undefined) {
            memo.processing_completed_at = updates.processing_completed_at || undefined
        }
        if (updates.processing_error !== undefined) {
            memo.processing_error = updates.processing_error || undefined
        }

        await em.persistAndFlush(memo)

        logger.info({ memoUuid, status: memo.processing_status }, 'Updated memo processing status')
    } catch (error) {
        logger.error({ err: error, memoUuid }, 'Failed to update memo status')
        throw error
    }
}
