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
    console.log(`Connected to RabbitMQ at ${RABBITMQ_HOST}:${RABBITMQ_PORT}`)

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

    console.log(`Queue "${RABBITMQ_QUEUE_NAME}" is ready`)

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
        console.log(`Processing memo: ${data.memo_uuid}`)

        await processMemo(em, data.memo_uuid)

        // Acknowledge the message after successful processing
        if (channel) {
            channel.ack(msg)
            console.log(`Successfully processed and acknowledged memo: ${data.memo_uuid}`)
        }
    } catch (error) {
        console.error('Error processing message:', error)

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

    console.log(`Waiting for messages in queue "${RABBITMQ_QUEUE_NAME}"...`)

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
            console.error('RabbitMQ connection error:', err)
            process.exit(1)
        })

        connection.on('close', () => {
            console.log('RabbitMQ connection closed')
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
        console.log('RabbitMQ connection closed gracefully')
    } catch (error) {
        console.error('Error closing RabbitMQ connection:', error)
    }
}
