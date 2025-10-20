import { create } from 'zustand'
import { api, getOrgPath } from '@/lib/api'
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
    scheduled_plan: Plan | null
    scheduled_change_date: string | null
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
    changePlan: (planSlug: string) => Promise<void>
    cancelScheduledChange: () => Promise<void>
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
        set({ loading: true, error: null })

        try {
            const orgPath = getOrgPath()
            const response = await api.get<Subscription>(`${orgPath}/subscription/subscription/`)

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
        } catch (error) {
            set({
                loading: false,
                error: String(error),
            })
        }
    },

    fetchUsage: async () => {
        set({ loading: true, error: null })

        try {
            const orgPath = getOrgPath()
            const response = await api.get<UsageData>(`${orgPath}/subscription/usage/`)

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
        } catch (error) {
            set({
                loading: false,
                error: String(error),
            })
        }
    },

    createCheckoutSession: async (planSlug: string) => {
        set({ checkoutLoading: true, error: null })

        try {
            const orgPath = getOrgPath()
            const successUrl = `${window.location.origin}/organization/subscription?success=true`
            const cancelUrl = `${window.location.origin}/organization/subscription?canceled=true`

            const response = await api.post<{ checkout_url: string }>(`${orgPath}/subscription/checkout/`, {
                plan_slug: planSlug,
                success_url: successUrl,
                cancel_url: cancelUrl,
            })

            if (response.error || !response.data) {
                set({
                    checkoutLoading: false,
                    error: response.error || 'Failed to create checkout session',
                })
                toast.error(response.error || 'Failed to start checkout')
                return
            }

            // Redirect to Stripe Checkout
            window.location.href = response.data.checkout_url
        } catch (error) {
            set({
                checkoutLoading: false,
                error: String(error),
            })
            toast.error('Failed to start checkout')
        }
    },

    changePlan: async (planSlug: string) => {
        set({ checkoutLoading: true, error: null })

        try {
            const orgPath = getOrgPath()

            const response = await api.post<{ status: string; subscription: Subscription }>(
                `${orgPath}/subscription/change_plan/`,
                {
                    plan_slug: planSlug,
                }
            )

            if (response.error || !response.data) {
                set({
                    checkoutLoading: false,
                    error: response.error || 'Failed to change plan',
                })
                toast.error(response.error || 'Failed to change plan')
                return
            }

            // Update local subscription state
            set({
                currentSubscription: response.data.subscription,
                checkoutLoading: false,
                error: null,
            })

            // Show appropriate message based on whether it's scheduled or immediate
            if (response.data.subscription.scheduled_plan) {
                toast.success('Plan change scheduled successfully!')
            } else {
                toast.success('Plan changed successfully!')
            }

            // Refresh usage to get updated limits
            await get().fetchUsage()
        } catch (error) {
            set({
                checkoutLoading: false,
                error: String(error),
            })
            toast.error('Failed to change plan')
        }
    },

    cancelScheduledChange: async () => {
        set({ checkoutLoading: true, error: null })

        try {
            const orgPath = getOrgPath()

            const response = await api.post<{ status: string; subscription: Subscription }>(
                `${orgPath}/subscription/cancel_scheduled_change/`,
                {}
            )

            if (response.error || !response.data) {
                set({
                    checkoutLoading: false,
                    error: response.error || 'Failed to cancel scheduled change',
                })
                toast.error(response.error || 'Failed to cancel scheduled change')
                return
            }

            // Update local subscription state
            set({
                currentSubscription: response.data.subscription,
                checkoutLoading: false,
                error: null,
            })

            toast.success('Scheduled plan change canceled')
        } catch (error) {
            set({
                checkoutLoading: false,
                error: String(error),
            })
            toast.error('Failed to cancel scheduled change')
        }
    },

    openCustomerPortal: async () => {
        set({ loading: true, error: null })

        try {
            const orgPath = getOrgPath()
            const returnUrl = `${window.location.origin}/organization/subscription`

            const response = await api.post<{ portal_url: string }>(`${orgPath}/subscription/portal/`, {
                return_url: returnUrl,
            })

            if (response.error || !response.data) {
                set({
                    loading: false,
                    error: response.error || 'Failed to open customer portal',
                })
                toast.error(response.error || 'Failed to open billing portal')
                return
            }

            // Redirect to Stripe Customer Portal
            window.location.href = response.data.portal_url
        } catch (error) {
            set({
                loading: false,
                error: String(error),
            })
            toast.error('Failed to open billing portal')
        }
    },

    refreshAll: async () => {
        await Promise.all([get().fetchPlans(), get().fetchSubscription(), get().fetchUsage()])
    },
}))
