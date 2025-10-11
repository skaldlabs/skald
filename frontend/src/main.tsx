import { createRoot } from 'react-dom/client'
import App from '@/App'
import '@/styles/global.scss'
import { PostHogProvider } from 'posthog-js/react'
// import * as Sentry from '@sentry/react'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Toaster } from '@/components/ui/sonner'

const isLocalhost = window.location.hostname === 'localhost'

if (!isLocalhost) {
    // Sentry.init({
    //     dsn: 'https://b253885bf8381ce9188e516a32437dd6@o4509092419076096.ingest.de.sentry.io/4509092455448656',
    // })
}

const posthogOptions = {
    api_host: 'https://us.i.posthog.com',
    autocapture: !isLocalhost,
    disable_session_recording: isLocalhost,
    session_recording: {
        maskAllInputs: false,
        maskInputOptions: {
            password: true,
            textarea: false,
        },
    },
}

createRoot(document.getElementById('root')!).render(
    <ThemeProvider>
        <PostHogProvider
            // this is a public key that can be leaked
            apiKey="phc_FK03wMplwRao74BtkCzoCtwJJrJfuPX89UAq8ndcg6L"
            options={posthogOptions}
        >
            <Toaster />
            <App />
        </PostHogProvider>
    </ThemeProvider>
)
