import { Router, Request, Response } from 'express'
import { startExpressServer } from '@mit/expressServer'

const helloRouter = Router()
helloRouter.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Hello from Enterprise!' })
})

export const startEnterpriseExpressServer = async () => {
    await startExpressServer([['/hello', [], helloRouter]])
}
