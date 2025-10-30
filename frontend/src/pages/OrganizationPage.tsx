import { Page } from '@/components/AppLayout/Page'
import { OrganizationDashboard } from '@/components/Organization/OrganizationDashboard'

export const OrganizationPage = () => {
    return (
        <Page pageTitle="Organization">
            <OrganizationDashboard />
        </Page>
    )
}
