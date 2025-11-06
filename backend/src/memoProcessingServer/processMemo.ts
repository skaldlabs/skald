import { createMemoChunks, extractTagsFromMemo, generateMemoSummary } from '@/memoProcessingServer/memoOperations'
import { EntityManager } from '@mikro-orm/core'
import { updateMemoStatus } from '@/lib/memoStatusUtils'
import { logger } from '@/lib/logger'
import { DocumentProcessingService } from '@/services/documentProcessingService'

const runMemoProcessingAgents = async (em: EntityManager, memoUuid: string) => {
    const sql = `
        SELECT 
            m.uuid as memo_uuid,
            m.project_id,
            m.type,
            mc.content
        FROM skald_memo m
        LEFT JOIN skald_memocontent mc ON mc.memo_id = m.uuid
        WHERE m.uuid = ?
    `

    const result = await em.getConnection().execute<
        Array<{
            memo_uuid: string
            project_id: string
            type: string | null
            content: string | null
        }>
    >(sql, [memoUuid])

    if (!result || result.length === 0) {
        throw new Error(`Memo not found: ${memoUuid}`)
    }

    const row = result[0]

    if (row.type === 'document') {
        const markdown = await DocumentProcessingService.sendDocumentForProcessing(row.project_id, row.memo_uuid)
        row.content = markdown
    }

    if (!row.content) {
        logger.warn({ memoUuid }, 'No content found for memo, skipping processing')
        return
    }

    const promises = [
        createMemoChunks(em, row.memo_uuid, row.project_id, row.content),
        extractTagsFromMemo(em, row.memo_uuid, row.content, row.project_id),
        generateMemoSummary(em, row.memo_uuid, row.content, row.project_id),
    ]

    await Promise.all(promises)
}

export const processMemo = async (em: EntityManager, memoUuid: string) => {
    try {
        await updateMemoStatus(em, memoUuid, {
            processing_status: 'processing',
            processing_started_at: new Date(),
        })

        await runMemoProcessingAgents(em, memoUuid)

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
