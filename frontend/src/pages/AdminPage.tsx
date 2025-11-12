import { Page } from '@/components/AppLayout/Page'
import { AdminDashboard } from '@/components/Admin/AdminDashboard'

export const AdminPage = () => {
    return (
        <Page pageTitle="Admin">
            <AdminDashboard />
        </Page>
    )
}
