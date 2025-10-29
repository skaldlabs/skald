import type { User } from './entities/User'

declare global {
    namespace Express {
        interface Request {
            context?: {
                user?: User
            }
        }
    }
}

export {}
