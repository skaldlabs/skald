import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { UserCheck } from 'lucide-react'

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

export const AdminDashboard = () => {
    const [users, setUsers] = useState<UserListItem[]>([])
    const [loading, setLoading] = useState(true)
    const [impersonating, setImpersonating] = useState<string | null>(null)

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

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Admin Dashboard</CardTitle>
                    <CardDescription>Loading users...</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Admin Dashboard</CardTitle>
                <CardDescription>Manage and impersonate users</CardDescription>
            </CardHeader>
            <CardContent>
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
                        {users.map((user) => (
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
    )
}
