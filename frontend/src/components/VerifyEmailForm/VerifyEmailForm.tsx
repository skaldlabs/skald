import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { Mail } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { api, domain } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

interface CountdownTimerProps {
    duration: number
    onComplete: () => void
}

const CountdownTimer = ({ duration, onComplete }: CountdownTimerProps) => {
    const [timeLeft, setTimeLeft] = useState(duration)

    useEffect(() => {
        let timer: NodeJS.Timeout
        if (timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer)
                        onComplete()
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
        }
        return () => {
            if (timer) clearInterval(timer)
        }
    }, [timeLeft, onComplete])

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }

    return timeLeft > 0 ? `Resend code in ${formatTime(timeLeft)}` : 'Send verification code'
}

interface VerifyEmailFormData {
    code: string
}

export const VerifyEmailForm = () => {
    const initializeAuth = useAuthStore((state) => state.initializeAuth)
    const user = useAuthStore((state) => state.user)
    const [loading, setLoading] = useState(false)
    const [resendLoading, setResendLoading] = useState(false)
    const [isCountdownActive, setIsCountdownActive] = useState(false)
    const navigate = useNavigate()

    const form = useForm<VerifyEmailFormData>({
        defaultValues: {
            code: '',
        },
    })

    const onSubmit = async (values: VerifyEmailFormData) => {
        setLoading(true)
        const response = await api.post('/email_verification/verify/', {
            code: values.code,
        })
        if (!response.error) {
            toast.success('Email verified successfully!')
            await initializeAuth()
            navigate('/create-organization')
        } else {
            toast.error(response.error || 'Failed to verify email. Please try again.')
        }
        setLoading(false)
    }

    const handleResendCode = useCallback(async () => {
        setResendLoading(true)
        const response = await api.post('/email_verification/send/')
        if (!response.error) {
            toast.success('Verification code sent to your email!')
            setIsCountdownActive(true)
        } else {
            toast.error('Failed to send verification code. Please try again.')
        }
        setResendLoading(false)
    }, [])

    const handleCountdownComplete = () => {
        setIsCountdownActive(false)
    }

    useEffect(() => {
        const runningLocally = domain.includes('localhost')

        // if there's no user that means they're not authenticated and will be redirected away
        // if we're running locally, we shouldn't send the verification code right away
        if (user && !runningLocally && !user.email_verified) {
            handleResendCode()
        }
    }, [handleResendCode, user])

    return (
        <div className="flex justify-center items-center min-h-screen bg-background">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-center">Verify Your Email</CardTitle>
                    <p className="text-center text-muted-foreground">Enter the verification code sent to your email</p>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="code"
                                rules={{
                                    required: 'Verification code is required',
                                    pattern: {
                                        value: /^\d{6}$/,
                                        message: 'Verification code must be 6 digits',
                                    },
                                }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Verification Code</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    {...field}
                                                    placeholder="Enter verification code"
                                                    className="pl-10"
                                                    maxLength={6}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Verifying...' : 'Verify Email'}
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleResendCode}
                                disabled={resendLoading || isCountdownActive}
                                className="w-full"
                            >
                                {isCountdownActive ? (
                                    <CountdownTimer duration={300} onComplete={handleCountdownComplete} />
                                ) : resendLoading ? (
                                    'Sending...'
                                ) : (
                                    'Send verification code'
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}
