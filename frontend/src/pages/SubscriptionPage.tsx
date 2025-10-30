import { Page } from '@/components/AppLayout/Page'
import { SubscriptionDashboard } from '@/components/Subscription/SubscriptionDashboard'

export const SubscriptionPage = () => {
    return (
        <Page pageTitle="Plan & Billing">
            <SubscriptionDashboard />
        </Page>
    )
}
