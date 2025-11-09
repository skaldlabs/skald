import { Message } from '@aws-sdk/client-sqs'
import { processMemo } from '@/memoProcessingServer/processMemo'
import { SQS_DLQ_QUEUE_URL } from '@/settings'
import { MikroORM } from '@mikro-orm/core'
import { logger } from '@/lib/logger'
import * as Sentry from '@sentry/node'
import { deleteMessage, receiveMessages, publishMessage } from '@/lib/sqsClient'

interface MemoMessage {
    memo_uuid: string
}

/**
 * Process a single SQS message
 */
async function processMessage(orm: MikroORM, message: Message): Promise<void> {
    if (!message.Body) {
        logger.error({ messageId: message.MessageId }, 'Message has no body')
        return
    }

    try {
        const em = orm.em.fork()
        const data: MemoMessage = JSON.parse(message.Body)

        await processMemo(em, data.memo_uuid)

        // Delete message from queue after successful processing
        if (message.ReceiptHandle) {
            await deleteMessage(message)
        }
    } catch (error) {
        logger.error({ err: error }, 'Error processing message')

        await deleteMessage(message)
        if (!SQS_DLQ_QUEUE_URL) {
            logger.error('SQS_DLQ_QUEUE_URL is not set, message will be lost')
            Sentry.captureException(new Error('SQS_DLQ_QUEUE_URL is not set, message will be lost'))
        } else {
            await publishMessage(message.Body, SQS_DLQ_QUEUE_URL)
        }
    }
}

/**
 * Poll SQS for messages and process them concurrently
 */
async function pollMessages(orm: MikroORM): Promise<void> {
    try {
        const response = await receiveMessages()

        if (response.Messages && response.Messages.length > 0) {
            logger.info({ messageCount: response.Messages.length }, 'Received messages from SQS')

            // Process all messages concurrently
            await Promise.allSettled(response.Messages.map((message: Message) => processMessage(orm, message)))
            logger.info({ messageCount: response.Messages.length }, 'Successfully processed and deleted messages')
        } else {
            logger.debug('No messages received, continuing to poll...')
        }
    } catch (error) {
        logger.error({ err: error }, 'Error polling SQS')
        // Wait a bit before retrying on error
        await new Promise((resolve) => setTimeout(resolve, 5000))
    }
}

/**
 * Start the SQS consumer loop
 */
export async function runSQSConsumer(orm: MikroORM): Promise<void> {
    // Continuous polling loop
    while (true) {
        await pollMessages(orm)
    }
}
