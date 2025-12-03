import { Navigate } from 'react-router-dom'
import { OrganizationPage } from '@/pages/OrganizationPage'
import { ProjectSettingsPage } from '@/pages/ProjectSettingsPage'
import { GettingStartedPage } from '@/pages/GettingStartedPage'
import { MemosPage } from '@/pages/MemosPage'
import { ChatsPage } from '@/pages/ChatsPage'
import { PlaygroundChatPage } from '@/pages/PlaygroundChatPage'
import { PlaygroundSearchPage } from '@/pages/PlaygroundSearchPage'
import { ExperimentsPage } from '@/pages/ExperimentsPage'
import { DatasetsPage } from '@/pages/DatasetsPage'
import { SubscriptionPage } from '@/pages/SubscriptionPage'
import { AdminPage } from '@/pages/AdminPage'
import { isSelfHostedDeploy } from '@/config'

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
    { path: '/projects/:uuid/memos/:memoUuid', component: () => <MemosPage /> },
    { path: '/projects/:uuid/chats', component: () => <ChatsPage /> },
    { path: '/projects/:uuid/playground/chat', component: () => <PlaygroundChatPage /> },
    { path: '/projects/:uuid/playground/search', component: () => <PlaygroundSearchPage /> },
    { path: '/projects/:uuid/evaluate/experiments', component: () => <ExperimentsPage /> },
    { path: '/projects/:uuid/evaluate/datasets', component: () => <DatasetsPage /> },
    { path: '/admin', component: () => <AdminPage /> },
]

const cloudRoutes = [{ path: '/organization/subscription', component: () => <SubscriptionPage /> }]

export const privateRoutes = isSelfHostedDeploy ? [...defaultRoutes] : [...defaultRoutes, ...cloudRoutes]
