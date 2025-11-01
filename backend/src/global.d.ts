import type { RequestUser } from '@/middleware/requestUser'

declare global {
    namespace Express {
        interface Request {
            context?: {
                requestUser?: RequestUser
            }
        }
        interface Response {
            sentry?: string
        }
    }
}

export {}
