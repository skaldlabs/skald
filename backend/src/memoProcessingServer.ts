import {
    INTER_PROCESS_QUEUE,
    REDIS_HOST,
    REDIS_PORT,
    CHANNEL_NAME,
    LLM_PROVIDER,
    EMBEDDING_PROVIDER,
    SQS_QUEUE_URL,
} from '@/settings'
import '@/sentry'
import { createClient } from 'redis'
import { processMemo } from '@/memoProcessingServer/processMemo'
import { runSQSConsumer } from '@/memoProcessingServer/sqsConsumer'
import { runRabbitMQConsumer, closeRabbitMQ } from '@/memoProcessingServer/rabbitMqConsumer'
import { MikroORM } from '@mikro-orm/core'
import config from '@/mikro-orm.config'

const runRedisPubSub = async (orm: MikroORM) => {
    const subscriber = createClient({
        socket: {
            host: REDIS_HOST,
            port: REDIS_PORT,
        },
    })

    await subscriber.connect()
    console.log(`Connected to Redis at ${REDIS_HOST}:${REDIS_PORT}`)

    await subscriber.subscribe(CHANNEL_NAME, async (message) => {
        const em = orm.em.fork()
        await processMemo(em, JSON.parse(message).memo_uuid)
        console.log('Received message:', message)
    })

    console.log(`Subscribed to channel: ${CHANNEL_NAME}`)
    console.log('Waiting for messages...')
}

export const startMemoProcessingServer = async () => {
    const orm = await MikroORM.init(config)

    console.log(`Starting memo processing server with ${INTER_PROCESS_QUEUE} queue`)
    console.log(`LLM provider: ${LLM_PROVIDER}`)
    console.log(`Embedding provider: ${EMBEDDING_PROVIDER}`)

    switch (INTER_PROCESS_QUEUE) {
        case 'redis':
            console.log('Running with Redis pub/sub')
            await runRedisPubSub(orm)
            break

        case 'sqs': {
            if (!SQS_QUEUE_URL) {
                throw new Error('SQS_QUEUE_URL environment variable is required for SQS mode')
            }
            console.log('Running with SQS')
            await runSQSConsumer(orm)
            break
        }

        case 'rabbitmq':
            console.log('Running with RabbitMQ')
            await runRabbitMQConsumer(orm)
            break

        default:
            throw new Error(`Invalid INTER_PROCESS_QUEUE value: ${INTER_PROCESS_QUEUE}`)
    }

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\nShutting down gracefully...')
        if (INTER_PROCESS_QUEUE === 'rabbitmq') {
            await closeRabbitMQ()
        }
        process.exit(0)
    })

    process.on('SIGTERM', async () => {
        console.log('\nReceived SIGTERM, shutting down gracefully...')
        if (INTER_PROCESS_QUEUE === 'rabbitmq') {
            await closeRabbitMQ()
        }
        process.exit(0)
    })
}
