import * as Sentry from '@sentry/node'
Sentry.init({
    dsn: 'https://2e4f537a4883475bca2a3cc75318a42d@o4509092419076096.ingest.de.sentry.io/4510188104122448',
    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true,
})
