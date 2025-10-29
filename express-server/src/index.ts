import 'dotenv/config'
import express from 'express'
import http from 'http'
import { EntityManager, EntityRepository, MikroORM, RequestContext } from '@mikro-orm/postgresql'
import config from './mikro-orm.config'
import { userMiddleware } from './middleware/userMiddleware'
import { Memo } from './entities/Memo'
import { User } from './entities/User'
import { AuthToken } from './entities/AuthToken'
import { chat } from './api/chat'

export const DI = {} as {
    server: http.Server
    orm: MikroORM
    em: EntityManager
    memos: EntityRepository<Memo>
    users: EntityRepository<User>
    authTokens: EntityRepository<AuthToken>
}

const app = express()

const PORT = process.env.PORT || 3000

export const init = (async () => {
    DI.orm = await MikroORM.init(config)
    DI.em = DI.orm.em
    DI.memos = DI.orm.em.getRepository(Memo)
    DI.users = DI.orm.em.getRepository(User)
    DI.authTokens = DI.orm.em.getRepository(AuthToken)

    app.use(express.json())
    app.use(userMiddleware())
    app.use((req, res, next) => RequestContext.create(DI.orm.em, next))
    app.get('/', (req, res) => {
        console.log(req.context?.user)
        res.json({ message: 'Welcome to Skald Express Server' })
    })

    app.post('/api/v1/chat', chat)

    app.use((req, res) => res.status(404).json({ message: 'No route found' }))

    DI.server = app.listen(PORT, () => {
        console.log(`MikroORM express TS example started at http://localhost:${PORT}`)
    })
})()
