/**
 * Usage Tracking Service
 * Handles increment and retrieval of usage metrics.
 */

import { DI } from '@/di'
import { Organization } from '@/entities/Organization'
import { UsageRecord } from '@/entities/UsageRecord'
import { OrganizationSubscription } from '@/entities/OrganizationSubscription'
import { EntityManager } from '@mikro-orm/core'
import { logger } from '@/lib/logger'
import { CachedQueries } from '@/queries/cachedQueries'
import { IS_SELF_HOSTED_DEPLOY } from '@/settings'

interface UsageData {
    billing_period_start: string
    billing_period_end: string
    usage: {
        memo_operations: UsageMetric
        chat_queries: UsageMetric
        projects: UsageMetric
    }
}

interface UsageMetric {
    count: number
    limit: number | null
    percentage: number
}

class UsageTrackingService {
    private em: EntityManager

    constructor(em: EntityManager) {
        this.em = em.fork()
    }

    /**
     * Increment memo operations counter for current billing period
     */
    async incrementMemoOperations(organization: Organization, incrementBy: number = 1): Promise<void> {
        if (IS_SELF_HOSTED_DEPLOY) {
            return
        }
        const usageRecord = await this.getOrCreateCurrentUsage(organization)

        await this.em.nativeUpdate(
            UsageRecord,
            { id: usageRecord.id },
            { memo_operations_count: usageRecord.memo_operations_count + incrementBy, updated_at: new Date() }
        )

        const isOrgOnFreePlan = await CachedQueries.isOrganizationOnFreePlan(this.em, organization.uuid)
        if (isOrgOnFreePlan) {
            // we only cache free plan usage because we need to check if the limit has been reached to stop
            // the service. those on non-free plans can continue using us and will pay for the usage.
            await CachedQueries.incrementMemoWritesCache(organization.uuid, incrementBy)
        }

        // Check and send usage alerts if needed
        await this.checkAndSendUsageAlerts(organization, 'memo_operations')

        await this.em.flush()
    }

    /**
     * Increment chat queries counter for current billing period
     */
    async incrementChatQueries(organization: Organization): Promise<void> {
        const usageRecord = await this.getOrCreateCurrentUsage(organization)

        await this.em.nativeUpdate(
            UsageRecord,
            { id: usageRecord.id },
            { chat_queries_count: usageRecord.chat_queries_count + 1, updated_at: new Date() }
        )

        const isOrgOnFreePlan = await CachedQueries.isOrganizationOnFreePlan(this.em, organization.uuid)
        if (isOrgOnFreePlan) {
            // we only cache free plan usage because we need to check if the limit has been reached to stop
            // the service. those on non-free plans can continue using us and will pay for the usage.
            await CachedQueries.incrementChatQueriesCache(organization.uuid, 1)
        }

        // Check and send usage alerts if needed
        await this.checkAndSendUsageAlerts(organization, 'chat_queries')

        // Only flush if we created our own entity manager
        await this.em.flush()
    }

    /**
     * Get current billing period usage with limits
     */
    async getCurrentUsage(organization: Organization): Promise<UsageData> {
        const subscription = await this.em.findOne(
            OrganizationSubscription,
            { organization: organization.uuid },
            { populate: ['plan'] }
        )

        if (!subscription) {
            throw new Error('Organization subscription not found')
        }

        const usageRecord = await this.getOrCreateCurrentUsage(organization)
        const plan = subscription.plan

        // Get projects count for the organization
        const projectsCount = await this.em.count('Project', { organization: organization.uuid })

        // Calculate usage metrics
        const calcUsage = (count: number, limit: number | null): UsageMetric => {
            if (limit === null) {
                return { count, limit: null, percentage: 0 }
            }
            return {
                count,
                limit,
                percentage: limit > 0 ? Math.round((count / limit) * 100 * 100) / 100 : 0,
            }
        }

        return {
            billing_period_start: subscription.current_period_start.toISOString().split('T')[0],
            billing_period_end: subscription.current_period_end.toISOString().split('T')[0],
            usage: {
                memo_operations: calcUsage(usageRecord.memo_operations_count, plan.memo_operations_limit ?? null),
                chat_queries: calcUsage(usageRecord.chat_queries_count, plan.chat_queries_limit ?? null),
                projects: calcUsage(projectsCount, plan.projects_limit ?? null),
            },
        }
    }

