import { Navigate } from 'react-router-dom'
import { OrganizationPage } from '@/pages/OrganizationPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ProjectsPage } from '@/pages/ProjectsPage'

export const privateRoutes = [
    { path: '/', component: () => <Navigate to="/dashboard" /> },
    { path: '/dashboard', component: () => <DashboardPage /> },
    { path: '/organization', component: () => <OrganizationPage /> },
    { path: '/projects', component: () => <ProjectsPage /> },
]
