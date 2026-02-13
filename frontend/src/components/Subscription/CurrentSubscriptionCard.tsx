import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatDate } from '@/components/utils/dateUtils'

interface Plan {
    name: string
    monthly_price: string
    memo_operation_overage_price?: string | null
    chat_query_overage_price?: string | null
}

interface CurrentSubscription {
    plan: Plan
    status: string
    current_period_start: string
    current_period_end: string
    stripe_customer_id: string | null
}

interface CurrentSubscriptionCardProps {
    subscription: CurrentSubscription
    onManageBilling: () => void
    loading: boolean
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

export const CurrentSubscriptionCard = ({ subscription, onManageBilling, loading }: CurrentSubscriptionCardProps) => {
    return (
        <Card className="flex-1">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Current Subscription</CardTitle>
                        <CardDescription>You are currently on the {subscription.plan.name} plan</CardDescription>
                    </div>
                    <Badge variant={getStatusBadgeVariant(subscription.status)}>{subscription.status}</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Plan</p>
                        <p className="font-semibold">{subscription.plan.name}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Price</p>
                        <p className="font-semibold">${parseFloat(subscription.plan.monthly_price).toFixed(0)}/month</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Billing Period Start</p>
                        <p className="font-semibold">{formatDate(subscription.current_period_start)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Billing Period End</p>
                        <p className="font-semibold">{formatDate(subscription.current_period_end)}</p>
                    </div>
                </div>

                {subscription.plan.name.toLowerCase() !== 'free' &&
                    (subscription.plan.memo_operation_overage_price || subscription.plan.chat_query_overage_price) && (
                        <>
                            <Separator />
                            <div>
                                <p className="text-sm font-semibold mb-2">Over-Limit Usage Pricing</p>
                                <div className="space-y-1 text-sm text-muted-foreground">
                                    {subscription.plan.memo_operation_overage_price && (
                                        <p>
                                            • USD{' '}
                                            {parseFloat(subscription.plan.memo_operation_overage_price).toFixed(4)} per
                                            memo operation
                                        </p>
                                    )}
                                    {subscription.plan.chat_query_overage_price && (
                                        <p>
                                            • USD {parseFloat(subscription.plan.chat_query_overage_price).toFixed(4)}{' '}
                                            per chat query
                                        </p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                {subscription.stripe_customer_id && (
                    <>
                        <Separator />
                        <div className="flex justify-end">
                            <Button variant="outline" onClick={onManageBilling} disabled={loading}>
                                Manage Billing
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
