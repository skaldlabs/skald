import { useState, useEffect } from 'react'
import { useOrganizationStore } from '@/stores/organizationStore'
import { Button } from '@/components/ui/button'
import { PendingInvites } from '@/components/PendingInvites/PendingInvites'
import { CreateOrganizationForm } from '@/components/CreateOrganizationForm/CreateOrganizationForm'

export const CreateOrganizationPage = () => {
    const pendingInvites = useOrganizationStore((state) => state.pendingInvites)
    const fetchPendingInvites = useOrganizationStore((state) => state.fetchPendingInvites)
    const [showCreate, setShowCreate] = useState(false)

    useEffect(() => {
        fetchPendingInvites()
    }, [fetchPendingInvites])

    return (
        <div className="flex justify-center items-center min-h-screen bg-background">
            <div className="w-full max-w-2xl px-4">
                <PendingInvites />

                {pendingInvites.length > 0 && !showCreate && (
                    <div className="mb-6 text-center">
                        <Button variant="link" onClick={() => setShowCreate(true)}>
                            Create a new organization instead
                        </Button>
                    </div>
                )}

                {(!pendingInvites.length || showCreate) && (
                    <CreateOrganizationForm hasPendingInvites={pendingInvites.length > 0} />
                )}
            </div>
        </div>
    )
}
