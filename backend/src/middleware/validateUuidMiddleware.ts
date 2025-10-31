import { Request, Response, NextFunction } from 'express'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Middleware to validate UUID format for specified route parameters
 */
export const validateUuidParams = (...paramNames: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        for (const paramName of paramNames) {
            const paramValue = req.params[paramName]

            if (paramValue && !UUID_REGEX.test(paramValue)) {
                return res.status(400).json({ error: 'Invalid UUID format' })
            }
        }

        next()
    }
}
