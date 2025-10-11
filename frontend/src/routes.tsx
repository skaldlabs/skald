import { Navigate } from 'react-router-dom'
import { OrganizationPage } from '@/pages/OrganizationPage'

export const privateRoutes = [
    { path: '/', component: () => <Navigate to="/chat" /> },
    { path: '/organization', component: () => <OrganizationPage /> },
]
