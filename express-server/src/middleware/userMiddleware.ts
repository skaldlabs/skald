import { Request, Response, NextFunction } from 'express'
import { DI } from '../index'
import { User } from '../entities/User'

class UnauthenticatedUser extends User {
    isAuthenticated = false
}

export const userMiddleware = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Initialize context
        req.context = {
            user: new UnauthenticatedUser(),
        }

        const authHeader = req.headers.authorization
        if (!authHeader) {
            return next()
        }

        // Support both "Token <key>" and "Bearer <key>" formats
        const match = authHeader.match(/^(?:Token|Bearer)\s+(.+)$/i)
        if (!match) {
            return next()
        }

        const key = match[1]

        try {
            const authToken = await DI.authTokens.findOneOrFail(key, { populate: ['user'] })

            if (authToken && authToken.user) {
                req.context.user = authToken.user
            }
        } catch (error) {
            // Log error but continue without user
            console.error('Error authenticating user:', error)
        }

        next()
    }
}
