import { PricingCard } from './PricingCard'

interface Plan {
    uuid: string
    slug: string
    name: string
    monthly_price: string
    memo_operations_limit: number | null
    chat_queries_limit: number | null
    projects_limit: number | null
    features: Record<string, any>
    stripe_price_id: string | null
    is_default: boolean
}

interface AvailablePlansSectionProps {
    plans: Plan[]
    currentPlanSlug?: string
    currentPlanPrice?: string
    scheduledPlanSlug?: string
    onSelectPlan: (planSlug: string) => void
    loading: boolean
}

const ENTERPRISE_PLAN = {
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
}

export const AvailablePlansSection = ({
    plans,
    currentPlanSlug,
    currentPlanPrice,
    scheduledPlanSlug,
    onSelectPlan,
    loading,
}: AvailablePlansSectionProps) => {
    return (
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
                        currentPlanSlug={currentPlanSlug}
                        currentPlanPrice={currentPlanPrice}
                        scheduledPlanSlug={scheduledPlanSlug}
                        onSelectPlan={onSelectPlan}
                        loading={loading}
                    />
                ))}
                <PricingCard
                    key="enterprise"
                    plan={ENTERPRISE_PLAN}
                    currentPlanSlug={currentPlanSlug}
                    currentPlanPrice={currentPlanPrice}
                    onSelectPlan={() => {
                        window.open('https://calendar.app.google/z2sjypLTSNUJumAYA', '_blank')
                    }}
                    loading={loading}
                />
            </div>
        </div>
    )
}
