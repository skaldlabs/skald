import '@/settings'
import { createRoot } from 'react-dom/client'
import App from '@/App'
import '@/styles/global.scss'
import { PostHogProvider } from 'posthog-js/react'
import * as Sentry from '@sentry/react'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Toaster } from '@/components/ui/sonner'
import { isSelfHostedDeploy } from '@/settings'

const isLocalhost = window.location.hostname === 'localhost'

if (!isLocalhost && !isSelfHostedDeploy) {
    Sentry.init({
        dsn: 'https://7354207998ee26186ca556d398da8f0a@o4509092419076096.ingest.de.sentry.io/4510255948496976',
    })
}

const posthogOptions = {
    api_host: 'https://us.i.posthog.com',
    autocapture: !isLocalhost && !isSelfHostedDeploy,
    disable_session_recording: isLocalhost || isSelfHostedDeploy,
    session_recording: {
        maskAllInputs: false,
        maskInputOptions: {
            password: true,
            textarea: false,
        },
    },
}

// we don't track self-hosted instance with posthog
createRoot(document.getElementById('root')!).render(
    <ThemeProvider>
        {isSelfHostedDeploy ? (
            <>
                <Toaster />
                <App />
            </>
        ) : (
            <PostHogProvider
                // this is a public key that can be leaked
                apiKey="phc_B77mcYC1EycR6bKLgSNzjM9aaeiWXhoeizyriFIxWf2"
                options={posthogOptions}
            >
                <Toaster />
                <App />
            </PostHogProvider>
        )}
    </ThemeProvider>
)
