import { Navigate } from 'react-router-dom'
import { OrganizationPage } from '@/pages/OrganizationPage'
import { ProjectSettingsPage } from '@/pages/ProjectSettingsPage'
import { GettingStartedPage } from '@/pages/GettingStartedPage'
import { MemosPage } from '@/pages/MemosPage'
import { PlaygroundPage } from '@/pages/PlaygroundPage'

export const privateRoutes = [
    { path: '/', component: () => <Navigate to="/projects/get-started" /> },
    { path: '/projects/get-started', component: () => <GettingStartedPage /> },
    { path: '/organization', component: () => <OrganizationPage /> },
    { path: '/projects/:uuid/settings', component: () => <ProjectSettingsPage /> },
    { path: '/projects/:uuid/memos', component: () => <MemosPage /> },
    { path: '/projects/:uuid/playground', component: () => <PlaygroundPage /> },
]
