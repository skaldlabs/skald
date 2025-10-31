import { Request, Response, NextFunction } from 'express'
import { DI } from '@/di'
import { sha3_256 } from '@/lib/hashUtils'
import { RequestUser } from '@/middleware/requestUser'
import { verifyAccessToken } from '@/lib/tokenUtils'

export const userMiddleware = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
        req.context = {
            requestUser: new RequestUser(null, 'unauthenticatedUser', null),
        }

        const accessToken = req.cookies.accessToken
        const authHeader = req.headers.authorization

        if (accessToken) {
            const decodedUser = verifyAccessToken(accessToken)
            if (decodedUser) {
                const user = await DI.users.findOne({ email: decodedUser.email })
                if (user) {
                    req.context.requestUser = new RequestUser(user, 'authenticatedUser', null)
                }
            }
            return next()
        }

        if (!authHeader) {
            return next()
        }

        // Support both "Token <key>" and "Bearer <key>" formats
        const match = authHeader.match(/^(?:Token|Bearer)\s+(.+)$/i)
        if (!match) {
            return next()
        }

        const key = match[1]

        const projectAPIKey = await DI.projectAPIKeys.findOne(sha3_256(key), { populate: ['project'] })
        if (projectAPIKey) {
            req.context.requestUser = new RequestUser(null, 'projectAPIKeyUser', projectAPIKey.project)
            return next()
        }

        return next()
    }
}
