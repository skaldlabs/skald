import { Request, Response } from 'express'

export const organization = async (req: Request, res: Response) => {
    res.json({ status: 'ok' })
}
