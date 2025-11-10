import {
    INTER_PROCESS_QUEUE,
    LLM_PROVIDER,
    EMBEDDING_PROVIDER,
    SQS_QUEUE_URL,
} from '@/settings'
import '@/sentry'
import { runSQSConsumer } from '@/memoProcessingServer/sqsConsumer'
import { runPgmqConsumer } from '@/memoProcessingServer/pgmqConsumer'
import { MikroORM } from '@mikro-orm/core'
import config from '@/mikro-orm.config'
import { logger } from '@/lib/logger'

export const startMemoProcessingServer = async () => {
    const orm = await MikroORM.init(config)

    logger.info({ queue: INTER_PROCESS_QUEUE }, 'Starting memo processing server')
    logger.info({ llmProvider: LLM_PROVIDER }, 'LLM provider configured')
    logger.info({ embeddingProvider: EMBEDDING_PROVIDER }, 'Embedding provider configured')

    switch (INTER_PROCESS_QUEUE) {
        case 'sqs': {
            if (!SQS_QUEUE_URL) {
                throw new Error('SQS_QUEUE_URL environment variable is required for SQS mode')
            }
            logger.info('Running with SQS')
            await runSQSConsumer(orm)
            break
        }

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
        process.exit(0)
    })

    process.on('SIGTERM', async () => {
        logger.info('Received SIGTERM, shutting down gracefully...')
        process.exit(0)
    })
}
