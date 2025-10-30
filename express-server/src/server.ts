// this needs to come first
import './settings'

import 'dotenv/config'
import express from 'express'
import { RequestContext } from '@mikro-orm/postgresql'
import { userMiddleware } from './middleware/userMiddleware'
import { chat } from './api/chat'
import { health } from './api/health'
import { requireAuth, requireProjectAccess } from './middleware/authMiddleware'
import { initDI } from './di'
import { Request, Response } from 'express'
import { search } from './api/search'
import { organizationRouter } from './api/organization'

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

    app.use(express.json())
    app.use((req, res, next) => RequestContext.create(DI.orm.em, next))
    app.use(userMiddleware())

    app.get('/api/health', health)

    app.get('/', (req, res) => {
        console.log(req.context?.requestUser)
        res.json({ message: 'Welcome to Skald Express Server' })
    })

    // Routers
    const privateRoutesRouter = express.Router({ mergeParams: true })

    privateRoutesRouter.use(requireAuth())
    privateRoutesRouter.post('/v1/chat', [requireProjectAccess()], chat)
    privateRoutesRouter.post('/v1/search', [requireProjectAccess()], search)
    privateRoutesRouter.use('/organization', organizationRouter)

    app.use('/api', privateRoutesRouter)
    app.use(route404)

    DI.server = app.listen(PORT, () => {
        console.log(`MikroORM express TS example started at http://localhost:${PORT}`)
    })
})()
