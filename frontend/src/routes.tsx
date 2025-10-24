import { Navigate } from 'react-router-dom'
import { OrganizationPage } from '@/pages/OrganizationPage'
import { ProjectSettingsPage } from '@/pages/ProjectSettingsPage'
import { GettingStartedPage } from '@/pages/GettingStartedPage'
import { MemosPage } from '@/pages/MemosPage'
import { PlaygroundPage } from '@/pages/PlaygroundPage'
import { SubscriptionPage } from '@/pages/SubscriptionPage'
import { isSelfHostedDeploy } from '@/settings'

const RootRedirect = () => {
    return <Navigate to="/projects/get-started" />
}

const defaultRoutes = [
    { path: '/', component: RootRedirect },
    { path: '/projects/get-started', component: () => <GettingStartedPage /> },
    { path: '/projects/:uuid/get-started', component: () => <GettingStartedPage /> },
    { path: '/organization', component: () => <OrganizationPage /> },
    { path: '/projects/:uuid/settings', component: () => <ProjectSettingsPage /> },
    { path: '/projects/:uuid/memos', component: () => <MemosPage /> },
    { path: '/projects/:uuid/playground', component: () => <PlaygroundPage /> },
]

const cloudRoutes = [{ path: '/organization/subscription', component: () => <SubscriptionPage /> }]

export const privateRoutes = isSelfHostedDeploy ? [...defaultRoutes] : [...defaultRoutes, ...cloudRoutes]
