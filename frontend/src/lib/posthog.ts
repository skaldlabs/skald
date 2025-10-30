import { isSelfHostedDeploy } from '@/config'
import posthog from 'posthog-js'

export const posthogIdentify = (email: string, properties: Record<string, unknown>) => {
    if (isSelfHostedDeploy) {
        return
    }
    posthog.identify(email, properties)
}
