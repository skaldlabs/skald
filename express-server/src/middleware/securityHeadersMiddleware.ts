import helmet from 'helmet'
import { NODE_ENV } from '../settings'

// SECURITY: Security headers middleware using Helmet
// Protects against common web vulnerabilities

export const securityHeaders = helmet({
    // HSTS: Force HTTPS connections
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
    },

    // Prevent clickjacking
    frameguard: {
        action: 'deny',
    },

    // Prevent MIME type sniffing
    noSniff: true,

    // XSS protection (legacy browsers)
    xssFilter: true,

    // Hide X-Powered-By header
    hidePoweredBy: true,

    // Content Security Policy
    contentSecurityPolicy: NODE_ENV === 'production' ? {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    } : false, // Disable CSP in development to avoid issues

    // Referrer Policy
    referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
    },
})
