import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { User, Briefcase, Users, Phone } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/api'
import { isSelfHostedDeploy } from '@/config'

interface CompleteProfileFormData {
    first_name: string
    last_name: string
    role: string
    phone_number?: string
    referral_source: string
    referral_details: string
}

const ROLE_OPTIONS = [
    { value: 'founder', label: 'Founder' },
    { value: 'cto', label: 'CTO' },
    { value: 'product_manager', label: 'Product Manager' },
    { value: 'software_engineer', label: 'Software Engineer' },
    { value: 'designer', label: 'Designer' },
    { value: 'data_scientist', label: 'Data Scientist' },
    { value: 'business_analyst', label: 'Business Analyst' },
    { value: 'other', label: 'Other' },
]

const REFERRAL_OPTIONS = [
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'product_hunt', label: 'Product Hunt' },
    { value: 'github', label: 'GitHub' },
    { value: 'hacker_news', label: 'Hacker News' },
    { value: 'tabnews', label: 'TabNews' },
    { value: 'twitter', label: 'Twitter/X' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'friend', label: 'Friend or Colleague' },
    { value: 'reddit', label: 'Reddit' },
    { value: 'other', label: 'Other' },
]

export const CompleteProfileForm = () => {
    const [loading, setLoading] = useState(false)
    const initializeAuth = useAuthStore((state) => state.initializeAuth)
    const user = useAuthStore((state) => state.user)
    const navigate = useNavigate()

    const form = useForm<CompleteProfileFormData>({
        defaultValues: {
            first_name: user?.name?.split(' ')[0] || '',
            last_name: user?.name?.split(' ')[1] || '',
            role: '',
            phone_number: '',
            referral_source: '',
            referral_details: '',
        },
    })

    const referralSource = form.watch('referral_source')

    const onSubmit = async (values: CompleteProfileFormData) => {
        setLoading(true)
        try {
            const response = await api.post('/user/details', {
                first_name: values.first_name,
                last_name: values.last_name,
                role: values.role,
                phone_number: values.phone_number || undefined,
                referral_source: values.referral_source || undefined,
                referral_details: values.referral_details || undefined,
            })

            if (response.error) {
                toast.error(response.error)
                return
            }

            await initializeAuth()
            toast.success('Profile completed!')
            navigate('/create-organization')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex justify-center items-center min-h-screen bg-background">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-center">Hey, tell us about yourself</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="flex gap-4">
                                <FormField
                                    control={form.control}
                                    name="first_name"
                                    rules={{
                                        required: 'First name is required',
                                    }}
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormLabel>First Name *</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        {...field}
                                                        type="text"
                                                        placeholder="First name"
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
                                    name="last_name"
                                    rules={{
                                        required: 'Last name is required',
                                    }}
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormLabel>Last Name *</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        {...field}
                                                        type="text"
                                                        placeholder="Last name"
                                                        className="pl-10"
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="role"
                                rules={{
                                    required: 'Role is required',
                                }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Current Role *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <div className="flex items-center gap-2">
                                                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                                                        <SelectValue placeholder="Select your role" />
                                                    </div>
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {ROLE_OPTIONS.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {!isSelfHostedDeploy && (
                                <FormField
                                    control={form.control}
                                    name="phone_number"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phone Number</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        {...field}
                                                        type="tel"
                                                        placeholder="Phone number"
                                                        className="pl-10"
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <FormField
                                control={form.control}
                                name="referral_source"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>How did you hear about us?</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <div className="flex items-center gap-2">
                                                        <Users className="h-4 w-4 text-muted-foreground" />
                                                        <SelectValue placeholder="Select a source" />
                                                    </div>
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {REFERRAL_OPTIONS.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {referralSource === 'other' && (
                                <FormField
                                    control={form.control}
                                    name="referral_details"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Please specify</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="text"
                                                    placeholder="Tell us where you heard about us"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Saving...' : 'Continue'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}
