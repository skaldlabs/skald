import './sentry'
import 'dotenv/config'
import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from 'redis'
import { processMemo } from './processMemo'
import { runSQSConsumer } from './sqsConsumer'
import { runRabbitMQConsumer, closeRabbitMQ } from './rabbitmqConsumer'

// Load environment variables from the main repo's .env file
if (process.env.NODE_ENV === 'development') {
    config({ path: resolve(__dirname, '../../.env') })
} else {
    config({ path: resolve(__dirname, '.env') })
}

// Determine which queue to use
const USE_SQS = process.env.USE_SQS === 'true' // legacy support
const INTER_PROCESS_QUEUE = USE_SQS
    ? 'sqs'
    : process.env.INTER_PROCESS_QUEUE || (process.env.NODE_ENV === 'production' ? 'sqs' : 'redis')

const REDIS_HOST = process.env.REDIS_HOST || 'localhost'
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379')
const CHANNEL_NAME = process.env.CHANNEL_NAME || 'process_memo'

const runRedisPubSub = async () => {
    const subscriber = createClient({
        socket: {
            host: REDIS_HOST,
            port: REDIS_PORT,
        },
    })

    await subscriber.connect()
    console.log(`Connected to Redis at ${REDIS_HOST}:${REDIS_PORT}`)

    await subscriber.subscribe(CHANNEL_NAME, (message) => {
        processMemo(JSON.parse(message).memo_uuid)
        console.log('Received message:', message)
    })

    console.log(`Subscribed to channel: ${CHANNEL_NAME}`)
    console.log('Waiting for messages...')
}

async function main() {
    console.log(`Starting memo processing server with ${INTER_PROCESS_QUEUE} queue`)

    switch (INTER_PROCESS_QUEUE) {
        case 'redis':
            console.log('Running with Redis pub/sub')
            await runRedisPubSub()
            break

        case 'sqs': {
            const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL
            if (!SQS_QUEUE_URL) {
                throw new Error('SQS_QUEUE_URL environment variable is required for SQS mode')
            }
            console.log('Running with SQS')
            await runSQSConsumer()
            break
        }

        case 'rabbitmq':
            console.log('Running with RabbitMQ')
            await runRabbitMQConsumer()
            break

        default:
            throw new Error(`Invalid INTER_PROCESS_QUEUE value: ${INTER_PROCESS_QUEUE}`)
    }
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

// Start the server
main().catch((err) => {
    console.error('Failed to start server:', err)
    process.exit(1)
})
