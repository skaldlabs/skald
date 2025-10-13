import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Users } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

interface CreateOrganizationFormData {
    name: string
}

interface CreateOrganizationFormProps {
    hasPendingInvites: boolean
}

export const CreateOrganizationForm = ({ hasPendingInvites }: CreateOrganizationFormProps) => {
    const [loading, setLoading] = useState(false)
    const initializeAuth = useAuthStore((state) => state.initializeAuth)

    const form = useForm<CreateOrganizationFormData>({
        defaultValues: {
            name: '',
        },
    })

    const onSubmit = async (values: CreateOrganizationFormData) => {
        setLoading(true)
        const response = await api.post('/organization', {
            name: values.name,
        })
        if (!response.error) {
            toast.success('Organization created successfully!')
            await initializeAuth()
        } else {
            toast.error('Failed to create organization. Please try again.')
        }
        setLoading(false)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-center">Create Your Organization</CardTitle>
                <p className="text-center text-muted-foreground">
                    {hasPendingInvites
                        ? 'Or create a new organization to get started with Skald'
                        : 'Create an organization to get started with Skald'}
                </p>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            rules={{
                                required: 'Organization name is required',
                                minLength: {
                                    value: 2,
                                    message: 'Organization name must be at least 2 characters',
                                },
                            }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Organization Name</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input {...field} placeholder="Enter organization name" className="pl-10" />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Organization'}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
