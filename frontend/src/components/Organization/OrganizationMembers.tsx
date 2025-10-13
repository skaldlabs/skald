import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Users, UserPlus, UserCog, UserMinus } from 'lucide-react'
import { useOrganizationStore } from '@/stores/organizationStore'

import { OrganizationAccessLevel, useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form'
import { Badge } from '@/components/ui/badge'
import { OrganizationInvitesList } from './OrganizationInvitesList'
import { Separator } from '@/components/ui/separator'

export const OrganizationMembers = () => {
    const user = useAuthStore((state) => state.user)
    const members = useOrganizationStore((state) => state.members)
    const sentInvites = useOrganizationStore((state) => state.sentInvites)
    const loading = useOrganizationStore((state) => state.loading)
    const error = useOrganizationStore((state) => state.error)
    const fetchMembers = useOrganizationStore((state) => state.fetchMembers)
    const inviteMember = useOrganizationStore((state) => state.inviteMember)
    const removeMember = useOrganizationStore((state) => state.removeMember)

    const fetchSentInvites = useOrganizationStore((state) => state.fetchSentInvites)

    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
    const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false)
    const [memberToRemove, setMemberToRemove] = useState<{ email: string; name: string } | null>(null)

    useEffect(() => {
        fetchMembers()
    }, [fetchMembers])

    useEffect(() => {
        if (error) {
            toast.error(error)
        }
    }, [error])

    const inviteForm = useForm({
        defaultValues: {
            email: '',
        },
    })

    const handleInvite = async (values: { email: string }) => {
        try {
            await inviteMember(values.email)
            setIsInviteModalOpen(false)
            inviteForm.reset()
            toast.success('Invitation sent successfully')
            await fetchSentInvites()
        } catch {
            toast.error('Failed to send invitation')
        }
    }

    const openRemoveModal = (member: { email: string; name: string }) => {
        setMemberToRemove(member)
        setIsRemoveModalOpen(true)
    }

    const handleRemoveMember = async () => {
        if (!memberToRemove) return

        try {
            await removeMember(memberToRemove.email)
            setIsRemoveModalOpen(false)
            setMemberToRemove(null)
            await fetchMembers()
        } catch {
            toast.error('Failed to remove member')
        }
    }

    const isOrganizationOwner =
        user?.access_levels?.organization_access_levels?.[user?.current_organization_uuid] ===
        OrganizationAccessLevel.OWNER

    const canRemoveMember = (member: { email: string; role: string }) => {
        if (!isOrganizationOwner) return false
        if (member.email === user?.email) return false
        if (member.role === 'OWNER') return false
        return true
    }

    return (
        <div>
            <Card className="mt-4">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            <CardTitle>Organization Members</CardTitle>
                        </div>
                        <Button onClick={() => setIsInviteModalOpen(true)}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Invite Member
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members.map((member) => (
                                    <TableRow key={member.email}>
                                        <TableCell>{member.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{member.role}</Badge>
                                        </TableCell>
                                        <TableCell>{new Date(member.joined_at).toLocaleDateString()}</TableCell>

                                        <TableCell>
                                            <div className="flex gap-2">
                                                {canRemoveMember(member) && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openRemoveModal(member)}
                                                        className="text-destructive hover:text-destructive border-destructive/20 hover:border-destructive"
                                                    >
                                                        <UserMinus className="h-4 w-4 mr-1" />
                                                        Remove
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}

                    {sentInvites.length > 0 && <Separator className="my-8" />}

                    <OrganizationInvitesList />
                </CardContent>

                <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Invite New Member</DialogTitle>
                            <DialogDescription>Send an invitation to join your organization.</DialogDescription>
                        </DialogHeader>
                        <Form {...inviteForm}>
                            <form onSubmit={inviteForm.handleSubmit(handleInvite)} className="space-y-4">
                                <FormField
                                    control={inviteForm.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email Address</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />

                                            <DialogFooter>
                                                <Button type="submit">Send Invitation</Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setIsInviteModalOpen(false)}
                                                >
                                                    Cancel
                                                </Button>
                                            </DialogFooter>
                                        </FormItem>
                                    )}
                                />
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>

                <Dialog open={isRemoveModalOpen} onOpenChange={setIsRemoveModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Remove Member</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to remove {memberToRemove?.name} ({memberToRemove?.email}) from
                                this organization? This action cannot be undone and they will lose access to all
                                organization resources.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsRemoveModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="button" variant="destructive" onClick={handleRemoveMember} disabled={loading}>
                                {loading ? 'Removing...' : 'Remove Member'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </Card>
        </div>
    )
}
