import { toast } from 'sonner'

export const handleOAuthError = (error: string | null) => {
    if (!error) return

    const errorMessages: Record<string, string> = {
        oauth_init_failed: 'Failed to start Google sign-in. Please try again.',
        access_denied: 'Google sign-in was cancelled.',
        missing_code: 'Invalid response from Google. Please try again.',
        invalid_state: 'Security validation failed. Please try again.',
        email_not_verified: 'Your Google email is not verified.',
        oauth_failed: 'Google sign-in failed. Please try again.',
    }

    toast.error(errorMessages[error] || 'An error occurred during sign-in.')
}
