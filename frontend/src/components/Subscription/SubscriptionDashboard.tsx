import { useEffect } from 'react'
import { useSubscriptionStore } from '@/stores/subscriptionStore'
import { UsageDashboard } from './UsageDashboard'
import { ScheduledPlanChangeAlert } from '@/components/Subscription/ScheduledPlanChangeAlert'
import { CurrentSubscriptionCard } from '@/components/Subscription/CurrentSubscriptionCard'
import { AvailablePlansSection } from '@/components/Subscription/AvailablePlansSection'
import { toast } from 'sonner'
import { useSearchParams } from 'react-router-dom'

export const SubscriptionDashboard = () => {
    const plans = useSubscriptionStore((state) => state.plans)
    const currentSubscription = useSubscriptionStore((state) => state.currentSubscription)
    const usage = useSubscriptionStore((state) => state.usage)
    const loading = useSubscriptionStore((state) => state.loading)
    const checkoutLoading = useSubscriptionStore((state) => state.checkoutLoading)
    const fetchPlans = useSubscriptionStore((state) => state.fetchPlans)
    const fetchSubscription = useSubscriptionStore((state) => state.fetchSubscription)
    const fetchUsage = useSubscriptionStore((state) => state.fetchUsage)
    const upgrade = useSubscriptionStore((state) => state.upgrade)
    const changePlan = useSubscriptionStore((state) => state.changePlan)
    const cancelScheduledChange = useSubscriptionStore((state) => state.cancelScheduledChange)
    const openCustomerPortal = useSubscriptionStore((state) => state.openCustomerPortal)

    const [searchParams] = useSearchParams()

    useEffect(() => {
        fetchPlans()
        fetchSubscription()
        fetchUsage()
    }, []) // eslint-disable-line

    useEffect(() => {
        const success = searchParams.get('success')
        const canceled = searchParams.get('canceled')

        if (success === 'true') {
            toast.success('Subscription updated successfully!')
            fetchSubscription()
            fetchUsage()
        }

        if (canceled === 'true') {
            toast.info('Checkout canceled')
        }
    }, [searchParams, fetchSubscription, fetchUsage])

    const handleSelectPlan = async (planSlug: string) => {
        const hasActivePaidSubscription =
            currentSubscription?.stripe_subscription_id &&
            currentSubscription?.plan.monthly_price &&
            parseFloat(currentSubscription.plan.monthly_price) > 0

        if (planSlug === 'free') {
            if (!currentSubscription?.stripe_customer_id) {
                toast.info('You are already on the free plan')
                return
            }
            await openCustomerPortal()
        } else if (hasActivePaidSubscription) {
            await changePlan(planSlug)
        } else {
            // Free to paid upgrade: try saved payment method first, fallback to checkout
            await upgrade(planSlug)
        }
    }

    const handleCancelScheduledChange = async () => {
        await cancelScheduledChange()
    }

    return (
        <div className="space-y-6 mt-6">
            {currentSubscription?.scheduled_plan && currentSubscription?.scheduled_change_date && (
                <ScheduledPlanChangeAlert
                    scheduledPlanName={currentSubscription.scheduled_plan.name}
                    scheduledChangeDate={currentSubscription.scheduled_change_date}
                    onCancelChange={handleCancelScheduledChange}
                    loading={checkoutLoading}
                />
            )}

            <div className="flex flex-col md:flex-row gap-6 mt-4">
                {currentSubscription && (
                    <CurrentSubscriptionCard
                        subscription={currentSubscription}
                        onManageBilling={openCustomerPortal}
                        loading={loading}
                    />
                )}

                <div className="flex-1">
                    <UsageDashboard usage={usage} loading={loading} />
                </div>
            </div>

            <AvailablePlansSection
                plans={plans}
                currentPlanSlug={currentSubscription?.plan.slug}
                currentPlanPrice={currentSubscription?.plan.monthly_price}
                scheduledPlanSlug={currentSubscription?.scheduled_plan?.slug}
                onSelectPlan={handleSelectPlan}
                loading={checkoutLoading}
            />
        </div>
    )
}
