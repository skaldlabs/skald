import { IS_SELF_HOSTED_DEPLOY, POSTHOG_API_KEY, POSTHOG_HOST, TEST } from '@/settings'
import { PostHog } from 'posthog-node'

export const posthog = new PostHog(POSTHOG_API_KEY, { host: POSTHOG_HOST })

export function posthogCapture(event_name: string, distinct_id: string, properties: Record<string, unknown>): void {
    if (IS_SELF_HOSTED_DEPLOY && !['organization_created'].includes(event_name)) {
        return
    }
    if (TEST) {
        return
    }

    posthog.capture({
        event: event_name,
        distinctId: distinct_id,
        properties: properties as Record<string, unknown>,
    })
}
