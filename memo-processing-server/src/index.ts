import './sentry'
import 'dotenv/config'
import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from 'redis'
import { processMemo } from './processMemo'
import { runSQSConsumer } from './sqsConsumer'

// Load environment variables from the main repo's .env file
if (process.env.NODE_ENV === 'development') {
    config({ path: resolve(__dirname, '../../.env') })
} else {
    config({ path: resolve(__dirname, '.env') })
}

const USE_SQS = process.env.USE_SQS === 'true' || process.env.NODE_ENV === 'production'

const REDIS_HOST = process.env.REDIS_HOST || 'localhost'
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379')
const CHANNEL_NAME = process.env.CHANNEL_NAME || 'process_memo'

// SQS configuration
const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL
const AWS_REGION = process.env.AWS_REGION || 'us-east-2'

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
    if (!USE_SQS) {
        console.log('Running in development mode with Redis pub/sub')
        await runRedisPubSub()
    } else {
        if (!SQS_QUEUE_URL || !AWS_REGION) {
            throw new Error('SQS_QUEUE_URL and AWS_REGION environment variables are required')
        }

        console.log('Running in production mode with SQS')
        await runSQSConsumer()
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...')
    process.exit(0)
})

// Start the server
main().catch((err) => {
    console.error('Failed to start server:', err)
    process.exit(1)
})
