import * as amqplib from 'amqplib'
import { processMemo } from '@/memoProcessingServer/processMemo'
import {
    RABBITMQ_HOST,
    RABBITMQ_PORT,
    RABBITMQ_USER,
    RABBITMQ_PASSWORD,
    RABBITMQ_VHOST,
    RABBITMQ_QUEUE_NAME,
} from '../settings'
import { EntityManager, MikroORM } from '@mikro-orm/core'
import { logger } from '@/lib/logger'

interface MemoMessage {
    memo_uuid: string
}

let connection: any = null
let channel: any = null

/**
 * Initialize RabbitMQ connection and channel
 */
async function initRabbitMQ(): Promise<void> {
    const url = `amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@${RABBITMQ_HOST}:${RABBITMQ_PORT}${RABBITMQ_VHOST}`

    connection = await amqplib.connect(url)
    logger.info({ rabbitMqHost: RABBITMQ_HOST, rabbitMqPort: RABBITMQ_PORT }, 'Connected to RabbitMQ')

    if (!connection) {
        throw new Error('Failed to create RabbitMQ connection')
    }

    channel = await connection.createChannel()

    if (!channel) {
        throw new Error('Failed to create RabbitMQ channel')
    }

    // Declare queue (idempotent operation)
    await channel.assertQueue(RABBITMQ_QUEUE_NAME, {
        durable: true,
    })

    logger.info({ queueName: RABBITMQ_QUEUE_NAME }, 'Queue is ready')

    // Set prefetch to process one message at a time
    await channel.prefetch(1)
}

/**
 * Process a single RabbitMQ message
 */
async function processMessage(em: EntityManager, msg: amqplib.ConsumeMessage): Promise<void> {
    const content = msg.content.toString()

    try {
        const data: MemoMessage = JSON.parse(content)
        logger.info({ memoUuid: data.memo_uuid }, 'Processing memo')

        await processMemo(em, data.memo_uuid)

        // Acknowledge the message after successful processing
        if (channel) {
            channel.ack(msg)
            logger.info({ memoUuid: data.memo_uuid }, 'Successfully processed and acknowledged memo')
        }
    } catch (error) {
        logger.error({ err: error }, 'Error processing message')

        // Reject the message and requeue it
        if (channel) {
            channel.nack(msg, false, true)
        }
    }
}

/**
 * Start consuming messages from RabbitMQ
 */
export async function runRabbitMQConsumer(orm: MikroORM): Promise<void> {
    await initRabbitMQ()

    if (!channel) {
        throw new Error('Channel not initialized')
    }

    logger.info({ queueName: RABBITMQ_QUEUE_NAME }, 'Waiting for messages in queue')

    // Start consuming messages
    await channel.consume(
        RABBITMQ_QUEUE_NAME,
        async (msg: amqplib.ConsumeMessage | null) => {
            if (msg) {
                const em = orm.em.fork()
                await processMessage(em, msg)
            }
        },
        {
            noAck: false, // Manual acknowledgment
        }
    )

    // Handle connection errors
    if (connection) {
        connection.on('error', (err: Error) => {
            logger.error({ err }, 'RabbitMQ connection error')
            process.exit(1)
        })

        connection.on('close', () => {
            logger.info('RabbitMQ connection closed')
            process.exit(1)
        })
    }
}

/**
 * Gracefully close RabbitMQ connection
 */
export async function closeRabbitMQ(): Promise<void> {
    try {
        if (channel) {
            await channel.close()
        }
        if (connection) {
            await connection.close()
        }
        logger.info('RabbitMQ connection closed gracefully')
    } catch (error) {
        logger.error({ err: error }, 'Error closing RabbitMQ connection')
    }
}
