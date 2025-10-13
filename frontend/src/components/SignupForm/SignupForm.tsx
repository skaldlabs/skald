import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Mail, Lock } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

interface SignupFormData {
    email: string
    password: string
    confirm: string
}

export const SignupForm = () => {
    const [loading, setLoading] = useState(false)
    const signup = useAuthStore((state) => state.signup)
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    const form = useForm<SignupFormData>({
        defaultValues: {
            email: '',
            password: '',
            confirm: '',
        },
    })

    const emailFromQuery = searchParams.get('email')

    useEffect(() => {
        if (emailFromQuery) {
            form.setValue('email', emailFromQuery)
        }
    }, [emailFromQuery, form])

    const onSubmit = async (values: SignupFormData) => {
        if (values.password !== values.confirm) {
            toast.error('Passwords do not match!')
            return
        }

        setLoading(true)
        try {
            const success = await signup(values.email, values.password)
            if (success) {
                toast.success('Signup successful! Please verify your email.')
                navigate('/verify-email')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex justify-center items-center min-h-screen bg-background">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-center">Create an Account</CardTitle>
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

                            <FormField
                                control={form.control}
                                name="password"
                                rules={{
                                    required: 'Password is required',
                                    minLength: {
                                        value: 8,
                                        message: 'Password must be at least 8 characters',
                                    },
                                }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    {...field}
                                                    type="password"
                                                    placeholder="Enter your password"
                                                    className="pl-10"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="confirm"
                                rules={{
                                    required: 'Please confirm your password',
                                    validate: (value) => {
                                        const password = form.getValues('password')
                                        return value === password || 'Passwords do not match'
                                    },
                                }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Confirm Password</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    {...field}
                                                    type="password"
                                                    placeholder="Confirm your password"
                                                    className="pl-10"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Creating account...' : 'Sign Up'}
                            </Button>
                        </form>
                    </Form>

                    <div className="text-center mt-4 text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary hover:underline">
                            Log in
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
