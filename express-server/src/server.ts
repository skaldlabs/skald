// this needs to come first
import './settings'

import 'dotenv/config'
import express from 'express'
import { RequestContext } from '@mikro-orm/postgresql'
import { userMiddleware } from './middleware/userMiddleware'
import { chat } from './api/chat'
import { requireAuth, requireProjectAccess } from './middleware/authMiddleware'
import { projectMiddleware } from './middleware/projectMiddleware'
import { initDI } from './di'
import { Request, Response } from 'express'

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
    app.use(projectMiddleware())

    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok', checks: { database: true } })
    })

    app.get('/', (req, res) => {
        console.log(req.context?.requestUser)
        res.json({ message: 'Welcome to Skald Express Server' })
    })

    const privateRoutes = express.Router({ mergeParams: true })
    privateRoutes.use(requireAuth())
    privateRoutes.post('/v1/chat', [requireProjectAccess()], chat)

    app.use('/api', privateRoutes)
    app.use(route404)

    DI.server = app.listen(PORT, () => {
        console.log(`MikroORM express TS example started at http://localhost:${PORT}`)
    })
})()
