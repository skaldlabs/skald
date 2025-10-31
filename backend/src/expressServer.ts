import express from 'express'
import cors from 'cors'
import { RequestContext } from '@mikro-orm/postgresql'
import { userMiddleware } from '@/middleware/userMiddleware'
import { chat } from '@/api/chat'
import { health } from '@/api/health'
import { requireAuth, requireProjectAccess } from '@/middleware/authMiddleware'
import { initDI } from '@/di'
import { Request, Response } from 'express'
import { search } from '@/api/search'
import { organizationRouter } from '@/api/organization'
import { projectRouter } from '@/api/project'
import { userRouter } from '@/api/user'
import cookieParser from 'cookie-parser'
import { CORS_ALLOWED_ORIGINS, CORS_ALLOW_CREDENTIALS, ENABLE_SECURITY_SETTINGS, EXPRESS_SERVER_PORT } from '@/settings'
import { emailVerificationRouter } from '@/api/emailVerification'
import { memoRouter } from '@/api/memo'
import { subscriptionRouter } from '@/api/subscription'
import { planRouter } from '@/api/plan'
import { stripeWebhook } from '@/api/stripe_webhook'
import { securityHeadersMiddleware } from '@/middleware/securityMiddleware'
import { authRateLimiter, chatRateLimiter, generalRateLimiter } from '@/middleware/rateLimitMiddleware'

export const startExpressServer = async () => {
    // DI stands for Dependency Injection. the naming/acronym is a bit confusing, but we're using it
    // because it's the established patter used by mikro-orm, and we want to be able to easily find information
    // about our setup online. see e.g. https://github.com/mikro-orm/express-ts-example-app/blob/master/app/server.ts
    const DI = await initDI()

    const app = express()

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
    privateRoutesRouter.post('/v1/chat', [chatRateLimiter, requireProjectAccess()], chat)
    privateRoutesRouter.post('/v1/search', [requireProjectAccess()], search)
    privateRoutesRouter.use('/organizations', organizationRouter)
    organizationRouter.use('/:organization_uuid/projects', projectRouter)
    organizationRouter.use('/:organization_uuid/subscription', subscriptionRouter)
    privateRoutesRouter.use('/plans', planRouter)

    app.use('/api', privateRoutesRouter)
    app.use(route404)

    DI.server = app.listen(EXPRESS_SERVER_PORT, () => {
        console.log(`MikroORM express TS example started at http://localhost:${EXPRESS_SERVER_PORT}`)
    })
}
