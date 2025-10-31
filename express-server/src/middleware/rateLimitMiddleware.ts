import rateLimit from 'express-rate-limit'
import { NODE_ENV } from '../settings'

// SECURITY: Rate limiting to prevent brute-force attacks
// More strict limits for authentication endpoints

export const generalRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: NODE_ENV === 'production' ? 100 : 1000, // Limit each IP to 100 requests per windowMs in production
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    skip: (req) => NODE_ENV === 'development', // Skip rate limiting in development
})

export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: NODE_ENV === 'production' ? 5 : 100, // Limit each IP to 5 login attempts per windowMs in production
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
    skip: (req) => NODE_ENV === 'development',
})

export const apiKeyGenerationRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: NODE_ENV === 'production' ? 10 : 100, // Limit API key generation to 10 per hour in production
    message: 'Too many API key generation requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => NODE_ENV === 'development',
})
