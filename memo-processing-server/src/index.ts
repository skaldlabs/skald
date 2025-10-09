import 'dotenv/config';
import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from 'redis';
import { exampleUsage } from './agents/examples/keywordExtractorExample';
import { processMemo } from './processMemo';

// Load environment variables from the main repo's .env file
config({ path: resolve(__dirname, '../../.env') });

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');
const CHANNEL_NAME = process.env.CHANNEL_NAME || 'process_memo';


async function main() {
  // Create Redis subscriber client
  const subscriber = createClient({
    socket: {
      host: REDIS_HOST,
      port: REDIS_PORT,
    },
  });

  // Error handling
  subscriber.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  // Connect to Redis
  await subscriber.connect();
  console.log(`Connected to Redis at ${REDIS_HOST}:${REDIS_PORT}`);

  // Subscribe to channel
  await subscriber.subscribe(CHANNEL_NAME, (message) => {
    processMemo(JSON.parse(message).memo_uuid)
    console.log('Received message:', message);
  });

  console.log(`Subscribed to channel: ${CHANNEL_NAME}`);
  console.log('Waiting for messages...');
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

// Start the server
main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

