import { useEffect, useState } from 'react'
import { UserCheck, X, MailPlus } from 'lucide-react'
import { useOrganizationStore, SentInvite } from '@/stores/organizationStore'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { humanFriendlyRelativeDate } from '@/components/utils/dateUtils'

interface OrganizationInvitesListProps {
    onInvitesChange?: () => void
}

export const OrganizationInvitesList = ({ onInvitesChange }: OrganizationInvitesListProps) => {
    const sentInvites = useOrganizationStore((state) => state.sentInvites)
    const loading = useOrganizationStore((state) => state.loading)
    const error = useOrganizationStore((state) => state.error)
    const fetchSentInvites = useOrganizationStore((state) => state.fetchSentInvites)
    const cancelInvite = useOrganizationStore((state) => state.cancelInvite)
    const resendInvite = useOrganizationStore((state) => state.resendInvite)

    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
    const [inviteToCancel, setInviteToCancel] = useState<SentInvite | null>(null)

    useEffect(() => {
        fetchSentInvites()
    }, [fetchSentInvites])

    useEffect(() => {
        if (error) {
            toast.error(error)
        }
    }, [error])

    const openCancelModal = (invite: SentInvite) => {
        setInviteToCancel(invite)
        setIsCancelModalOpen(true)
    }

    const handleCancelInvite = async () => {
        if (!inviteToCancel) return

        try {
            await cancelInvite(inviteToCancel.id)
            setIsCancelModalOpen(false)
            setInviteToCancel(null)
            await fetchSentInvites()
            onInvitesChange?.()
        } catch {
            toast.error('Failed to cancel invite')
        }
    }

    const handleResendInvite = async (inviteId: string) => {
        try {
            await resendInvite(inviteId)
            toast.success('Invitation email resent')
        } catch {
            toast.error('Failed to resend invite')
        }
    }

    if (!loading && sentInvites.length === 0) {
        return null
    }

    return (
        <>
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <UserCheck className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Pending Invitations</h3>
                </div>
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead>Invited By</TableHead>
                                <TableHead>Sent</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sentInvites.map((invite) => (
                                <TableRow key={invite.id}>
                                    <TableCell className="font-medium">{invite.email}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm">{invite.invited_by_name}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {invite.invited_by_email}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{humanFriendlyRelativeDate(invite.created_at)}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleResendInvite(invite.id)}
                                                disabled={loading}
                                            >
                                                <MailPlus className="h-4 w-4 mr-1" />
                                                Resend
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openCancelModal(invite)}
                                                disabled={loading}
                                                className="text-destructive hover:text-destructive border-destructive/20 hover:border-destructive"
                                            >
                                                <X className="h-4 w-4 mr-1" />
                                                Cancel
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Invitation</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to cancel the invitation for {inviteToCancel?.email}? They will no
                            longer be able to join the organization using this invitation.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsCancelModalOpen(false)}>
                            Keep Invitation
                        </Button>
                        <Button type="button" variant="destructive" onClick={handleCancelInvite} disabled={loading}>
                            {loading ? 'Cancelling...' : 'Cancel Invitation'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
