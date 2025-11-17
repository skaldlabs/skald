import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Mail } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { api } from '@/lib/api'

interface ForgotPasswordFormData {
    email: string
}

export const ForgotPasswordPage = () => {
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const form = useForm<ForgotPasswordFormData>({
        defaultValues: {
            email: '',
        },
    })

    const onSubmit = async (values: ForgotPasswordFormData) => {
        setLoading(true)
        try {
            await api.post('/user/forgot-password', {
                email: values.email,
            })
            setSubmitted(true)
            toast.success('Password reset instructions sent!')
        } catch (error) {
            console.error(error)
            toast.error('Failed to send reset instructions. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (submitted) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-background">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl text-center">Check Your Email</CardTitle>
                        <CardDescription className="text-center">
                            If an account exists with that email, we've sent password reset instructions.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                <p className="text-sm text-blue-900 dark:text-blue-100">
                                    Check your email inbox for a password reset link. The link will expire in 10
                                    minutes.
                                </p>
                            </div>

                            <div className="text-center space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    Didn't receive the email? Check your spam folder.
                                </p>
                                <Button
                                    variant="link"
                                    className="text-sm"
                                    onClick={() => {
                                        setSubmitted(false)
                                        form.reset()
                                    }}
                                >
                                    Try again
                                </Button>
                            </div>

                            <div className="text-center pt-4">
                                <Link to="/login" className="text-sm text-primary hover:underline">
                                    Back to login
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex justify-center items-center min-h-screen bg-background">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-center">Forgot Password</CardTitle>
                    <CardDescription className="text-center">
                        Enter your email address and we'll send you instructions to reset your password.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                rules={{
                                    required: 'Email is required',
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: 'Please enter a valid email address',
                                    },
                                }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    {...field}
                                                    type="email"
                                                    placeholder="Enter your email"
                                                    className="pl-10"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Sending...' : 'Send Reset Instructions'}
                            </Button>
                        </form>
                    </Form>

                    <div className="text-center mt-4 text-sm text-muted-foreground">
                        Remember your password?{' '}
                        <Link to="/login" className="text-primary hover:underline">
                            Back to login
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
