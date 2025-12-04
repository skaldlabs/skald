import { IS_SELF_HOSTED_DEPLOY, POSTHOG_API_KEY, POSTHOG_HOST, TEST } from '@/settings'
import { PostHog, EventMessage } from 'posthog-node'

export const posthog = new PostHog(POSTHOG_API_KEY, { host: POSTHOG_HOST })

export function posthogCapture(message: EventMessage): void {
    if (IS_SELF_HOSTED_DEPLOY && !['organization_created', 'user_details_completed'].includes(message.event)) {
        return
    }
    if (TEST) {
        return
    }

    posthog.capture(message)
}

export function posthogGroupIdentify({
    groupType,
    groupKey,
    properties,
}: {
    groupType: string
    groupKey: string
    properties: Record<string, unknown>
}): void {
    if (TEST) {
        return
    }

    posthog.groupIdentify({
        groupType,
        groupKey,
        properties,
    })
}
