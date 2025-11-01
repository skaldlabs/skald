import helmet from 'helmet'
import { IS_SELF_HOSTED_DEPLOY } from '@/settings'

// SECURITY: Security headers middleware using Helmet
// Protects against common web vulnerabilities

export const securityHeadersMiddleware = helmet({
    // HSTS: Force HTTPS connections
    // Disabled for self-hosted deployments where Traefik handles SSL termination
    hsts: IS_SELF_HOSTED_DEPLOY
        ? false
        : {
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
    contentSecurityPolicy: {
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
    },

    // Referrer Policy
    referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
    },
})
