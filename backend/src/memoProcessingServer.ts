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
import { runPgmqConsumer } from '@/memoProcessingServer/pgmqConsumer'
import { MikroORM } from '@mikro-orm/core'
import config from '@/mikro-orm.config'
import { logger } from '@/lib/logger'

const runRedisPubSub = async (orm: MikroORM) => {
    const subscriber = createClient({
        socket: {
            host: REDIS_HOST,
            port: REDIS_PORT,
        },
    })

    await subscriber.connect()
    logger.info({ redisHost: REDIS_HOST, redisPort: REDIS_PORT }, 'Connected to Redis')

    await subscriber.subscribe(CHANNEL_NAME, async (message) => {
        const em = orm.em.fork()
        await processMemo(em, JSON.parse(message).memo_uuid)
        logger.debug({ message }, 'Received message')
    })

    logger.info({ channelName: CHANNEL_NAME }, 'Subscribed to channel')
    logger.info('Waiting for messages...')
}

export const startMemoProcessingServer = async () => {
    const orm = await MikroORM.init(config)

    logger.info({ queue: INTER_PROCESS_QUEUE }, 'Starting memo processing server')
    logger.info({ llmProvider: LLM_PROVIDER }, 'LLM provider configured')
    logger.info({ embeddingProvider: EMBEDDING_PROVIDER }, 'Embedding provider configured')

    switch (INTER_PROCESS_QUEUE) {
        case 'redis':
            logger.info('Running with Redis pub/sub')
            await runRedisPubSub(orm)
            break

        case 'sqs': {
            if (!SQS_QUEUE_URL) {
                throw new Error('SQS_QUEUE_URL environment variable is required for SQS mode')
            }
            logger.info('Running with SQS')
            await runSQSConsumer(orm)
            break
        }

        case 'rabbitmq':
            logger.info('Running with RabbitMQ')
            await runRabbitMQConsumer(orm)
            break

        case 'pgmq':
            logger.info('Running with PGMQ')
            await runPgmqConsumer(orm)
            break

        default:
            throw new Error(`Invalid INTER_PROCESS_QUEUE value: ${INTER_PROCESS_QUEUE}`)
    }

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        logger.info('Shutting down gracefully...')
        if (INTER_PROCESS_QUEUE === 'rabbitmq') {
            await closeRabbitMQ()
        }
        process.exit(0)
    })

    process.on('SIGTERM', async () => {
        logger.info('Received SIGTERM, shutting down gracefully...')
        if (INTER_PROCESS_QUEUE === 'rabbitmq') {
            await closeRabbitMQ()
        }
        process.exit(0)
    })
}
