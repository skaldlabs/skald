import { Request, Response } from 'express'
import { DI } from '../di'

export const health = async (req: Request, res: Response) => {
    const checks = { database: false }
    try {
        await DI.em.getConnection().execute('SELECT 1')
        checks.database = true
    } catch (error) {
        console.error('Database connection failed:', error)
    }
    res.json({ status: 'ok', checks })
}
