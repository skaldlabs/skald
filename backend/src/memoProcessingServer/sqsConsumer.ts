import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand, Message } from '@aws-sdk/client-sqs'
import { processMemo } from '@/memoProcessingServer/processMemo'
import { AWS_REGION, SQS_QUEUE_URL } from '@/settings'
import { MikroORM } from '@mikro-orm/core'

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

    return new SQSClient({
        region: AWS_REGION,
    })
}

const receiveMessages = async () => {
    if (!sqsClient) {
        throw new Error('SQS client not initialized')
    }

    const command = new ReceiveMessageCommand({
        QueueUrl: SQS_QUEUE_URL,
        MaxNumberOfMessages: MAX_MESSAGES,
        WaitTimeSeconds: WAIT_TIME_SECONDS,
        VisibilityTimeout: VISIBILITY_TIMEOUT,
    })
    return await sqsClient.send(command)
}

const deleteMessage = async (message: Message) => {
    if (!sqsClient) {
        throw new Error('SQS client not initialized')
    }

    await sqsClient.send(
        new DeleteMessageCommand({
            QueueUrl: SQS_QUEUE_URL,
            ReceiptHandle: message.ReceiptHandle,
        })
    )
}

/**
 * Process a single SQS message
 */
async function processMessage(orm: MikroORM, message: Message): Promise<void> {
    if (!message.Body) {
        console.error('Message has no body:', message.MessageId)
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
        console.error('Error processing message:', error)
        // Message will become visible again after visibility timeout
        // Consider implementing a dead-letter queue for failed messages
        throw error
    }
}

/**
 * Poll SQS for messages and process them concurrently
 */
async function pollMessages(orm: MikroORM): Promise<void> {
    try {
        const response = await receiveMessages()

        if (response.Messages && response.Messages.length > 0) {
            console.log(`Received ${response.Messages.length} messages from SQS`)

            // Process all messages concurrently
            await Promise.allSettled(response.Messages.map((message: Message) => processMessage(orm, message)))
            console.log(`Successfully processed and deleted ${response.Messages.length} messages`)
        } else {
            console.log('No messages received, continuing to poll...')
        }
    } catch (error) {
        console.error('Error polling SQS:', error)
        // Wait a bit before retrying on error
        await new Promise((resolve) => setTimeout(resolve, 5000))
    }
}

/**
 * Start the SQS consumer loop
 */
export async function runSQSConsumer(orm: MikroORM): Promise<void> {
    sqsClient = initSQSClient()

    // Continuous polling loop
    while (true) {
        await pollMessages(orm)
    }
}
