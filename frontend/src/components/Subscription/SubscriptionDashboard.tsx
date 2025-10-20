import { useEffect } from 'react'
import { useSubscriptionStore } from '@/stores/subscriptionStore'
import { PricingCard } from './PricingCard'
import { UsageDashboard } from './UsageDashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CalendarClock, X } from 'lucide-react'
import { toast } from 'sonner'
import { useSearchParams } from 'react-router-dom'
import { formatDate } from '@/components/utils/dateUtils'

export const SubscriptionDashboard = () => {
    const {
        plans,
        currentSubscription,
        usage,
        loading,
        checkoutLoading,
        fetchPlans,
        fetchSubscription,
        fetchUsage,
        createCheckoutSession,
        changePlan,
        cancelScheduledChange,
        openCustomerPortal,
    } = useSubscriptionStore()

    const [searchParams] = useSearchParams()

    useEffect(() => {
        fetchPlans()
        fetchSubscription()
        fetchUsage()
    }, [])

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
    }, [searchParams])

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
            await createCheckoutSession(planSlug)
        }
    }

    const handleCancelScheduledChange = async () => {
        await cancelScheduledChange()
    }

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'active':
                return 'default'
            case 'trialing':
                return 'secondary'
            case 'past_due':
            case 'canceled':
                return 'destructive'
            default:
                return 'outline'
        }
    }

    return (
        <div className="space-y-6 mt-6">
            {/* Scheduled Plan Change Notice */}
            {currentSubscription?.scheduled_plan && currentSubscription?.scheduled_change_date && (
                <Alert className="bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-100">
                    <CalendarClock className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
                    <AlertTitle>Scheduled Plan Change</AlertTitle>
                    <AlertDescription>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p>
                                    Your plan will change to <strong>{currentSubscription.scheduled_plan.name}</strong>{' '}
                                    on <strong>{formatDate(currentSubscription.scheduled_change_date)}</strong>.
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    You can cancel this scheduled change at any time before it takes effect.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCancelScheduledChange}
                                disabled={checkoutLoading}
                            >
                                <X className="h-4 w-4 mr-1" />
                                Cancel Change
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            <div className="flex flex-col md:flex-row gap-6 mt-4">
                {/* Current Subscription Overview */}
                {currentSubscription && (
                    <Card className="flex-1">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Current Subscription</CardTitle>
                                    <CardDescription>
                                        You are currently on the {currentSubscription.plan.name} plan
                                    </CardDescription>
                                </div>
                                <Badge variant={getStatusBadgeVariant(currentSubscription.status)}>
                                    {currentSubscription.status}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Plan</p>
                                    <p className="font-semibold">{currentSubscription.plan.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Price</p>
                                    <p className="font-semibold">
                                        ${parseFloat(currentSubscription.plan.monthly_price).toFixed(0)}/month
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Billing Period Start</p>
                                    <p className="font-semibold">
                                        {formatDate(currentSubscription.current_period_start)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Billing Period End</p>
                                    <p className="font-semibold">
                                        {formatDate(currentSubscription.current_period_end)}
                                    </p>
                                </div>
                            </div>

                            {currentSubscription.stripe_customer_id && (
                                <>
                                    <Separator />
                                    <div className="flex justify-end">
                                        <Button variant="outline" onClick={openCustomerPortal} disabled={loading}>
                                            Manage Billing
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Usage Dashboard */}
                <div className="flex-1">
                    <UsageDashboard usage={usage} loading={loading} />
                </div>
            </div>

            {/* Available Plans */}
            <div className="space-y-4">
                <div>
                    <h2 className="text-2xl font-bold">Available Plans</h2>
                    <p className="text-muted-foreground">Choose the plan that works best for you</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {plans.map((plan) => (
                        <PricingCard
                            key={plan.uuid}
                            plan={plan}
                            currentPlanSlug={currentSubscription?.plan.slug}
                            currentPlanPrice={currentSubscription?.plan.monthly_price}
                            scheduledPlanSlug={currentSubscription?.scheduled_plan?.slug}
                            onSelectPlan={handleSelectPlan}
                            loading={checkoutLoading}
                        />
                    ))}
                    <PricingCard
                        key="enterprise"
                        plan={{
                            slug: 'enterprise',
                            name: 'Enterprise',
                            monthly_price: '0.00',
                            memo_operations_limit: null,
                            chat_queries_limit: null,
                            projects_limit: null,
                            features: {},
                            stripe_price_id: null,
                            is_default: false,
                            uuid: 'enterprise',
                        }}
                        currentPlanSlug={currentSubscription?.plan.slug}
                        currentPlanPrice={currentSubscription?.plan.monthly_price}
                        onSelectPlan={() => {
                            window.open('https://calendar.app.google/z2sjypLTSNUJumAYA', '_blank')
                        }}
                        loading={checkoutLoading}
                    />
                </div>
            </div>
        </div>
    )
}
