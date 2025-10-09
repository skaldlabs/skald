# Memo Processing Server

A Node.js TypeScript server that listens to Redis pub/sub messages.

## Setup

Install dependencies:
```bash
npm install
# or
pnpm install
```

## Running

### Development (with hot reload)
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## Environment Variables

- `REDIS_HOST` - Redis server host (default: localhost)
- `REDIS_PORT` - Redis server port (default: 6379)
- `CHANNEL_NAME` - Redis pub/sub channel name (default: memo-processing)

## Testing

To test the server, publish a message to the Redis channel from another terminal:

```bash
redis-cli PUBLISH memo-processing "test message"
```

The server will log "hello" and the received message.

