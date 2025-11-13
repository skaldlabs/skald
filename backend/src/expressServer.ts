import express from 'express'
import cors from 'cors'
import { RequestContext } from '@mikro-orm/postgresql'
import { userMiddleware } from '@/middleware/userMiddleware'
import { chatRouter } from '@/api/chat'
import { health } from '@/api/health'
import { requireAuth } from '@/middleware/authMiddleware'
import { initDI } from '@/di'
import { Request, Response, NextFunction } from 'express'
import { search } from '@/api/search'
import { organizationRouter } from '@/api/organization'
import { projectRouter } from '@/api/project'
import { userRouter } from '@/api/user'
import cookieParser from 'cookie-parser'
import {
    CORS_ALLOWED_ORIGINS,
    CORS_ALLOW_CREDENTIALS,
    IS_DEVELOPMENT,
    ENABLE_SECURITY_SETTINGS,
    EXPRESS_SERVER_PORT,
} from '@/settings'
import { emailVerificationRouter } from '@/api/emailVerification'
import { memoRouter } from '@/api/memo'
import { subscriptionRouter } from '@/api/subscription'
import { planRouter } from '@/api/plan'
import { stripeWebhook } from '@/api/stripe_webhook'
import { adminRouter } from '@/api/admin'
import { securityHeadersMiddleware } from '@/middleware/securityMiddleware'
import { authRateLimiter, generalRateLimiter } from '@/middleware/rateLimitMiddleware'
import { requireProjectAccess } from '@/middleware/authMiddleware'
import { logger } from '@/lib/logger'
import { posthog } from '@/lib/posthogUtils'
import * as Sentry from '@sentry/node'

export const startExpressServer = async () => {
    // DI stands for Dependency Injection. the naming/acronym is a bit confusing, but we're using it
    // because it's the established patter used by mikro-orm, and we want to be able to easily find information
    // about our setup online. see e.g. https://github.com/mikro-orm/express-ts-example-app/blob/master/app/server.ts
    const DI = await initDI()

    const app = express()

    // Trust Fly.io proxy for accurate client IP detection in rate limiting
    app.set('trust proxy', true)

    const route404 = (req: Request, res: Response) => {
        res.status(404).json({ error: 'Not found' })
    }

    if (ENABLE_SECURITY_SETTINGS) {
        app.use(securityHeadersMiddleware)
        app.use(generalRateLimiter)
    }

    app.use(
        cors({
            origin: CORS_ALLOWED_ORIGINS,
            credentials: CORS_ALLOW_CREDENTIALS,
        })
    )

    // Stripe webhook needs raw body for signature verification
    // Must come before express.json() middleware
    app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook)

    app.use(express.json())
    app.use(cookieParser())
    app.use((req, res, next) => RequestContext.create(DI.orm.em, next))
    app.use(userMiddleware())

    // Routers
    const privateRoutesRouter = express.Router({ mergeParams: true })

    privateRoutesRouter.use(requireAuth())

    app.get('/api/health', health)
    app.use('/api/user', authRateLimiter, userRouter)
    privateRoutesRouter.use('/email_verification', emailVerificationRouter)
    privateRoutesRouter.use('/v1/memo', [requireProjectAccess()], memoRouter)
    privateRoutesRouter.use('/v1/chat', [requireProjectAccess()], chatRouter)
    privateRoutesRouter.post('/v1/search', [requireProjectAccess()], search)
    privateRoutesRouter.use('/organizations', organizationRouter)
    organizationRouter.use('/:organization_uuid/projects', projectRouter)
    organizationRouter.use('/:organization_uuid/subscription', subscriptionRouter)
    privateRoutesRouter.use('/plans', planRouter)
    privateRoutesRouter.use('/admin', adminRouter)

    app.use('/api', privateRoutesRouter)

    app.use(route404)

    // the error handler must be registered before any other error middleware and after all controllers
    Sentry.setupExpressErrorHandler(app)

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    app.use(function onError(err: any, req: Request, res: Response, next: NextFunction) {
        if (IS_DEVELOPMENT) {
            logger.error({ err })
            return res.status(500).json({ error: String(err) })
        }

        res.statusCode = 503
        // res.sentry is the sentry error id and the client can use this when reporting the error to support.
        res.json({ error: 'Service unavailable', sentry_error_id: res.sentry })
    })

    const HOST = '0.0.0.0'
    DI.server = app.listen(EXPRESS_SERVER_PORT, HOST, async (err) => {
        if (err) {
            logger.error({ error: err }, `Could not start Express server on http://${HOST}:${EXPRESS_SERVER_PORT}`)
            await gracefulShutdown('listen-error', 1)
            return
        }

        logger.info(`Express server started at http://${HOST}:${EXPRESS_SERVER_PORT}`)
    })

    const closeServer = (): Promise<void> =>
        new Promise((resolve, reject) => {
            DI.server.close((err) => (err ? reject(err) : resolve()))
        })

    const gracefulShutdown = async (signal: string, exitCode = 0) => {
        logger.info(`${signal} received, starting graceful shutdown...`)

        const timer = setTimeout(() => {
            logger.error('Forced shutdown after timeout')
            process.exit(1)
        }, 30000).unref()

        try {
            if (DI.server.listening) {
                await closeServer()
                // drop any idle keep alive connections immediately on Node >=18 <19
                DI.server.closeIdleConnections()
                logger.info('HTTP server closed')
            } else {
                logger.info('HTTP server was not listening; skipping server.close()')
            }

            try {
                await posthog.shutdown()
                logger.info('PostHog client shut down')
            } catch (error) {
                logger.error({ error }, 'Error shutting down PostHog')
            }

            try {
                await DI.orm.close()
                logger.info('Database connection closed')
            } catch (error) {
                logger.error({ error }, 'Error closing database connection')
            }

            clearTimeout(timer)
            logger.info('Graceful shutdown complete')
            process.exit(exitCode)
        } catch (error) {
            logger.error({ error }, 'Error during graceful shutdown')
            clearTimeout(timer)
            process.exit(1)
        }
    }

    process.once('SIGTERM', () => gracefulShutdown('SIGTERM'))
    process.once('SIGINT', () => gracefulShutdown('SIGINT'))
}
