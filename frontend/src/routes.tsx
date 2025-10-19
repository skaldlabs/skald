import { Navigate } from 'react-router-dom'
import { OrganizationPage } from '@/pages/OrganizationPage'
import { ProjectSettingsPage } from '@/pages/ProjectSettingsPage'
import { GettingStartedPage } from '@/pages/GettingStartedPage'
import { MemosPage } from '@/pages/MemosPage'
import { PlaygroundPage } from '@/pages/PlaygroundPage'
import { SubscriptionPage } from '@/pages/SubscriptionPage'

const RootRedirect = () => {
    return <Navigate to="/projects/get-started" />
}

export const privateRoutes = [
    { path: '/', component: RootRedirect },
    { path: '/projects/get-started', component: () => <GettingStartedPage /> },
    { path: '/projects/:uuid/get-started', component: () => <GettingStartedPage /> },
    { path: '/organization', component: () => <OrganizationPage /> },
    { path: '/organization/subscription', component: () => <SubscriptionPage /> },
    { path: '/projects/:uuid/settings', component: () => <ProjectSettingsPage /> },
    { path: '/projects/:uuid/memos', component: () => <MemosPage /> },
    { path: '/projects/:uuid/playground', component: () => <PlaygroundPage /> },
]
