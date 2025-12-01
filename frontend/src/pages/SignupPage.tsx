import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SignupForm } from '@/components/SignupForm/SignupForm'
import { handleOAuthError } from '@/lib/oauthErrorHandler'

export const SignupPage = () => {
    const [searchParams] = useSearchParams()

    useEffect(() => {
        const error = searchParams.get('error')
        handleOAuthError(error)
    }, [searchParams])

    return <SignupForm />
}
