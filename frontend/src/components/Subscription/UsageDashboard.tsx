import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { UsageData } from '@/stores/subscriptionStore'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

interface UsageDashboardProps {
    usage: UsageData | null
    loading?: boolean
}

interface UsageItemProps {
    label: string
    count: number
    limit: number | null
    percentage: number
}

const UsageItem = ({ label, count, limit, percentage }: UsageItemProps) => {
    const isUnlimited = limit === null
    const isNearLimit = percentage >= 80
    const isAtLimit = percentage >= 100

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{label}</span>
                <span className={`text-sm ${isAtLimit ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                    {count.toLocaleString()} / {isUnlimited ? 'Unlimited' : limit.toLocaleString()}
                </span>
            </div>
            {!isUnlimited && (
                <>
                    <Progress
                        value={Math.min(percentage, 100)}
                        className={isAtLimit ? '[&>*]:bg-destructive' : isNearLimit ? '[&>*]:bg-yellow-500' : ''}
                    />
                    <div className="flex justify-end">
                        <span
                            className={`text-xs ${isAtLimit ? 'text-destructive font-semibold' : isNearLimit ? 'text-yellow-600' : 'text-muted-foreground'}`}
                        >
                            {percentage.toFixed(0)}% used
                        </span>
                    </div>
                </>
            )}
            {isUnlimited && <div className="text-xs text-muted-foreground">No limits</div>}
        </div>
    )
}

const UsageItemSkeleton = () => {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-2 w-full" />
            <div className="flex justify-end">
                <Skeleton className="h-3 w-16" />
            </div>
        </div>
    )
}

export const UsageDashboard = ({ usage, loading }: UsageDashboardProps) => {
    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Current Usage</CardTitle>
                    <CardDescription>
                        <Skeleton className="h-4 w-64" />
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <UsageItemSkeleton />
                    <UsageItemSkeleton />
                    <UsageItemSkeleton />
                </CardContent>
            </Card>
        )
    }

    if (!usage) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Usage</CardTitle>
                    <CardDescription>No usage data available</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    const periodStart = new Date(usage.billing_period_start).toLocaleDateString()
    const periodEnd = new Date(usage.billing_period_end).toLocaleDateString()

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Current Usage</CardTitle>
                <CardDescription>
                    Billing period: {periodStart} - {periodEnd}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <UsageItem
                    label="Memo Operations"
                    count={usage.usage.memo_operations.count}
                    limit={usage.usage.memo_operations.limit}
                    percentage={usage.usage.memo_operations.percentage}
                />
                <UsageItem
                    label="Chat Queries"
                    count={usage.usage.chat_queries.count}
                    limit={usage.usage.chat_queries.limit}
                    percentage={usage.usage.chat_queries.percentage}
                />
                <UsageItem
                    label="Projects"
                    count={usage.usage.projects.count}
                    limit={usage.usage.projects.limit}
                    percentage={usage.usage.projects.percentage}
                />

                {usage.overage && usage.overage.estimated_overage_cost > 0 && (
                    <>
                        <Separator />
                        <div className="space-y-1">
                            <p className="text-sm font-semibold">Overage Summary</p>
                            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                <p>Memo overages: {usage.overage.memo_operations_overage_count.toLocaleString()}</p>
                                <p>Chat overages: {usage.overage.chat_queries_overage_count.toLocaleString()}</p>
                            </div>
                            <p className="text-sm font-semibold">
                                Estimated overage cost: ${usage.overage.estimated_overage_cost.toFixed(2)}
                            </p>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
