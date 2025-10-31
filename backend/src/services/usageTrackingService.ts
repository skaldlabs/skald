/**
 * Usage Tracking Service
 * Handles increment and retrieval of usage metrics.
 */

import { DI } from '@/di'
import { Organization } from '@/entities/Organization'
import { UsageRecord } from '@/entities/UsageRecord'
import { OrganizationSubscription } from '@/entities/OrganizationSubscription'
import { EntityManager } from '@mikro-orm/core'

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
    /**
     * Increment memo operations counter for current billing period
     */
    async incrementMemoOperations(organization: Organization, em?: EntityManager): Promise<void> {
        const entityManager = em || DI.em.fork()
        const usageRecord = await this.getOrCreateCurrentUsage(organization, entityManager)

        await entityManager.nativeUpdate(
            UsageRecord,
            { id: usageRecord.id },
            { memo_operations_count: usageRecord.memo_operations_count + 1, updated_at: new Date() }
        )

        // Check and send usage alerts if needed
        await this.checkAndSendUsageAlerts(organization, 'memo_operations', entityManager)
    }

    /**
     * Increment chat queries counter for current billing period
     */
    async incrementChatQueries(organization: Organization, em?: EntityManager): Promise<void> {
        const entityManager = em || DI.em.fork()
        const usageRecord = await this.getOrCreateCurrentUsage(organization, entityManager)

        await entityManager.nativeUpdate(
            UsageRecord,
            { id: usageRecord.id },
            { chat_queries_count: usageRecord.chat_queries_count + 1, updated_at: new Date() }
        )

        // Check and send usage alerts if needed
        await this.checkAndSendUsageAlerts(organization, 'chat_queries', entityManager)
    }

    /**
     * Get current billing period usage with limits
     */
    async getCurrentUsage(organization: Organization, em?: EntityManager): Promise<UsageData> {
        const entityManager = em || DI.em.fork()

        const subscription = await entityManager.findOne(
            OrganizationSubscription,
            { organization: organization.uuid },
            { populate: ['plan'] }
        )

        if (!subscription) {
            throw new Error('Organization subscription not found')
        }

        const usageRecord = await this.getOrCreateCurrentUsage(organization, entityManager)
        const plan = subscription.plan

        // Get projects count for the organization
        const projectsCount = await entityManager.count('Project', { organization: organization.uuid })

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
        limitType: 'memo_operations' | 'chat_queries' | 'projects',
        em?: EntityManager
    ): Promise<{ withinLimit: boolean; currentCount: number; limit: number | null }> {
        const entityManager = em || DI.em.fork()

        const subscription = await entityManager.findOne(
            OrganizationSubscription,
            { organization: organization.uuid },
            { populate: ['plan'] }
        )

        if (!subscription) {
            throw new Error('Organization subscription not found')
        }

        const plan = subscription.plan
        const usageRecord = await this.getOrCreateCurrentUsage(organization, entityManager)

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
                currentCount = await entityManager.count('Project', { organization: organization.uuid })
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
    private async getOrCreateCurrentUsage(organization: Organization, em: EntityManager): Promise<UsageRecord> {
        const subscription = await em.findOne(
            OrganizationSubscription,
            { organization: organization.uuid },
            { populate: ['organization'] }
        )

        if (!subscription) {
            throw new Error('Organization subscription not found')
        }

        const periodStart = subscription.current_period_start.toISOString().split('T')[0]
        const periodEnd = subscription.current_period_end.toISOString().split('T')[0]

        let usageRecord = await em.findOne(UsageRecord, {
            organization: organization.uuid,
            billing_period_start: periodStart,
        })

        if (!usageRecord) {
            usageRecord = em.create(UsageRecord, {
                organization,
                billing_period_start: periodStart,
                billing_period_end: periodEnd,
                memo_operations_count: 0,
                chat_queries_count: 0,
                alerts_sent: {},
                created_at: new Date(),
                updated_at: new Date(),
            })
            await em.persistAndFlush(usageRecord)
        }

        return usageRecord
    }

    /**
     * Check if usage has crossed alert thresholds and send email alerts
     */
    private async checkAndSendUsageAlerts(
        organization: Organization,
        limitType: 'memo_operations' | 'chat_queries' | 'projects',
        em: EntityManager
    ): Promise<void> {
        const usageRecord = await this.getOrCreateCurrentUsage(organization, em)
        await em.refresh(usageRecord)

        const subscription = await em.findOne(
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
                currentCount = await em.count('Project', { organization: organization.uuid })
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
                await em.persistAndFlush(usageRecord)
            }
        }

        // Check 100% threshold
        if (percentage >= 100) {
            const alertKey = `${limitType}_100`
            if (!usageRecord.alerts_sent[alertKey]) {
                await this.sendUsageAlert(organization, limitType, 100, currentCount, limit)
                usageRecord.alerts_sent[alertKey] = true
                await em.persistAndFlush(usageRecord)
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
            console.error('Failed to send usage alert email:', error)
            // Don't throw - we don't want email failures to break the usage tracking
        }
    }
}

export { UsageTrackingService }
