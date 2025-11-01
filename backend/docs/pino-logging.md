# Pino Logging Implementation

## Overview
Production-ready Pino logging has been implemented across the entire backend with structured logging, request tracking, and environment-aware configuration.

## Architecture

### Centralized Logger (`src/lib/logger.ts`)
- Single source of truth for all logging configuration
- Environment-aware setup (development vs production)
- Automatic sensitive data redaction
- Type-safe logging interface
- HTTP request logger middleware export

### Features Implemented

#### 1. Development vs Production Modes
- **Development**: Pretty-printed, colorized logs via `pino-pretty`
- **Production**: Structured JSON logs optimized for log aggregation tools (Datadog, CloudWatch, etc.)

#### 2. Security & Data Protection
Automatic redaction of sensitive fields:
- Passwords, tokens, API keys
- Authorization headers
- Cookies and sessions
- Stripe keys

#### 3. Request ID Tracking
- Automatic request ID generation (UUID)
- Support for incoming `x-request-id` headers
- Request correlation across logs

#### 4. Smart Log Levels
- HTTP requests automatically categorized:
  - 5xx responses → `error`
  - 4xx responses → `warn`
  - 3xx/2xx responses → `info`

#### 5. Structured Logging
All logs use structured format:
```typescript
logger.info({ organizationName: 'Acme', planId: 123 }, 'Subscription created')
// Instead of: console.log('Subscription created for Acme with plan 123')
```

## Usage

### Import the logger
```typescript
import { logger } from '@/lib/logger'
```

### Log levels
```typescript
logger.trace('Very detailed debug info')
logger.debug('Debug information')
logger.info('Informational messages')
logger.warn('Warning messages')
logger.error({ err: error }, 'Error message')
logger.fatal('Fatal errors')
```

### Create child loggers with context
```typescript
import { createLogger } from '@/lib/logger'

const serviceLogger = createLogger({ service: 'subscription' })
serviceLogger.info('Operation completed')
// Output includes: {"service":"subscription","msg":"Operation completed",...}
```

### HTTP Logger Middleware
```typescript
import { httpLogger } from '@/lib/logger'

app.use(httpLogger)
```

## Files Updated

### Core Infrastructure
- `src/lib/logger.ts` - Centralized logger configuration
- `src/expressServer.ts` - HTTP request logging with pino-http
- `src/index.ts` - Application startup logging

### Error Handling
- `src/lib/errorHandler.ts` - Error logging with structured context
- `src/settings.ts` - Bootstrap logger for configuration validation

### API Endpoints
- `src/api/chat.ts`
- `src/api/health.ts`
- `src/api/memo.ts`
- `src/api/organization.ts`
- `src/api/stripe_webhook.ts`
- `src/api/subscription.ts`

### Services
- `src/services/subscriptionService.ts` - Comprehensive Stripe event logging
- `src/services/usageTrackingService.ts` - Usage tracking and alerts

### Middleware
- `src/middleware/usageTracking.ts` - Usage tracking middleware

### Libraries & Utilities
- `src/lib/createMemoUtils.ts` - Memo creation and queue publishing
- `src/lib/usageAlertEmail.ts` - Usage alert email sending

### Memo Processing Server
- `src/memoProcessingServer.ts` - Main processing server
- `src/memoProcessingServer/sqsConsumer.ts` - SQS message consumer
- `src/memoProcessingServer/rabbitMqConsumer.ts` - RabbitMQ message consumer

## Status

✅ **Complete!** All console calls have been replaced with Pino logging across the entire codebase.

## Log Output Examples

### Development Mode
```
[14:30:15 GMT] INFO: Express server started at http://localhost:3000
[14:30:20 GMT] INFO (req-id: abc-123): GET /api/health 200
[14:30:25 GMT] WARN (req-id: def-456): STRIPE_SECRET_KEY not configured
[14:30:30 GMT] INFO: Processing memo (memoUuid: "550e8400-e29b-41d4-a716-446655440000")
```

### Production Mode
```json
{"level":"info","time":"2025-11-01T14:30:15.123Z","msg":"Express server started at http://localhost:3000"}
{"level":"info","time":"2025-11-01T14:30:20.456Z","reqId":"abc-123","req":{"method":"GET","url":"/api/health"},"res":{"statusCode":200},"msg":"GET /api/health 200"}
{"level":"warn","time":"2025-11-01T14:30:25.789Z","msg":"STRIPE_SECRET_KEY not configured"}
{"level":"info","time":"2025-11-01T14:30:30.000Z","memoUuid":"550e8400-e29b-41d4-a716-446655440000","msg":"Processing memo"}
```

## Benefits

1. **Performance**: Pino is one of the fastest Node.js loggers
2. **Production-Ready**: Structured JSON logs work seamlessly with log aggregation tools
3. **Security**: Automatic sensitive data redaction
4. **Debugging**: Request IDs enable tracing requests across the system
5. **Open Source Friendly**: MIT licensed, widely adopted, well-documented
6. **Clean**: Centralized configuration, consistent patterns throughout codebase
7. **Comprehensive**: Zero console calls remaining in production code

## Testing

Run the Express server in development mode to see pretty logs:
```bash
NODE_ENV=development DEBUG=true pnpm run dev:express-server
```

Run the memo processing server in development mode:
```bash
NODE_ENV=development DEBUG=true pnpm run dev:memo-processing-server
```

Run in production mode to see JSON logs:
```bash
NODE_ENV=production pnpm start
```

## Log Levels Guide

- **trace**: Very detailed application flow (rarely used)
- **debug**: Debug information (shown in dev mode with DEBUG=true)
- **info**: General informational messages (default in production)
- **warn**: Warning messages that need attention
- **error**: Error messages with context
- **fatal**: Fatal errors that cause application shutdown
