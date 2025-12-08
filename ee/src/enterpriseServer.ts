import { Router, Request, Response } from 'express'
import { startExpressServer } from '@mit/expressServer'
import { chatUiConfigRouter } from '@ee/api/chatUiConfig'
import { chat, checkAvailability } from '@ee/api/publicChat'

const helloRouter = Router()
helloRouter.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Hello from Enterprise!' })
})

export const startEnterpriseExpressServer = async () => {
    await startExpressServer(
        [['/organizations/:organization_uuid/projects/:uuid/chat_ui_config', [], chatUiConfigRouter]],
        [
            ['/api/public_chat/:slug', 'POST', [], chat],
            ['/api/public_chat/:slug/available', 'GET', [], checkAvailability],
        ]
    )
}
