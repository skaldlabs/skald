import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { useOrganizationStore } from '@/stores/organizationStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

interface CreateOrganizationFormData {
    name: string
}

export const CreateOrganizationPage = () => {
    const initializeAuth = useAuthStore((state) => state.initializeAuth)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const pendingInvites = useOrganizationStore((state) => state.pendingInvites)
    const fetchPendingInvites = useOrganizationStore((state) => state.fetchPendingInvites)
    const acceptInvite = useOrganizationStore((state) => state.acceptInvite)
    const [showCreate, setShowCreate] = useState(false)

    const form = useForm<CreateOrganizationFormData>({
        defaultValues: {
            name: '',
        },
    })

    useEffect(() => {
        fetchPendingInvites()
    }, [fetchPendingInvites])

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

    const handleAcceptInvite = async (inviteId: string) => {
        await acceptInvite(inviteId)
        navigate('/')
    }

    return (
        <div className="flex justify-center items-center min-h-screen bg-background">
            <div className="w-full max-w-2xl px-4">
                {pendingInvites.length > 0 && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Pending Organization Invites</CardTitle>
                            <p className="text-muted-foreground">
                                You have been invited to join the following organizations. Click one to join and set it
                                as your default organization.
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {pendingInvites.map((invite) => (
                                    <div
                                        key={invite.id}
                                        className="flex items-center justify-between p-4 border rounded-lg"
                                    >
                                        <div>
                                            <h4 className="font-medium">{invite.organization_name}</h4>
                                        </div>
                                        <Button onClick={() => handleAcceptInvite(invite.id)}>Join Organization</Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {pendingInvites.length > 0 && !showCreate && (
                    <div className="mb-6 text-center">
                        <Button variant="link" onClick={() => setShowCreate(true)}>
                            Create a new organization instead
                        </Button>
                    </div>
                )}

                {(!pendingInvites.length || showCreate) && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-center">Create Your Organization</CardTitle>
                            <p className="text-center text-muted-foreground">
                                {pendingInvites.length > 0
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
                                                        <Input
                                                            {...field}
                                                            placeholder="Enter organization name"
                                                            className="pl-10"
                                                        />
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
                )}
            </div>
        </div>
    )
}
