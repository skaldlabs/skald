import { OrganizationMembership } from '@/entities/OrganizationMembership'
import { OrganizationSubscription } from '@/entities/OrganizationSubscription'
import { UsageRecord } from '@/entities/UsageRecord'
import { redisDel, redisGet, redisIncrBy, redisSet } from '@/lib/redisClient'
import { EntityManager } from '@mikro-orm/core'
import { IS_CLOUD } from '@/settings'

const REDIS_TRUE_VALUE = 'true'
const REDIS_FALSE_VALUE = 'false'

export class CachedQueries {
    static async isUserOrgMember(em: EntityManager, userId: bigint, organizationUuid: string): Promise<boolean> {
        const cacheKey = `isUserOrgMembers:${userId}:${organizationUuid}`

        // self-hosted deployments don't require redis
        if (IS_CLOUD) {
            const cachedValue = await redisGet(cacheKey)
            if (cachedValue) {
                return cachedValue === REDIS_TRUE_VALUE
            }
        }

        const isMember =
            (await em.findOne(OrganizationMembership, { user: userId, organization: organizationUuid })) !== null
        if (isMember && IS_CLOUD) {
            void redisSet(cacheKey, REDIS_TRUE_VALUE)
            return true
        }

        return false
    }

    static async isOrganizationOnFreePlan(em: EntityManager, organizationUuid: string): Promise<boolean> {
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

    static async getOrganizationUsage(
        em: EntityManager,
        organizationUuid: string
    ): Promise<{ memoWrites: number; chatQueries: number }> {
        const memoWritesCacheKey = `organizationMemoWrites:${organizationUuid}`
        const chatQueriesCacheKey = `organizationChatQueries:${organizationUuid}`

        const [memoWritesCached, chatQueriesCached] = await Promise.all([
            redisGet(memoWritesCacheKey),
            redisGet(chatQueriesCacheKey),
        ])
        if (memoWritesCached && chatQueriesCached) {
            return {
                memoWrites: parseInt(memoWritesCached),
                chatQueries: parseInt(chatQueriesCached),
            }
        }

        const usageRecord = await em.findOne(UsageRecord, { organization: organizationUuid })
        if (!usageRecord) {
            return {
                memoWrites: 0,
                chatQueries: 0,
            }
        }

        const [memoWrites, chatQueries] = await Promise.all([
            redisIncrBy(memoWritesCacheKey, usageRecord.memo_operations_count),
            redisIncrBy(chatQueriesCacheKey, usageRecord.chat_queries_count),
        ])

        return {
            memoWrites,
            chatQueries,
        }
    }

    static async incrementMemoWritesCache(organizationUuid: string, incrementBy: number = 1): Promise<number> {
        const cacheKey = `organizationMemoWrites:${organizationUuid}`
        return await redisIncrBy(cacheKey, incrementBy)
    }

    static async incrementChatQueriesCache(organizationUuid: string, incrementBy: number = 1): Promise<number> {
        const cacheKey = `organizationChatQueries:${organizationUuid}`
        return await redisIncrBy(cacheKey, incrementBy)
    }

    static async clearOrganizationUsageCache(organizationUuid: string): Promise<void> {
        await redisDel(`isOrganizationOnFreePlan:${organizationUuid}`)
        await redisDel(`organizationUsageLimitReached:${organizationUuid}`)
        await redisDel(`organizationMemoWrites:${organizationUuid}`)
        await redisDel(`organizationChatQueries:${organizationUuid}`)
    }
}
