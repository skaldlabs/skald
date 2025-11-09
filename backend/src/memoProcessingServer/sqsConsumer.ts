import {
    SQSClient,
    ReceiveMessageCommand,
    DeleteMessageCommand,
    Message,
    SendMessageCommand,
    SendMessageCommandOutput,
} from '@aws-sdk/client-sqs'
import { processMemo } from '@/memoProcessingServer/processMemo'
import { AWS_REGION, SQS_DLQ_QUEUE_URL, SQS_QUEUE_URL } from '@/settings'
import { MikroORM } from '@mikro-orm/core'
import { logger } from '@/lib/logger'
import * as Sentry from '@sentry/node'

const MAX_MESSAGES = 10
const WAIT_TIME_SECONDS = 1
const VISIBILITY_TIMEOUT = 60

interface MemoMessage {
    memo_uuid: string
}

let sqsClient: SQSClient | null = null

const initSQSClient = () => {
    if (sqsClient) {
        return sqsClient
    }

    // AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are automatically pulled from the environment
    sqsClient = new SQSClient({
        region: AWS_REGION,
    })

    return sqsClient
}

const receiveMessages = async () => {
    const _sqsClient = initSQSClient()

    const command = new ReceiveMessageCommand({
        QueueUrl: SQS_QUEUE_URL,
        MaxNumberOfMessages: MAX_MESSAGES,
        WaitTimeSeconds: WAIT_TIME_SECONDS,
        VisibilityTimeout: VISIBILITY_TIMEOUT,
    })
    return await _sqsClient.send(command)
}

const deleteMessage = async (message: Message) => {
    const _sqsClient = initSQSClient()

    await _sqsClient.send(
        new DeleteMessageCommand({
            QueueUrl: SQS_QUEUE_URL,
            ReceiptHandle: message.ReceiptHandle,
        })
    )
}

export const publishMessage = async (message: string, queueUrl: string): Promise<SendMessageCommandOutput> => {
    const _sqsClient = initSQSClient()

    const command = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: message,
    })

    const response = await _sqsClient.send(command)

    return response
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
