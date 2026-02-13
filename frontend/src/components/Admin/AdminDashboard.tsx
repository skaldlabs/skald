import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserCheck, Search } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

interface UserListItem {
    id: string
    email: string
    name: string | null
    is_superuser: boolean
    is_active: boolean
    date_joined: string
}

interface UsersResponse {
    users: UserListItem[]
}

interface AdminPlan {
    id: string
    slug: string
    name: string
    monthly_price: string
    memo_operations_limit: number | null
    chat_queries_limit: number | null
    memo_operation_overage_price: string | null
    chat_query_overage_price: string | null
    is_active: boolean
}

interface PlansResponse {
    plans: AdminPlan[]
}

const OveragePricingManager = () => {
    const [plans, setPlans] = useState<AdminPlan[]>([])
    const [loading, setLoading] = useState(true)
    const [editingPrices, setEditingPrices] = useState<Record<string, { memo: string; chat: string }>>({})
    const [savingPlanId, setSavingPlanId] = useState<string | null>(null)

    useEffect(() => {
        fetchPlans()
    }, [])

    const fetchPlans = async () => {
        setLoading(true)
        const response = await api.get<PlansResponse>('/admin/plans/')
        if (response.error || !response.data) {
            toast.error(`Failed to fetch plans: ${response.error}`)
            setLoading(false)
            return
        }
        setPlans(response.data.plans)
        const prices: Record<string, { memo: string; chat: string }> = {}
        for (const plan of response.data.plans) {
            prices[plan.id] = {
                memo: plan.memo_operation_overage_price || '',
                chat: plan.chat_query_overage_price || '',
            }
        }
        setEditingPrices(prices)
        setLoading(false)
    }

    const handleSave = async (planId: string) => {
        const prices = editingPrices[planId]
        if (!prices) return

        setSavingPlanId(planId)
        const response = await api.patch(`/admin/plans/${planId}/overage-pricing`, {
            memo_operation_overage_price: prices.memo === '' ? null : prices.memo,
            chat_query_overage_price: prices.chat === '' ? null : prices.chat,
        })

        if (response.error) {
            toast.error(`Failed to update pricing: ${response.error}`)
        } else {
            toast.success('Overage pricing updated')
            await fetchPlans()
        }
        setSavingPlanId(null)
    }

    if (loading) {
        return (
            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>Overage Pricing</CardTitle>
                    <CardDescription>Loading plans...</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card className="mt-4">
            <CardHeader>
                <CardTitle>Overage Pricing</CardTitle>
                <CardDescription>Configure per-operation overage prices for each plan</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Plan</TableHead>
                            <TableHead>Memo Op Price (USD)</TableHead>
                            <TableHead>Chat Query Price (USD)</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {plans
                            .filter((p) => p.slug !== 'free')
                            .map((plan) => (
                                <TableRow key={plan.id}>
                                    <TableCell className="font-medium">{plan.name}</TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.0001"
                                            placeholder="0.0020"
                                            value={editingPrices[plan.id]?.memo ?? ''}
                                            onChange={(e) =>
                                                setEditingPrices((prev) => ({
                                                    ...prev,
                                                    [plan.id]: { ...prev[plan.id], memo: e.target.value },
                                                }))
                                            }
                                            className="w-32"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.0001"
                                            placeholder="0.0300"
                                            value={editingPrices[plan.id]?.chat ?? ''}
                                            onChange={(e) =>
                                                setEditingPrices((prev) => ({
                                                    ...prev,
                                                    [plan.id]: { ...prev[plan.id], chat: e.target.value },
                                                }))
                                            }
                                            className="w-32"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleSave(plan.id)}
                                            disabled={savingPlanId === plan.id}
                                        >
                                            {savingPlanId === plan.id ? 'Saving...' : 'Save'}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

export const AdminDashboard = () => {
    const [users, setUsers] = useState<UserListItem[]>([])
    const [loading, setLoading] = useState(true)
    const [impersonating, setImpersonating] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const { user: currentUser } = useAuthStore()

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        setLoading(true)
        const response = await api.get<UsersResponse>('/admin/users/')
        if (response.error || !response.data) {
            toast.error(`Failed to fetch users: ${response.error}`)
            setLoading(false)
            return
        }
        setUsers(response.data.users)
        setLoading(false)
    }

    const handleImpersonate = async (userId: string) => {
        setImpersonating(userId)
        const response = await api.post(`/admin/impersonate/${userId}/`)
        if (response.error) {
            toast.error(`Failed to impersonate user: ${response.error}`)
            setImpersonating(null)
            return
        }
        toast.success('Impersonation successful. Reloading...')
        setTimeout(() => {
            window.location.href = '/'
        }, 1000)
    }

    // Filter out current user and apply search
    const filteredUsers = users
        .filter((user) => user.email !== currentUser?.email)
        .filter((user) => {
            if (!searchQuery) return true
            const query = searchQuery.toLowerCase()
            return user.email.toLowerCase().includes(query) || user.name?.toLowerCase().includes(query)
        })

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Impersonat users</CardTitle>
                    <CardDescription>Loading users...</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <>
            <OveragePricingManager />

            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>Impersonate users</CardTitle>
                    <CardDescription>Log in as another user for debugging purposes</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by email or name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Superuser</TableHead>
                                <TableHead>Active</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.email}</TableCell>
                                    <TableCell>{user.name || '-'}</TableCell>
                                    <TableCell>{user.is_superuser ? 'Yes' : 'No'}</TableCell>
                                    <TableCell>{user.is_active ? 'Yes' : 'No'}</TableCell>
                                    <TableCell>{new Date(user.date_joined).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleImpersonate(user.id)}
                                            disabled={impersonating === user.id}
                                        >
                                            <UserCheck className="h-4 w-4 mr-2" />
                                            {impersonating === user.id ? 'Impersonating...' : 'Impersonate'}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    )
}
