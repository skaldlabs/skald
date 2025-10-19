import { create } from 'zustand'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'

export interface Plan {
    uuid: string
    slug: string
    name: string
    stripe_price_id: string | null
    monthly_price: string
    memo_operations_limit: number | null
    chat_queries_limit: number | null
    projects_limit: number | null
    features: Record<string, unknown>
    is_default: boolean
}

export interface Subscription {
    uuid: string
    organization: string
    plan: Plan
    stripe_customer_id: string | null
    stripe_subscription_id: string | null
    status: 'active' | 'canceled' | 'past_due' | 'trialing'
    current_period_start: string
    current_period_end: string
    cancel_at_period_end: boolean
}

export interface UsageData {
    billing_period_start: string
    billing_period_end: string
    usage: {
        memo_operations: {
            count: number
            limit: number | null
            percentage: number
        }
        chat_queries: {
            count: number
            limit: number | null
            percentage: number
        }
        projects: {
            count: number
            limit: number | null
            percentage: number
        }
    }
}

interface SubscriptionState {
    plans: Plan[]
    currentSubscription: Subscription | null
    usage: UsageData | null
    loading: boolean
    error: string | null
    checkoutLoading: boolean

    // Actions
    fetchPlans: () => Promise<void>
    fetchSubscription: () => Promise<void>
    fetchUsage: () => Promise<void>
    createCheckoutSession: (planSlug: string) => Promise<void>
    openCustomerPortal: () => Promise<void>
    refreshAll: () => Promise<void>
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
    plans: [],
    currentSubscription: null,
    usage: null,
    loading: false,
    error: null,
    checkoutLoading: false,

    fetchPlans: async () => {
        set({ loading: true, error: null })

        const response = await api.get<Plan[]>('/plans/')

        if (response.error || !response.data) {
            set({
                loading: false,
                error: response.error || 'Failed to fetch plans',
            })
            return
        }

        set({
            plans: response.data,
            loading: false,
            error: null,
        })
    },

    fetchSubscription: async () => {
        const organizationId = useAuthStore.getState().user?.current_organization_uuid
        if (!organizationId) {
            return
        }

        set({ loading: true, error: null })

        const response = await api.get<Subscription>(`/organization/${organizationId}/subscription/subscription/`)

        if (response.error || !response.data) {
            set({
                loading: false,
                error: response.error || 'Failed to fetch subscription',
            })
            return
        }

        set({
            currentSubscription: response.data,
            loading: false,
            error: null,
        })
    },

    fetchUsage: async () => {
        const organizationId = useAuthStore.getState().user?.current_organization_uuid
        if (!organizationId) {
            return
        }

        set({ loading: true, error: null })

        const response = await api.get<UsageData>(`/organization/${organizationId}/subscription/usage/`)

        if (response.error || !response.data) {
            set({
                loading: false,
                error: response.error || 'Failed to fetch usage',
            })
            return
        }

        set({
            usage: response.data,
            loading: false,
            error: null,
        })
    },

    createCheckoutSession: async (planSlug: string) => {
        const organizationId = useAuthStore.getState().user?.current_organization_uuid
        if (!organizationId) {
            toast.error('Organization not found')
            return
        }

        set({ checkoutLoading: true, error: null })

        const successUrl = `${window.location.origin}/organization/subscription?success=true`
        const cancelUrl = `${window.location.origin}/organization/subscription?canceled=true`

        const response = await api.post<{ url: string }>(`/organization/${organizationId}/subscription/checkout/`, {
            plan_slug: planSlug,
            success_url: successUrl,
            cancel_url: cancelUrl,
        })

        if (response.error || !response.data) {
            set({
                checkoutLoading: false,
                error: response.error || 'Failed to create checkout session',
            })
            toast.error('Failed to start checkout')
            return
        }

        // Redirect to Stripe Checkout
        window.location.href = response.data.url
    },

    openCustomerPortal: async () => {
        const organizationId = useAuthStore.getState().user?.current_organization_uuid
        if (!organizationId) {
            toast.error('Organization not found')
            return
        }

        set({ loading: true, error: null })

        const returnUrl = `${window.location.origin}/organization/subscription`

        const response = await api.post<{ url: string }>(`/organization/${organizationId}/subscription/portal/`, {
            return_url: returnUrl,
        })

        if (response.error || !response.data) {
            set({
                loading: false,
                error: response.error || 'Failed to open customer portal',
            })
            toast.error('Failed to open billing portal')
            return
        }

        // Redirect to Stripe Customer Portal
        window.location.href = response.data.url
    },

    refreshAll: async () => {
        await Promise.all([get().fetchPlans(), get().fetchSubscription(), get().fetchUsage()])
    },
}))
