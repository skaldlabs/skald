import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LoginForm } from '@/components/LoginForm/LoginForm'
import { handleOAuthError } from '@/lib/oauthErrorHandler'

export const LoginPage = () => {
    const [searchParams] = useSearchParams()

    useEffect(() => {
        const error = searchParams.get('error')
        handleOAuthError(error)
    }, [searchParams])

    return <LoginForm />
}
