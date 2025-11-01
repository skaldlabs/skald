import pino from 'pino'
import { pinoHttp } from 'pino-http'
import { randomUUID } from 'crypto'
import { DEBUG, NODE_ENV } from '@/settings'

/**
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

/**
 * Create the base Pino logger instance
 */
export const logger = pino({
    level: DEBUG ? 'debug' : 'info',
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
    // Transport configuration for pretty printing in development
    transport:
        DEBUG || NODE_ENV === 'development'
            ? {
                  target: 'pino-pretty',
                  options: {
                      colorize: true,
                      translateTime: 'HH:MM:ss Z',
                      ignore: 'pid,hostname',
                      singleLine: false,
                  },
              }
            : undefined,
})

/**
 * Create a child logger with additional context
 */
export const createLogger = (context: Record<string, any>) => {
    return logger.child(context)
}

/**
 * HTTP logger middleware for Express
 */
export const httpLogger = pinoHttp({
    logger,
    genReqId: (req) => (req.headers['x-request-id'] as string) || randomUUID(),
    customLogLevel: (req, res, err) => {
        if (res.statusCode >= 500 || err) return 'error'
        if (res.statusCode >= 400) return 'warn'
        if (res.statusCode >= 300) return 'info'
        return 'info'
    },
    customSuccessMessage: (req, res) => {
        return `${req.method} ${req.url} ${res.statusCode}`
    },
    customErrorMessage: (req, res, err) => {
        return `${req.method} ${req.url} ${res.statusCode} - ${err?.message}`
    },
})

/**
 * Log levels:
 * - trace: Very detailed application flow
 * - debug: Debug information
 * - info: General informational messages
 * - warn: Warning messages
 * - error: Error messages
 * - fatal: Fatal errors that cause application shutdown
 */
