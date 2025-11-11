import { OrganizationSubscription } from '@/entities/OrganizationSubscription'
import { UsageRecord } from '@/entities/UsageRecord'
import { redisDel, redisGet, redisIncrBy, redisSet } from '@/lib/redisClient'
import { EntityManager } from '@mikro-orm/core'
import { logger } from '@/lib/logger'

const REDIS_TRUE_VALUE = 'true'
const REDIS_FALSE_VALUE = 'false'

export class CachedQueries {
    static async isOrganizationOnFreePlan(em: EntityManager, organizationUuid: string): Promise<boolean> {
        const cacheKey = `isOrganizationOnFreePlan:${organizationUuid}`
        const cachedValue = await redisGet(cacheKey)
        if (cachedValue) {
            logger.debug('Cache hit (isOrganizationOnFreePlan). Key:', cacheKey, 'Value:', cachedValue)
            return cachedValue === REDIS_TRUE_VALUE
        }

        logger.debug('Cache miss (isOrganizationOnFreePlan). Key:', cacheKey)

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
            logger.debug('Cache hit (getOrganizationUsage). Key:', memoWritesCacheKey, 'Value:', memoWritesCached)
            logger.debug('Cache hit (getOrganizationUsage). Key:', chatQueriesCacheKey, 'Value:', chatQueriesCached)
            return {
                memoWrites: parseInt(memoWritesCached),
                chatQueries: parseInt(chatQueriesCached),
            }
        }

        logger.debug('Cache miss (getOrganizationUsage). Key:', memoWritesCacheKey)
        logger.debug('Cache miss (getOrganizationUsage). Key:', chatQueriesCacheKey)

        const usageRecord = await em.findOne(UsageRecord, { organization: organizationUuid })
        if (!usageRecord) {
            return {
                memoWrites: 0,
                chatQueries: 0,
            }
        }

        await Promise.all([
            redisIncrBy(memoWritesCacheKey, usageRecord.memo_operations_count),
            redisIncrBy(chatQueriesCacheKey, usageRecord.chat_queries_count),
        ])

        return {
            memoWrites: usageRecord.memo_operations_count,
            chatQueries: usageRecord.chat_queries_count,
        }
    }

    static async incrementMemoWritesCache(organizationUuid: string, incrementBy: number = 1): Promise<void> {
        const cacheKey = `organizationMemoWrites:${organizationUuid}`
        await redisIncrBy(cacheKey, incrementBy)
    }

    static async incrementChatQueriesCache(organizationUuid: string, incrementBy: number = 1): Promise<void> {
        const cacheKey = `organizationChatQueries:${organizationUuid}`
        await redisIncrBy(cacheKey, incrementBy)
    }

    static async clearOrganizationUsageCache(organizationUuid: string): Promise<void> {
        await redisDel(`isOrganizationOnFreePlan:${organizationUuid}`)
        await redisDel(`organizationUsageLimitReached:${organizationUuid}`)
        await redisDel(`organizationMemoWrites:${organizationUuid}`)
        await redisDel(`organizationChatQueries:${organizationUuid}`)
    }
}
