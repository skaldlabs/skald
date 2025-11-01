import { Response } from 'express'
import { ZodError } from 'zod'
import { DEBUG } from '../settings'

interface ErrorResponse {
    error: string
    details?: unknown
    stack?: string
    code?: string
}

// Custom error types for better categorization
export class ValidationError extends Error {
    constructor(
        message: string,
        public details?: unknown
    ) {
        super(message)
        this.name = 'ValidationError'
    }
}

export class AuthenticationError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'AuthenticationError'
    }
}

export class AuthorizationError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'AuthorizationError'
    }
}

/**
 * Sanitizes errors based on environment to prevent information disclosure.
 * In production, returns generic error messages.
 * In development, returns detailed error information.
 * Always logs full error details server-side regardless of environment.
 */
export function sanitizeError(error: unknown, isDevelopment: boolean = DEBUG): ErrorResponse {
    // Always log full error details server-side for debugging
    console.error('Error occurred:', error)

    if (isDevelopment) {
        // Return detailed errors in development
        if (error instanceof ZodError) {
            return {
                error: 'Invalid request data',
                details: error.issues,
            }
        }

        if (error instanceof Error) {
            return {
                error: error.message,
                stack: error.stack,
            }
        }

        return {
            error: String(error),
        }
    }

    // Return generic errors in production to prevent information disclosure
    if (error instanceof ZodError || error instanceof ValidationError) {
        return { error: 'Invalid request data' }
    }

    if (error instanceof AuthenticationError) {
        return { error: 'Authentication failed' }
    }

    if (error instanceof AuthorizationError) {
        return { error: 'Access denied' }
    }

    // Generic error for all other cases
    return { error: 'An unexpected error occurred' }
}

/**
 * Determine appropriate HTTP status code based on error type
 */
export function determineStatusCode(error: unknown): number {
    if (error instanceof ZodError || error instanceof ValidationError) {
        return 400
    }

    if (error instanceof AuthenticationError) {
        return 401
    }

    if (error instanceof AuthorizationError) {
        return 403
    }

    return 500
}

/**
 * Helper to send sanitized error response
 */
export function sendErrorResponse(res: Response, error: unknown, statusCode?: number) {
    const sanitized = sanitizeError(error, DEBUG)
    const code = statusCode || determineStatusCode(error)

    res.status(code).json(sanitized)
}
