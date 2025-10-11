import { create } from 'zustand'
import { api } from '@/lib/api'
import { Team, useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'
// import * as Sentry from '@sentry/react'

interface OrganizationSettings {
    credential_openai_api_key: string | null
    credential_anthropic_api_key: string | null
    credential_voyage_api_key: string | null
    self_hosted_llm_chat_url: string | null
    self_hosted_llm_auth_headers: Record<string, string> | null
    self_hosted_embeddings_model_url: string | null
    self_hosted_embeddings_auth_headers: Record<string, string> | null
    writing_guidelines: string[] | null
    onboarded: boolean | null
}

interface OrganizationResponse extends OrganizationSettings {
    id: string
    name: string
}

interface OrganizationMember {
    email: string
    joined_at: string
    name: string
    role: string // role is the access level of the member
    position: string // position is the job/position the member holds at their company
    teams: Team[]
}

interface OrganizationInvite {
    id: string
    organization_id: string
    organization_name: string
}

export interface SentInvite {
    id: string
    email: string
    created_at: string
    invited_by_name: string
    invited_by_email: string
}

type OrganizationSettingValue = string | number | boolean | Record<string, string> | string[] | null

interface OrganizationState {
    credentials: OrganizationSettings
    members: OrganizationMember[]
    loading: boolean
    error: string | null
    pendingInvites: OrganizationInvite[]
    sentInvites: SentInvite[]
    fetchOrganizationSettings: () => Promise<void>
    updateOrganizationSetting: (field: keyof OrganizationSettings, value: OrganizationSettingValue) => Promise<void>
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
    credentials: {
        credential_openai_api_key: null,
        credential_anthropic_api_key: null,
        credential_voyage_api_key: null,
        self_hosted_llm_chat_url: null,
        self_hosted_llm_auth_headers: null,
        self_hosted_embeddings_model_url: null,
        self_hosted_embeddings_auth_headers: null,
        default_llm: null,
        llm_temperature: null,
        writing_guidelines: null,
        onboarded: true,
    },
    members: [],
    loading: false,
    error: null,
    pendingInvites: [],
    sentInvites: [],
    fetchOrganizationSettings: async () => {
        set({ loading: true, error: null })
        const organizationId = useAuthStore.getState().user?.current_organization_id
        const response = await api.get<OrganizationResponse>(`/organization/${organizationId}/`)

        if (response.error || !response.data) {
            // Sentry.captureException(new Error(`Failed to fetch credentials: ${response.error}`))
            set({ loading: false, error: response.error || 'Failed to fetch organization settings' })
            return
        }

        set({ credentials: response.data, loading: false, error: null })
    },
    updateOrganizationSetting: async (field: keyof OrganizationSettings, value: OrganizationSettingValue) => {
        const organizationId = useAuthStore.getState().user?.current_organization_id
        const response = await api.post(`/organization/${organizationId}/update_credential/`, {
            field,
            value,
        })

        if (response.error) {
            toast.error(`Failed to update credential: ${response.error}`)
            return
        }

        set((state) => ({
            credentials: {
                ...state.credentials,
                [field]: value,
            },
        }))
    },
    fetchMembers: async () => {
        const organizationId = useAuthStore.getState().user?.current_organization_id
        if (!organizationId) {
            return
        }

        set({ loading: true, error: null })

        const response = await api.get<OrganizationMember[]>(`/organization/${organizationId}/members/`)

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
        const organizationId = useAuthStore.getState().user?.current_organization_id
        if (!organizationId) {
            return
        }

        set({ loading: true, error: null })

        const response = await api.post(`/organization/${organizationId}/invite_member/`, {
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
        const organizationId = useAuthStore.getState().user?.current_organization_id
        if (!organizationId) {
            return
        }

        set({ loading: true, error: null })

        const response = await api.post(`/organization/${organizationId}/remove_member/`, {
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

        const response = await api.get<OrganizationInvite[]>('/organization/pending_invites/')

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

        const response = await api.post(`/organization/${organizationId}/accept_invite/`)

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
        const organizationId = useAuthStore.getState().user?.current_organization_id
        if (!organizationId) {
            return
        }

        set({ loading: true, error: null })

        const response = await api.get<SentInvite[]>(`/organization/${organizationId}/sent_invites/`)

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
        const organizationId = useAuthStore.getState().user?.current_organization_id
        if (!organizationId) {
            return
        }

        set({ loading: true, error: null })

        const response = await api.post(`/organization/${organizationId}/cancel_invite/`, {
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
        const organizationId = useAuthStore.getState().user?.current_organization_id
        if (!organizationId) {
            return
        }

        set({ loading: true, error: null })

        const response = await api.post(`/organization/${organizationId}/resend_invite/`, {
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
