import { useOrganizationStore } from '@/stores/organizationStore'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const PendingInvites = () => {
    const navigate = useNavigate()
    const pendingInvites = useOrganizationStore((state) => state.pendingInvites)
    const acceptInvite = useOrganizationStore((state) => state.acceptInvite)

    const handleAcceptInvite = async (inviteId: string) => {
        await acceptInvite(inviteId)
        navigate('/')
    }

    if (pendingInvites.length === 0) {
        return null
    }

    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle>Pending Organization Invites</CardTitle>
                <p className="text-muted-foreground">
                    You have been invited to join the following organizations. Click one to join and set it as your
                    default organization.
                </p>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {pendingInvites.map((invite) => (
                        <div key={invite.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                                <h4 className="font-medium">{invite.organization_name}</h4>
                            </div>
                            <Button onClick={() => handleAcceptInvite(invite.id)}>Join Organization</Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
