import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import type { Plan } from '@/stores/subscriptionStore'

interface PricingCardProps {
    plan: Plan
    currentPlanSlug?: string
    currentPlanPrice?: string
    onSelectPlan: (planSlug: string) => void
    loading?: boolean
}

export const PricingCard = ({ plan, currentPlanSlug, currentPlanPrice, onSelectPlan, loading }: PricingCardProps) => {
    const isCurrentPlan = plan.slug === currentPlanSlug
    const isFree = parseFloat(plan.monthly_price) === 0
    const isEnterprise = plan.slug === 'enterprise'

    const isDowngrade = currentPlanPrice ? parseFloat(plan.monthly_price) < parseFloat(currentPlanPrice) : isFree

    const formatLimit = (limit: number | null) => {
        if (limit === null) return 'Unlimited'
        return limit.toLocaleString()
    }

    const features = [
        {
            label: 'Memo operations',
            value: formatLimit(plan.memo_operations_limit),
        },
        {
            label: 'Chat queries',
            value: formatLimit(plan.chat_queries_limit),
        },
        {
            label: 'Projects',
            value: formatLimit(plan.projects_limit),
        },
    ]

    return (
        <Card className={isCurrentPlan ? 'border-primary' : ''}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>{plan.name}</CardTitle>
                    {isCurrentPlan && <Badge>Current Plan</Badge>}
                </div>
                <CardDescription>
                    <span className="text-3xl font-bold">
                        {isEnterprise ? 'Custom' : '$' + parseFloat(plan.monthly_price).toFixed(0)}
                    </span>
                    <span className="text-muted-foreground">{isEnterprise ? '' : '/month'}</span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-3">
                    {isEnterprise ? (
                        <>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" />
                                <span className="text-sm">Unlimited memo operations</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" />
                                <span className="text-sm">Unlimited chat queries</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" />
                                <span className="text-sm">Unlimited projects</span>
                            </li>
                        </>
                    ) : (
                        features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" />
                                <span className="text-sm">
                                    <span className="font-semibold">{feature.value}</span> {feature.label}
                                </span>
                            </li>
                        ))
                    )}
                </ul>
            </CardContent>
            <CardFooter>
                {isCurrentPlan ? (
                    <Button variant="outline" className="w-full" disabled>
                        Current Plan
                    </Button>
                ) : (
                    <Button
                        className="w-full"
                        onClick={() => onSelectPlan(plan.slug)}
                        disabled={loading}
                        variant={isDowngrade && !isEnterprise ? 'outline' : 'default'}
                    >
                        {isEnterprise ? 'Schedule a call' : isDowngrade ? 'Downgrade' : 'Upgrade'}
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}
