import { OrganizationSubscription } from '@/entities/OrganizationSubscription'
import { UsageRecord } from '@/entities/UsageRecord'
import { EntityManager } from '@mikro-orm/core'

export interface BillingLimitStatus {
    exceeded: boolean
    overage_cost: number
    billing_limit: number | null
    memo_overage_count: number
    chat_overage_count: number
}

export class BillingLimitService {
    static async check(em: EntityManager, organizationUuid: string): Promise<BillingLimitStatus> {
        const subscription = await em.findOne(
            OrganizationSubscription,
            { organization: organizationUuid },
            { populate: ['plan'] }
        )

        if (!subscription) {
            return {
                exceeded: false,
                overage_cost: 0,
                billing_limit: null,
                memo_overage_count: 0,
                chat_overage_count: 0,
            }
        }

        const plan = subscription.plan
        const billingLimit = subscription.billing_limit ? parseFloat(subscription.billing_limit) : null

        // No overage pricing set means no billing limit logic applies
        if (!plan.memo_operation_overage_price && !plan.chat_query_overage_price) {
            return {
                exceeded: false,
                overage_cost: 0,
                billing_limit: billingLimit,
                memo_overage_count: 0,
                chat_overage_count: 0,
            }
        }

        const periodStart = subscription.current_period_start.toISOString().split('T')[0]
        const usageRecord = await em.findOne(UsageRecord, {
            organization: organizationUuid,
            billing_period_start: periodStart,
        })

        const memoCount = usageRecord?.memo_operations_count ?? 0
        const chatCount = usageRecord?.chat_queries_count ?? 0

        const memoLimit = plan.memo_operations_limit ?? 0
        const chatLimit = plan.chat_queries_limit ?? 0

        const memoOverage = Math.max(0, memoCount - memoLimit)
        const chatOverage = Math.max(0, chatCount - chatLimit)

        const memoPrice = plan.memo_operation_overage_price ? parseFloat(plan.memo_operation_overage_price) : 0
        const chatPrice = plan.chat_query_overage_price ? parseFloat(plan.chat_query_overage_price) : 0

        const overageCost = memoOverage * memoPrice + chatOverage * chatPrice

        const exceeded = billingLimit !== null && overageCost >= billingLimit

        return {
            exceeded,
            overage_cost: Math.round(overageCost * 100) / 100,
            billing_limit: billingLimit,
            memo_overage_count: memoOverage,
            chat_overage_count: chatOverage,
        }
    }
}
