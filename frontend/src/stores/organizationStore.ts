import { create } from 'zustand'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'
// import * as Sentry from '@sentry/react'

interface OrganizationMember {
    email: string
    joined_at: string
    name: string
    role: string // role is the access level of the member
    position: string // position is the job/position the member holds at their company
}

interface OrganizationInvite {
    id: string
    organization_uuid: string
    organization_name: string
}

export interface SentInvite {
    id: string
    email: string
    created_at: string
    invited_by_name: string
    invited_by_email: string
}

interface OrganizationState {
    members: OrganizationMember[]
    loading: boolean
    error: string | null
    pendingInvites: OrganizationInvite[]
    sentInvites: SentInvite[]
    fetchMembers: () => Promise<void>
    inviteMember: (email: string) => Promise<void>
    removeMember: (email: string) => Promise<void>
    fetchPendingInvites: () => Promise<void>
    acceptInvite: (organizationId: string) => Promise<void>
    fetchSentInvites: () => Promise<void>
    cancelInvite: (inviteId: string) => Promise<void>
    resendInvite: (inviteId: string) => Promise<void>
}

export const useOrganizationStore = create<OrganizationState>((set) => ({
    members: [],
    loading: false,
    error: null,
    pendingInvites: [],
    sentInvites: [],
    fetchMembers: async () => {
        const organizationId = useAuthStore.getState().user?.current_organization_uuid
        if (!organizationId) {
            return
        }

        set({ loading: true, error: null })

        const response = await api.get<OrganizationMember[]>(`/organizations/${organizationId}/members/`)

        if (response.error || !response.data) {
            set({
                loading: false,
                error: response.error || 'Failed to fetch organization members',
            })
            return
        }

        set({
            members: response.data,
            loading: false,
            error: null,
        })
    },
    inviteMember: async (email: string) => {
        const organizationId = useAuthStore.getState().user?.current_organization_uuid
        if (!organizationId) {
            return
        }

        set({ loading: true, error: null })

        const response = await api.post(`/organizations/${organizationId}/invite_member/`, {
            email,
        })

        if (response.error) {
            set({
                loading: false,
                error: response.error,
            })
            toast.error(`Failed to invite member: ${response.error}`)
            return
        }

        set({ loading: false, error: null })
        toast.success('Invitation sent successfully')
    },
    removeMember: async (email: string) => {
        const organizationId = useAuthStore.getState().user?.current_organization_uuid
        if (!organizationId) {
            return
        }

        set({ loading: true, error: null })

        const response = await api.post(`/organizations/${organizationId}/remove_member/`, {
            email,
        })

        if (response.error) {
            set({
                loading: false,
                error: response.error,
            })
            toast.error(`Failed to remove member: ${response.error}`)
            return
        }

        set({ loading: false, error: null })
        toast.success('Member removed successfully')
    },
    fetchPendingInvites: async () => {
        set({ loading: true, error: null })

        const response = await api.get<OrganizationInvite[]>('/organizations/pending_invites/')

        if (response.error || !response.data) {
            set({
                loading: false,
                error: response.error || 'Failed to fetch pending invites',
            })
            return
        }

        set({
            pendingInvites: response.data,
            loading: false,
            error: null,
        })
    },
    acceptInvite: async (organizationId: string) => {
        set({ loading: true, error: null })

        const response = await api.post(`/organizations/${organizationId}/accept_invite/`)

        if (response.error) {
            set({
                loading: false,
                error: response.error,
            })
            toast.error(`Failed to accept invite: ${response.error}`)
            return
        }

        set({ loading: false, error: null })
        toast.success('Organization invite accepted')

        // refresh auth to update default organization
        await useAuthStore.getState().initializeAuth()
    },
    fetchSentInvites: async () => {
        const organizationId = useAuthStore.getState().user?.current_organization_uuid
        if (!organizationId) {
            return
        }

        set({ loading: true, error: null })

        const response = await api.get<SentInvite[]>(`/organizations/${organizationId}/sent_invites/`)

        if (response.error || !response.data) {
            set({
                loading: false,
                error: response.error || 'Failed to fetch sent invites',
            })
            return
        }

        set({
            sentInvites: response.data,
            loading: false,
            error: null,
        })
    },
    cancelInvite: async (inviteId: string) => {
        const organizationId = useAuthStore.getState().user?.current_organization_uuid
        if (!organizationId) {
            return
        }

        set({ loading: true, error: null })

        const response = await api.post(`/organizations/${organizationId}/cancel_invite/`, {
            invite_id: inviteId,
        })

        if (response.error) {
            set({
                loading: false,
                error: response.error,
            })
            toast.error(`Failed to cancel invite: ${response.error}`)
            return
        }

        set({ loading: false, error: null })
        toast.success('Invite cancelled successfully')
    },
    resendInvite: async (inviteId: string) => {
        const organizationId = useAuthStore.getState().user?.current_organization_uuid
        if (!organizationId) {
            return
        }

        set({ loading: true, error: null })

        const response = await api.post(`/organizations/${organizationId}/resend_invite/`, {
            invite_id: inviteId,
        })

        if (response.error) {
            set({
                loading: false,
                error: response.error,
            })
            toast.error(`Failed to resend invite: ${response.error}`)
            return
        }

        set({ loading: false, error: null })
        toast.success('Invitation resent successfully')
    },
}))
