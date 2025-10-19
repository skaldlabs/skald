import { Page } from '@/components/AppLayout/Page'
import { SubscriptionDashboard } from '@/components/Subscription/SubscriptionDashboard'
import { OrganizationAccessLevel, useAuthStore } from '@/stores/authStore'
import { Navigate } from 'react-router-dom'

export const SubscriptionPage = () => {
    const user = useAuthStore((state) => state.user)

    // Only allow owners to access subscription page
    if (
        !user?.access_levels?.organization_access_levels?.[user?.current_organization_uuid] ||
        user.access_levels.organization_access_levels[user.current_organization_uuid] < OrganizationAccessLevel.OWNER
    ) {
        return <Navigate to="/" />
    }

    return (
        <Page pageTitle="Subscription & Billing">
            <SubscriptionDashboard />
        </Page>
    )
}
