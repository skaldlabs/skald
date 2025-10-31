import * as Sentry from '@sentry/node'
import { DEBUG, SENTRY_DSN } from '@/settings'

if (!DEBUG && SENTRY_DSN) {
    Sentry.init({
        dsn: SENTRY_DSN,
        sendDefaultPii: true,
    })
}
