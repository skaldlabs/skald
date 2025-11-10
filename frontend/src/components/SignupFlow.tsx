import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { SignupPage } from '@/pages/SignupPage'
import { VerifyEmailPage } from '@/pages/VerifyEmailPage'
import { CompleteProfilePage } from '@/pages/CompleteProfilePage'
import { CreateOrganizationPage } from '@/pages/CreateOrganizationPage'
import { UserDetails } from '@/stores/authStore'

interface SignupFlowProps {
    currentStep: SignupFlowStep
}

export enum SignupFlowStep {
    Signup = 'signup',
    VerifyEmail = 'verify-email',
    CompleteProfile = 'complete-profile',
    CreateOrganization = 'create-organization',
    Complete = 'complete',
}

const signupSteps = [
    {
        step: SignupFlowStep.Signup,
        path: '/signup',
        component: <SignupPage />,
        userShouldCompleteStep: (isAuthenticated: boolean) => !isAuthenticated,
    },
    {
        step: SignupFlowStep.VerifyEmail,
        path: '/verify-email',
        component: <VerifyEmailPage />,
        userShouldCompleteStep: (isAuthenticated: boolean, user: UserDetails) =>
            isAuthenticated && !user?.email_verified,
    },
    {
        step: SignupFlowStep.CompleteProfile,
        path: '/complete-profile',
        component: <CompleteProfilePage />,
        userShouldCompleteStep: (isAuthenticated: boolean, user: UserDetails) =>
            isAuthenticated && user?.email_verified && !user?.name,
    },
    {
        step: SignupFlowStep.CreateOrganization,
        path: '/create-organization',
        component: <CreateOrganizationPage />,
        userShouldCompleteStep: (isAuthenticated: boolean, user: UserDetails) =>
            isAuthenticated && user?.email_verified && user?.name && !user?.default_organization,
    },
    {
        step: SignupFlowStep.Complete,
        path: '/',
        component: null,
        userShouldCompleteStep: (isAuthenticated: boolean, user: UserDetails) =>
            isAuthenticated && user?.email_verified && user?.default_organization,
    },
]

export const SignupFlow = ({ currentStep }: SignupFlowProps) => {
    const navigate = useNavigate()
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
    const user = useAuthStore((state) => state.user)

    useEffect(() => {
        if (!isAuthenticated || !user) {
            navigate('/signup')
            return
        }

        for (const step of signupSteps) {
            if (step.userShouldCompleteStep(isAuthenticated, user)) {
                navigate(step.path)
                return
            }
        }
    }, [isAuthenticated, user, currentStep, navigate])

    return signupSteps.find((step) => step.step === currentStep)?.component
}
