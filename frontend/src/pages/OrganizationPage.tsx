import { Page } from '@/components/AppLayout/Page'
// import { OrganizationDashboard } from '@/components/Organization/OrganizationDashboard'
import { OrganizationAccessLevel, useAuthStore } from '@/stores/authStore'
import { Navigate } from 'react-router-dom'

export const OrganizationPage = () => {
    const user = useAuthStore((state) => state.user)

    if (
        !user?.access_levels?.organization_access_levels?.[user?.current_organization_uuid] ||
        user.access_levels.organization_access_levels[user.current_organization_uuid] < OrganizationAccessLevel.OWNER
    ) {
        return <Navigate to="/" />
    }

    return (
        <Page pageTitle="Organization">
            {/* <OrganizationDashboard /> */}
            hi there
        </Page>
    )
}
