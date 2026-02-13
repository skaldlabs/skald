import {
    SQSClient,
    ReceiveMessageCommand,
    DeleteMessageCommand,
    Message,
    SendMessageCommand,
    SendMessageCommandOutput,
} from '@aws-sdk/client-sqs'
import { AWS_REGION, SQS_QUEUE_URL } from '@/settings'

const MAX_MESSAGES = 10
const WAIT_TIME_SECONDS = 1
const VISIBILITY_TIMEOUT = 660

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

export const receiveMessages = async () => {
    const _sqsClient = initSQSClient()

    const command = new ReceiveMessageCommand({
        QueueUrl: SQS_QUEUE_URL,
        MaxNumberOfMessages: MAX_MESSAGES,
        WaitTimeSeconds: WAIT_TIME_SECONDS,
        VisibilityTimeout: VISIBILITY_TIMEOUT,
    })
    return await _sqsClient.send(command)
}

export const deleteMessage = async (message: Message) => {
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
