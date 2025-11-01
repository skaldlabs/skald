import { Request, Response } from 'express'
import { DI } from '@/di'
import { logger } from '@/lib/logger'

export const health = async (req: Request, res: Response) => {
    const checks = { database: false }
    try {
        await DI.em.getConnection().execute('SELECT 1')
        checks.database = true
    } catch (error) {
        logger.error({ err: error }, 'Database connection failed')
    }
    res.json({ status: 'ok', checks })
}
