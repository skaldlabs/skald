import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { api } from '@/lib/api'

interface ResetPasswordFormData {
    new_password: string
    confirm_password: string
}

interface ResetPasswordResponse {
    success: boolean
    message?: string
}

export const ResetPasswordPage = () => {
    const [loading, setLoading] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const token = searchParams.get('token')

    const form = useForm<ResetPasswordFormData>({
        defaultValues: {
            new_password: '',
            confirm_password: '',
        },
    })

    useEffect(() => {
        if (!token) {
            toast.error('Invalid reset link')
            navigate('/login')
        }
    }, [token, navigate])

    const onSubmit = async (values: ResetPasswordFormData) => {
        if (values.new_password !== values.confirm_password) {
            form.setError('confirm_password', {
                type: 'manual',
                message: 'Passwords do not match',
            })
            return
        }

        setLoading(true)
        try {
            const response = await api.post<ResetPasswordResponse>('/user/reset-password', {
                token,
                new_password: values.new_password,
            })

            if (response.data?.success) {
                toast.success('Password reset successfully!')
                navigate('/login')
            } else {
                toast.error(response.data?.message || 'Failed to reset password. Link may have expired.')
            }
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to reset password. Please try again.'
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }

    if (!token) {
        return null
    }

    return (
        <div className="flex justify-center items-center min-h-screen bg-background">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
                    <CardDescription className="text-center">
                        Enter your new password below. Make sure it's strong and secure.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="new_password"
                                rules={{
                                    required: 'Password is required',
                                    minLength: {
                                        value: 8,
                                        message: 'Password must be at least 8 characters',
                                    },
                                }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>New Password</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    {...field}
                                                    type={showNewPassword ? 'text' : 'password'}
                                                    placeholder="Enter new password"
                                                    className="pl-10 pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                    tabIndex={-1}
                                                >
                                                    {showNewPassword ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="confirm_password"
                                rules={{
                                    required: 'Please confirm your password',
                                }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Confirm Password</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    {...field}
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    placeholder="Confirm new password"
                                                    className="pl-10 pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                    tabIndex={-1}
                                                >
                                                    {showConfirmPassword ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                                <p className="text-xs text-amber-900 dark:text-amber-100">
                                    This reset link will expire in 10 minutes.
                                </p>
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </Button>
                        </form>
                    </Form>

                    <div className="text-center mt-4 text-sm text-muted-foreground">
                        Remember your password?{' '}
                        <a href="/login" className="text-primary hover:underline">
                            Back to login
                        </a>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
