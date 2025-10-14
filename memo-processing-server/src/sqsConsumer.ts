import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand, Message } from '@aws-sdk/client-sqs'
import { processMemo } from './processMemo'

const AWS_REGION = process.env.AWS_REGION || 'us-east-1'
const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL
const MAX_MESSAGES = 10
const WAIT_TIME_SECONDS = 20 // Long polling
const VISIBILITY_TIMEOUT = 300 // 5 minutes - adjust based on your processing time

if (!SQS_QUEUE_URL) {
    throw new Error('SQS_QUEUE_URL environment variable is required')
}

const sqsClient = new SQSClient({
    region: AWS_REGION,
})

interface MemoMessage {
    memo_uuid: string
}

/**
 * Process a single SQS message
 */
async function processMessage(message: Message): Promise<void> {
    if (!message.Body) {
        console.error('Message has no body:', message.MessageId)
        return
    }

    try {
        const data: MemoMessage = JSON.parse(message.Body)
        console.log(`Processing memo: ${data.memo_uuid}`)

        await processMemo(data.memo_uuid)

        // Delete message from queue after successful processing
        if (message.ReceiptHandle) {
            await sqsClient.send(
                new DeleteMessageCommand({
                    QueueUrl: SQS_QUEUE_URL,
                    ReceiptHandle: message.ReceiptHandle,
                })
            )
            console.log(`Successfully processed and deleted message: ${data.memo_uuid}`)
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
async function pollMessages(): Promise<void> {
    try {
        const command = new ReceiveMessageCommand({
            QueueUrl: SQS_QUEUE_URL,
            MaxNumberOfMessages: MAX_MESSAGES,
            WaitTimeSeconds: WAIT_TIME_SECONDS,
            VisibilityTimeout: VISIBILITY_TIMEOUT,
        })

        const response = await sqsClient.send(command)

        if (response.Messages && response.Messages.length > 0) {
            console.log(`Received ${response.Messages.length} messages from SQS`)

            // Process all messages concurrently
            await Promise.allSettled(response.Messages.map((message: Message) => processMessage(message)))
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
export async function runSQSConsumer(): Promise<void> {
    console.log('Starting SQS consumer...')
    console.log(`Queue URL: ${SQS_QUEUE_URL}`)
    console.log(`Region: ${AWS_REGION}`)
    console.log(`Max concurrent messages: ${MAX_MESSAGES}`)

    // Continuous polling loop
    while (true) {
        await pollMessages()
    }
}
