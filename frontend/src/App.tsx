import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { LoginPage } from '@/pages/LoginPage'
import { useAuthStore } from '@/stores/authStore'
import { SignupFlow, SignupFlowStep } from '@/components/SignupFlow'
import { privateRoutes } from '@/routes'
import { UpgradePromptDialog } from '@/components/Subscription/UpgradePromptDialog'
import { useUpgradePromptStore } from '@/stores/upgradePromptStore'
import '@/index.css'

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
    const user = useAuthStore((state) => state.user)

    if (!isAuthenticated) {
        return <Navigate to="/login" />
    }

    if (isAuthenticated && !user?.email_verified) {
        return <Navigate to="/verify-email" />
    }

    if (isAuthenticated && user?.email_verified && !user?.default_organization) {
        return <Navigate to="/create-organization" />
    }

    return children
}

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
    return isAuthenticated ? <Navigate to="/" /> : children
}

function App() {
    const initializeAuth = useAuthStore((state) => state.initializeAuth)
    const firstLoad = useAuthStore((state) => state.firstLoad)
    const { open, message, currentUsage, limit, hidePrompt } = useUpgradePromptStore()

    useEffect(() => {
        initializeAuth()
    }, [initializeAuth])

    if (firstLoad) {
        return null
    }

    // TODO: add catch-all route
    return (
        <Router>
            <Routes>
                <Route
                    path="/login"
                    element={
                        <PublicRoute>
                            <LoginPage />
                        </PublicRoute>
                    }
                />
                <Route path="/signup" element={<SignupFlow currentStep={SignupFlowStep.Signup} />} />
                <Route path="/verify-email" element={<SignupFlow currentStep={SignupFlowStep.VerifyEmail} />} />
                <Route
                    path="/create-organization"
                    element={<SignupFlow currentStep={SignupFlowStep.CreateOrganization} />}
                />
                {privateRoutes.map((route) => (
                    <Route
                        key={route.path}
                        path={route.path}
                        element={<PrivateRoute>{route.component()}</PrivateRoute>}
                    />
                ))}
            </Routes>
            <UpgradePromptDialog
                open={open}
                onOpenChange={hidePrompt}
                message={message}
                currentUsage={currentUsage}
                limit={limit}
            />
        </Router>
    )
}

export default App
