import * as Sentry from '@sentry/node'
import { IS_DEVELOPMENT, SENTRY_DSN } from '@/settings'

if (!IS_DEVELOPMENT && SENTRY_DSN) {
    Sentry.init({
        dsn: SENTRY_DSN,
        sendDefaultPii: true,
    })
}
