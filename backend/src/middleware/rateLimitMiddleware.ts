import rateLimit from 'express-rate-limit'
import { ENABLE_SECURITY_SETTINGS } from '@/settings'

// SECURITY: Rate limiting to prevent brute-force attacks
// more strict limits for authentication endpoints
// we will need to be more sophisticated with these soon

export const generalRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 1000, // Limit each IP to 1000 requests per windowMs in production
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    skip: () => !ENABLE_SECURITY_SETTINGS,
})

export const authRateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // Limit each IP to 5 login attempts per windowMs in production
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
    skip: () => !ENABLE_SECURITY_SETTINGS,
})

export const chatRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // Limit each IP to 100 requests per windowMs in production
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => !ENABLE_SECURITY_SETTINGS,
})