    /**
     * Check if organization has exceeded limit for a specific type
     */
    async checkLimit(
        organization: Organization,
        limitType: 'memo_operations' | 'chat_queries' | 'projects'
    ): Promise<{ withinLimit: boolean; currentCount: number; limit: number | null }> {
        const subscription = await this.em.findOne(
            OrganizationSubscription,
            { organization: organization.uuid },
            { populate: ['plan'] }
        )

        if (!subscription) {
            throw new Error('Organization subscription not found')
        }

        const plan = subscription.plan

        const usageRecord = await this.getOrCreateCurrentUsage(organization)

        let currentCount: number
        let limit: number | null

        switch (limitType) {
            case 'memo_operations':
                currentCount = usageRecord.memo_operations_count
                limit = plan.memo_operations_limit ?? null
                break
            case 'chat_queries':
                currentCount = usageRecord.chat_queries_count
                limit = plan.chat_queries_limit ?? null
                break
            case 'projects':
                currentCount = await this.em.count('Project', { organization: organization.uuid })
                limit = plan.projects_limit ?? null
                break
        }

        // null means unlimited
        if (limit === null) {
            return { withinLimit: true, currentCount, limit: null }
        }

        const withinLimit = currentCount < limit
        return { withinLimit, currentCount, limit }
    }

    /**
     * Get or create usage record for current billing period
     */
    private async getOrCreateCurrentUsage(organization: Organization): Promise<UsageRecord> {
        const subscription = await this.em.findOne(
            OrganizationSubscription,
            { organization: organization.uuid },
            { populate: ['organization'] }
        )

        if (!subscription) {
            throw new Error('Organization subscription not found')
        }

        const periodStart = subscription.current_period_start.toISOString().split('T')[0]
        const periodEnd = subscription.current_period_end.toISOString().split('T')[0]

        let usageRecord = await this.em.findOne(UsageRecord, {
            organization: organization.uuid,
            billing_period_start: periodStart,
        })

        if (!usageRecord) {
            usageRecord = this.em.create(UsageRecord, {
                organization,
                billing_period_start: periodStart,
                billing_period_end: periodEnd,
                memo_operations_count: 0,
                chat_queries_count: 0,
                alerts_sent: {},
                created_at: new Date(),
                updated_at: new Date(),
            })
            await this.em.persistAndFlush(usageRecord)
        }

        return usageRecord
    }

    /**
     * Check if usage has crossed alert thresholds and send email alerts
     */
    private async checkAndSendUsageAlerts(
        organization: Organization,
        limitType: 'memo_operations' | 'chat_queries' | 'projects'
    ): Promise<void> {
        const usageRecord = await this.getOrCreateCurrentUsage(organization)
        await this.em.refresh(usageRecord)

        const subscription = await this.em.findOne(
            OrganizationSubscription,
            { organization: organization.uuid },
            { populate: ['plan'] }
        )

        if (!subscription) {
            return
        }

        const plan = subscription.plan

        let currentCount: number
        let limit: number | null

        switch (limitType) {
            case 'memo_operations':
                currentCount = usageRecord.memo_operations_count
                limit = plan.memo_operations_limit ?? null
                break
            case 'chat_queries':
                currentCount = usageRecord.chat_queries_count
                limit = plan.chat_queries_limit ?? null
                break
            case 'projects':
                currentCount = await this.em.count('Project', { organization: organization.uuid })
                limit = plan.projects_limit ?? null
                break
        }

        // Skip if unlimited plan
        if (limit === null) {
            return
        }

        const percentage = limit > 0 ? (currentCount / limit) * 100 : 0

        // Check 80% threshold
        if (percentage >= 80 && percentage < 100) {
            const alertKey = `${limitType}_80`
            if (!usageRecord.alerts_sent[alertKey]) {
                await this.sendUsageAlert(organization, limitType, 80, currentCount, limit)
                usageRecord.alerts_sent[alertKey] = true
                await this.em.persistAndFlush(usageRecord)
            }
        }

        // Check 100% threshold
        if (percentage >= 100) {
            const alertKey = `${limitType}_100`
            if (!usageRecord.alerts_sent[alertKey]) {
                await this.sendUsageAlert(organization, limitType, 100, currentCount, limit)
                usageRecord.alerts_sent[alertKey] = true
                await this.em.persistAndFlush(usageRecord)
            }
        }
    }

    /**
     * Send usage alert email to organization owner
     */
    private async sendUsageAlert(
        organization: Organization,
        limitType: string,
        percentage: number,
        currentUsage: number,
        limit: number
    ): Promise<void> {
        try {
            const { sendUsageAlertEmail } = await import('@/lib/usageAlertEmail')

            // Get subscription for billing period info
            const subscription = await DI.em.findOne(
                OrganizationSubscription,
                { organization: organization.uuid },
                { populate: ['plan'] }
            )

            const billingPeriodEnd = subscription
                ? subscription.current_period_end.toISOString().split('T')[0]
                : undefined

            await sendUsageAlertEmail(organization, limitType, percentage, currentUsage, limit, billingPeriodEnd)
        } catch (error) {
            logger.error({ err: error }, 'Failed to send usage alert email')
            // Don't throw - we don't want email failures to break the usage tracking
        }
    }
}

export { UsageTrackingService }
