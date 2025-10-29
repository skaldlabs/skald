import { Request, Response } from 'express'
import { DI } from '../di'

export const organization = async (req: Request, res: Response) => {
    res.json({ status: 'ok' })
}
