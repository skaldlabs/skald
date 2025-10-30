// this needs to come first
import './settings'

import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { RequestContext } from '@mikro-orm/postgresql'
import { userMiddleware } from './middleware/userMiddleware'
import { chat } from './api/chat'
import { health } from './api/health'
import { requireAuth, requireProjectAccess } from './middleware/authMiddleware'
import { initDI } from './di'
import { Request, Response } from 'express'
import { search } from './api/search'
import { organization } from './api/organization'
import { userRouter } from './api/user'
import cookieParser from 'cookie-parser'
import { CORS_ALLOWED_ORIGINS, CORS_ALLOW_CREDENTIALS } from './settings'
import { emailVerificationRouter } from './api/emailVerification'

const app = express()

const PORT = process.env.PORT || 3000

const route404 = (req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' })
}

export const init = (async () => {
    // DI stands for Dependency Injection. the naming/acronym is a bit confusing, but we're using it
    // because it's the established patter used by mikro-orm, and we want to be able to easily find information
    // about our setup online. see e.g. https://github.com/mikro-orm/express-ts-example-app/blob/master/app/server.ts
    const DI = await initDI()

    // CORS middleware - must come first
    app.use(
        cors({
            origin: CORS_ALLOWED_ORIGINS,
            credentials: CORS_ALLOW_CREDENTIALS,
        })
    )

    app.use(express.json())
    app.use(cookieParser())
    app.use((req, res, next) => RequestContext.create(DI.orm.em, next))
    app.use(userMiddleware())

    // Routers
    const privateRoutesRouter = express.Router({ mergeParams: true })
    const organizationRoutesRouter = express.Router({ mergeParams: true })
    privateRoutesRouter.use(requireAuth())

    app.get('/api/health', health)
    app.use('/api/user', userRouter)
    app.use('/api/email_verification', emailVerificationRouter)
    privateRoutesRouter.post('/v1/chat', [requireProjectAccess()], chat)
    privateRoutesRouter.post('/v1/search', [requireProjectAccess()], search)

    privateRoutesRouter.use('/organization', organizationRoutesRouter)
    organizationRoutesRouter.use('/', organization)
    app.use('/api', privateRoutesRouter)
    app.use(route404)

    DI.server = app.listen(PORT, () => {
        console.log(`MikroORM express TS example started at http://localhost:${PORT}`)
    })
})()
