import pino from 'pino'
import { IS_DEVELOPMENT, LOG_LEVEL } from '@/settings'

/*
 * Serializers to redact sensitive information from logs
 */
const serializers = {
    req: (req: any) => ({
        id: req.id,
        method: req.method,
        url: req.url,
        // Redact sensitive headers
        headers: {
            ...req.headers,
            authorization: req.headers?.authorization ? '[REDACTED]' : undefined,
            cookie: req.headers?.cookie ? '[REDACTED]' : undefined,
        },
        remoteAddress: req.remoteAddress,
        remotePort: req.remotePort,
    }),
    res: (res: any) => ({
        statusCode: res.statusCode,
        headers: res.headers,
    }),
    err: pino.stdSerializers.err,
}

/**
 * Redact sensitive fields from any object
 */
const redactPaths = [
    'password',
    'token',
    'apiKey',
    'api_key',
    'secret',
    'authorization',
    'cookie',
    'session',
    'accessToken',
    'refreshToken',
    'stripe_key',
    'stripe_secret',
]

const consoleLogger = {
    info: (...args: unknown[]) => {
        console.log(...args)
    },
    error: (...args: unknown[]) => {
        console.error(...args)
    },
    warn: (...args: unknown[]) => {
        console.warn(...args)
    },
    debug: (...args: unknown[]) => {
        console.debug(...args)
    },
    trace: (...args: unknown[]) => {
        console.trace(...args)
    },
    fatal: (...args: unknown[]) => {
        console.error(...args)
    },
}

/**
 * Create the base Pino logger instance
 */
export const logger = IS_DEVELOPMENT
    ? consoleLogger
    : pino({
          level: LOG_LEVEL,
          serializers,
          redact: {
              paths: redactPaths,
              censor: '[REDACTED]',
          },
          formatters: {
              level: (label) => {
                  return { level: label }
              },
          },
          timestamp: pino.stdTimeFunctions.isoTime,
      })
