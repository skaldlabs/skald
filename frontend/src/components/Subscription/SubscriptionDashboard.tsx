import { useEffect } from 'react'
import { useSubscriptionStore } from '@/stores/subscriptionStore'
import { PricingCard } from './PricingCard'
import { UsageDashboard } from './UsageDashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { useSearchParams } from 'react-router-dom'

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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
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
        <div className="space-y-6">
            {/* Current Subscription Overview */}
            {currentSubscription && (
                <Card className="mt-6">
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
                                <p className="font-semibold">{formatDate(currentSubscription.current_period_start)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Billing Period End</p>
                                <p className="font-semibold">{formatDate(currentSubscription.current_period_end)}</p>
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
            <UsageDashboard usage={usage} loading={loading} />

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
