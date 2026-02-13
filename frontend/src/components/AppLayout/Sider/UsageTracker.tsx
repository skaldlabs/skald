import { useEffect } from 'react'
import { useSubscriptionStore } from '@/stores/subscriptionStore'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

export const UsageTracker = () => {
    const navigate = useNavigate()
    const { usage, loading, fetchUsage } = useSubscriptionStore()

    useEffect(() => {
        fetchUsage()
    }, [fetchUsage])

    if (loading && !usage) {
        return (
            <div className="p-3 border rounded-lg bg-muted/50">
                <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
            </div>
        )
    }

    if (!usage) {
        return null
    }

    const usageItems = [
        { label: 'Memos', ...usage.usage.memo_operations },
        { label: 'Queries', ...usage.usage.chat_queries },
    ]

    const highestUsage = Math.max(usage.usage.memo_operations.percentage, usage.usage.chat_queries.percentage)

    const isNearLimit = highestUsage >= 80
    const isAtLimit = highestUsage >= 100
    const billingLimitExceeded = usage.overage?.billing_limit_exceeded ?? false

    return (
        <div className="p-3 border rounded-lg bg-muted/50 space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">USAGE</span>
                {billingLimitExceeded && <span className="text-xs text-destructive font-semibold">SERVICE PAUSED</span>}
                {!billingLimitExceeded && isAtLimit && (
                    <span className="text-xs text-destructive font-semibold">LIMIT REACHED</span>
                )}
                {!billingLimitExceeded && !isAtLimit && isNearLimit && (
                    <span className="text-xs text-yellow-600 font-semibold">NEAR LIMIT</span>
                )}
            </div>

            <div className="space-y-2">
                {usageItems.map((item) => {
                    const isUnlimited = item.limit === null
                    const itemAtLimit = item.percentage >= 100
                    const itemNearLimit = item.percentage >= 80

                    return (
                        <div key={item.label} className="space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium">{item.label}</span>
                                <span
                                    className={`text-xs ${itemAtLimit ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}
                                >
                                    {item.count} / {isUnlimited ? '∞' : item.limit}
                                </span>
                            </div>
                            {!isUnlimited && (
                                <Progress
                                    value={Math.min(item.percentage, 100)}
                                    className={`h-1 ${itemAtLimit ? '[&>*]:bg-destructive' : itemNearLimit ? '[&>*]:bg-yellow-500' : ''}`}
                                />
                            )}
                        </div>
                    )
                })}
            </div>

            {billingLimitExceeded && (
                <p className="text-xs text-destructive font-medium">
                    Billing limit reached. Increase your limit in settings to resume service.
                </p>
            )}
            {!billingLimitExceeded && isAtLimit && (
                <p className="text-xs text-muted-foreground">
                    Extra usage will be charged at the end of the month separately.
                </p>
            )}
            {usage.overage && usage.overage.estimated_overage_cost > 0 && (
                <p className="text-xs text-muted-foreground">
                    Overage: ${usage.overage.estimated_overage_cost.toFixed(2)}
                    {usage.overage.billing_limit !== null && ` / $${usage.overage.billing_limit.toFixed(2)}`}
                </p>
            )}

            {(billingLimitExceeded || isNearLimit || isAtLimit) && (
                <Button
                    onClick={() => navigate('/organization/subscription')}
                    size="sm"
                    className="w-full"
                    variant={billingLimitExceeded || isAtLimit ? 'destructive' : 'default'}
                >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {billingLimitExceeded ? 'Manage Billing Limit' : 'Upgrade Plan'}
                </Button>
            )}

            {!billingLimitExceeded && !isNearLimit && !isAtLimit && (
                <Button
                    onClick={() => navigate('/organization/subscription')}
                    size="sm"
                    className="w-full"
                    variant="outline"
                >
                    Manage Plan
                </Button>
            )}
        </div>
    )
}
