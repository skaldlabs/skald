import { OrganizationMembership } from '@/entities/OrganizationMembership'
import { OrganizationSubscription } from '@/entities/OrganizationSubscription'
import { UsageRecord } from '@/entities/UsageRecord'
import { redisGet, redisSet } from '@/lib/redisClient'
import { EntityManager } from '@mikro-orm/postgresql'

const REDIS_TRUE_VALUE = 'true'
const REDIS_FALSE_VALUE = 'false'

export const isUserOrgMemberCached = async (em: EntityManager, userId: bigint, organizationUuid: string) => {
    const cacheKey = `isUserOrgMembers:${userId}:${organizationUuid}`
    const cachedValue = await redisGet(cacheKey)
    if (cachedValue) {
        return cachedValue === REDIS_TRUE_VALUE
    }

    const isMember =
        (await em.findOne(OrganizationMembership, { user: userId, organization: organizationUuid })) !== null
    if (isMember) {
        void redisSet(cacheKey, REDIS_TRUE_VALUE)
        return true
    }

    return false
}

export const isOrganizationOnFreePlanCached = async (em: EntityManager, organizationUuid: string) => {
    const cacheKey = `isOrganizationOnFreePlan:${organizationUuid}`
    const cachedValue = await redisGet(cacheKey)
    if (cachedValue) {
        return cachedValue === REDIS_TRUE_VALUE
    }

    const organizationSubscription = await em.findOne(
        OrganizationSubscription,
        { organization: organizationUuid },
        { populate: ['plan'] }
    )
    if (!organizationSubscription) {
        return false
    }

    const isOnFreePlan = organizationSubscription.plan.slug === 'free'
    void redisSet(cacheKey, isOnFreePlan ? REDIS_TRUE_VALUE : REDIS_FALSE_VALUE)
    return isOnFreePlan
}

export const organizationUsageLimitReachedCached = async (em: EntityManager, organizationUuid: string) => {
    const cacheKey = `organizationUsageLimitReached:${organizationUuid}`
    const cachedValue = await redisGet(cacheKey)
    if (cachedValue) {
        return cachedValue === REDIS_TRUE_VALUE
    }

    const [organizationSubscription, usageRecord] = await Promise.all([
        em.findOne(OrganizationSubscription, { organization: organizationUuid }, { populate: ['plan'] }),
        em.findOne(UsageRecord, { organization: organizationUuid }),
    ])

    if (!organizationSubscription || !usageRecord) {
        return false
    }

    const usageLimitReached =
        usageRecord.memo_operations_count >= (organizationSubscription.plan.memo_operations_limit ?? 0) ||
        usageRecord.chat_queries_count >= (organizationSubscription.plan.chat_queries_limit ?? 0)

    if (usageLimitReached) {
        void redisSet(cacheKey, REDIS_TRUE_VALUE)
        return true
    }

    return false
}
