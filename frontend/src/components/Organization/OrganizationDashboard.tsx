import { OrganizationMembers } from '@/components/Organization/OrganizationMembers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export const OrganizationDashboard = () => {
    const navigate = useNavigate()

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Manage your organization settings</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => navigate('/organization/subscription')} className="gap-2">
                        <CreditCard className="h-4 w-4" />
                        Subscription & Billing
                    </Button>
                </CardContent>
            </Card>
            <OrganizationMembers />
        </div>
    )
}
