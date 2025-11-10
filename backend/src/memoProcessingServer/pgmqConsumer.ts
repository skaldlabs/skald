import { processMemo } from '@/memoProcessingServer/processMemo'
import { PGMQ_QUEUE_NAME, PGMQ_DLQ_NAME, PGMQ_MAX_RETRIES } from '@/settings'
import { MikroORM } from '@mikro-orm/core'
import { logger } from '@/lib/logger'
import * as Sentry from '@sentry/node'
import { receiveMessages, deleteMessage, archiveMessage, sendMessage, initPgmqClient } from '@/lib/pgmqClient'

interface MemoMessage {
    memo_uuid: string
}

/**
 * Process a single PGMQ message
 */
async function processMessage(orm: MikroORM, message: { msgId: number; readCount: number; enqueuedAt: Date; vt: Date; message: MemoMessage }): Promise<void> {
    try {
        const em = orm.em.fork()
        const data: MemoMessage = message.message

        logger.info({ memoUuid: data.memo_uuid, readCount: message.readCount }, 'Processing memo')

        await processMemo(em, data.memo_uuid)

        // Delete message from queue after successful processing
        await deleteMessage(PGMQ_QUEUE_NAME, message.msgId.toString())
        logger.info({ memoUuid: data.memo_uuid, messageId: message.msgId }, 'Successfully processed and deleted memo')
    } catch (error) {
        logger.error({ err: error, messageId: message.msgId }, 'Error processing message')

        // Check if we've exceeded max retries
        if (message.readCount >= PGMQ_MAX_RETRIES) {
            logger.error(
                { messageId: message.msgId, readCount: message.readCount },
                'Max retries exceeded, moving to DLQ'
            )

            // Move to DLQ by archiving the original message and sending to DLQ
            try {
                await archiveMessage(PGMQ_QUEUE_NAME, message.msgId.toString())
                await sendMessage(PGMQ_DLQ_NAME, JSON.stringify(message.message))
                logger.info({ messageId: message.msgId }, 'Message moved to DLQ')
            } catch (dlqError) {
                logger.error({ err: dlqError, messageId: message.msgId }, 'Failed to move message to DLQ')
                Sentry.captureException(dlqError)
            }
        } else {
            // Let the message become visible again for retry
            logger.info({ messageId: message.msgId, readCount: message.readCount }, 'Message will be retried')
        }
    }
}

/**
 * Poll PGMQ for messages and process them concurrently
 */
async function pollMessages(orm: MikroORM): Promise<void> {
    try {
        const messages = await receiveMessages(PGMQ_QUEUE_NAME, 60, 10)

        if (messages && messages.length > 0) {
            logger.info({ messageCount: messages.length }, 'Received messages from PGMQ')

            // Process all messages concurrently
            await Promise.allSettled(
                messages.map((message) => processMessage(orm, message as { msgId: number; readCount: number; enqueuedAt: Date; vt: Date; message: MemoMessage }))
            )
        } else {
            logger.debug('No messages received, continuing to poll...')
        }
    } catch (error) {
        logger.error({ err: error }, 'Error polling PGMQ')
        // Wait a bit before retrying on error
        await new Promise((resolve) => setTimeout(resolve, 5000))
    }
}

/**
 * Start the PGMQ consumer loop
 */
export async function runPgmqConsumer(orm: MikroORM): Promise<void> {
    // Initialize PGMQ client and ensure queues exist
    await initPgmqClient()

    logger.info({ queueName: PGMQ_QUEUE_NAME, dlqName: PGMQ_DLQ_NAME }, 'Starting PGMQ consumer')

    // Continuous polling loop
    while (true) {
        await pollMessages(orm)
    }
}
