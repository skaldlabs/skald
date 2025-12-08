import { Router, Request, Response } from 'express'
import { startExpressServer } from '@mit/expressServer'
import { chatUiConfigRouter } from './chatUiConfig'

const helloRouter = Router()
helloRouter.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Hello from Enterprise!' })
})

export const startEnterpriseExpressServer = async () => {
    await startExpressServer([
        ['/organizations/:organization_uuid/projects/:uuid/chat-ui-config', [], chatUiConfigRouter],
    ])
}
