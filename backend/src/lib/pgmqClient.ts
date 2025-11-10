import { Pgmq } from 'pgmq-js'
import { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } from '@/settings'
import { logger } from '@/lib/logger'

let pgmqClient: Pgmq | null = null

export const initPgmqClient = async (): Promise<Pgmq> => {
    if (pgmqClient) {
        return pgmqClient
    }

    pgmqClient = await Pgmq.new({
        host: DB_HOST,
        port: DB_PORT,
        database: DB_NAME,
        user: DB_USER,
        password: DB_PASSWORD,
        ssl: false,
    })

    logger.info({ dbHost: DB_HOST, dbPort: DB_PORT }, 'Connected to PGMQ')

    return pgmqClient
}

export const getPgmqClient = (): Pgmq => {
    if (!pgmqClient) {
        throw new Error('PGMQ client not initialized. Call initPgmqClient first.')
    }
    return pgmqClient
}

export const sendMessage = async (queueName: string, message: string): Promise<string> => {
    const client = await initPgmqClient()
    const msgId = await client.msg.send(queueName, JSON.parse(message))
    return msgId.toString()
}

export const receiveMessages = async (queueName: string, visibilityTimeout: number = 60, limit: number = 10) => {
    const client = await initPgmqClient()
    const messages = await client.msg.readBatch(queueName, visibilityTimeout, limit)
    return messages
}

export const deleteMessage = async (queueName: string, msgId: string): Promise<boolean> => {
    const client = await initPgmqClient()
    return await client.msg.delete(queueName, parseInt(msgId))
}

export const archiveMessage = async (queueName: string, msgId: string): Promise<boolean> => {
    const client = await initPgmqClient()
    return await client.msg.archive(queueName, parseInt(msgId))
}

export const createQueue = async (queueName: string): Promise<void> => {
    const client = await initPgmqClient()
    await client.queue.create(queueName)
    logger.info({ queueName }, 'Created PGMQ queue')
}
