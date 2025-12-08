import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { LoginPage } from '@/pages/LoginPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { useAuthStore } from '@/stores/authStore'
import { SignupFlow, SignupFlowStep } from '@/components/SignupFlow'
import { privateRoutes } from '@/routes'
import { UpgradePromptDialog } from '@/components/Subscription/UpgradePromptDialog'
import { useUpgradePromptStore } from '@/stores/upgradePromptStore'
import { isLicensedDeploy } from '@/config'
import { PublicChatPage } from '@/pages/PublicChatPage'
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

    if (isAuthenticated && user?.email_verified && !user?.name) {
        return <Navigate to="/complete-profile" />
    }

    if (isAuthenticated && user?.email_verified && user?.name && !user?.default_organization) {
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
                <Route
                    path="/forgot-password"
                    element={
                        <PublicRoute>
                            <ForgotPasswordPage />
                        </PublicRoute>
                    }
                />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/signup" element={<SignupFlow currentStep={SignupFlowStep.Signup} />} />
                <Route path="/verify-email" element={<SignupFlow currentStep={SignupFlowStep.VerifyEmail} />} />
                <Route path="/complete-profile" element={<SignupFlow currentStep={SignupFlowStep.CompleteProfile} />} />
                <Route
                    path="/create-organization"
                    element={<SignupFlow currentStep={SignupFlowStep.CreateOrganization} />}
                />
                <Route
                    path="/self-hosted-welcome"
                    element={<SignupFlow currentStep={SignupFlowStep.SelfHostedWelcome} />}
                />
                {isLicensedDeploy && <Route path="/public_chat/:slug" element={<PublicChatPage />} />}
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
