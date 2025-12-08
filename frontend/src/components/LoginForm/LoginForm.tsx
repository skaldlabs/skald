import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, MoreVertical } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { GoogleAuthButton } from '@/components/GoogleAuthButton/GoogleAuthButton'
import { isSelfHostedDeploy } from '@/config'
import { AuthPromo } from '@/components/AuthPromo/AuthPromo'
import { DarkModeToggle } from '@/components/DarkModeToggle/DarkModeToggle'

interface LoginFormData {
    email: string
    password: string
}

export const LoginForm = () => {
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const login = useAuthStore((state) => state.login)
    const navigate = useNavigate()

    const form = useForm<LoginFormData>({
        defaultValues: {
            email: '',
            password: '',
        },
    })

    const onSubmit = async (values: LoginFormData) => {
        setLoading(true)
        try {
            const success = await login(values.email, values.password)
            if (success) {
                toast.success('Login successful!')
                navigate('/')
            } else {
                toast.error('Invalid credentials')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col lg:flex-row min-h-screen">
            {/* Left Column - Login Form */}
            <div className="w-full lg:w-2/3 flex items-center justify-center bg-white dark:bg-background p-8 relative border-r border-gray-200 dark:border-[#252525]">
                <DarkModeToggle />
                <div className="w-full max-w-md space-y-8">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-black dark:text-foreground">Welcome back</h1>
                        <p className="text-base text-black/70 dark:text-muted-foreground">
                            Login to your Skald account
                        </p>
                    </div>

                    {!isSelfHostedDeploy && (
                        <>
                            <GoogleAuthButton disabled={loading} />

                            <div className="relative my-4">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white dark:bg-background px-2 text-muted-foreground">
                                        Or continue with
                                    </span>
                                </div>
                            </div>
                        </>
                    )}

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                                        <FormLabel className="text-black dark:text-foreground">Email</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    {...field}
                                                    type="email"
                                                    placeholder="Enter your email"
                                                    className="pr-20"
                                                />
                                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                                                    <div className="w-3 h-3 bg-red-500 rounded-sm flex items-center justify-center">
                                                        <MoreVertical className="h-2.5 w-2.5 text-white" />
                                                    </div>
                                                    <Eye className="h-4 w-4 text-gray-400" />
                                                </div>
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
                                }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-black dark:text-foreground">Password</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    {...field}
                                                    type={showPassword ? 'text' : 'password'}
                                                    placeholder="Enter your password"
                                                    className="pr-20"
                                                />
                                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-red-500 rounded-sm flex items-center justify-center">
                                                        <MoreVertical className="h-2 w-2 text-white" />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="text-gray-400 hover:text-gray-600"
                                                        tabIndex={-1}
                                                    >
                                                        {showPassword ? (
                                                            <EyeOff className="h-4 w-4" />
                                                        ) : (
                                                            <Eye className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 rounded-lg h-11"
                                disabled={loading}
                            >
                                {loading ? 'Logging in...' : 'Login'}
                            </Button>
                        </form>
                    </Form>

                    <div className="text-center text-sm text-black/70 dark:text-muted-foreground">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-black dark:text-foreground font-medium hover:underline">
                            Sign up
                        </Link>
                    </div>

                    {!isSelfHostedDeploy && (
                        <p className="text-xs text-black/60 dark:text-muted-foreground text-center">
                            By signing in, you agree to our{' '}
                            <a
                                href="https://www.useskald.com/terms"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:no-underline"
                            >
                                Terms of Service
                            </a>{' '}
                            and{' '}
                            <a
                                href="https://www.useskald.com/policy"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:no-underline"
                            >
                                Privacy Policy
                            </a>
                            .
                        </p>
                    )}
                </div>
            </div>

            {/* Right Column - Promotional Content */}
            <div className="w-full lg:w-1/3 hidden lg:block">
                <AuthPromo variant="login" />
            </div>
        </div>
    )
}
