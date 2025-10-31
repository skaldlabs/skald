import type { RequestUser } from '@/middleware/requestUser'

declare global {
    namespace Express {
        interface Request {
            context?: {
                requestUser?: RequestUser
            }
        }
    }
}

export {}
