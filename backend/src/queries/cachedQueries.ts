import { OrganizationMembership } from '@/entities/OrganizationMembership'
import { redisGet, redisSet } from '@/lib/redisClient'
import { EntityManager } from '@mikro-orm/postgresql'

export const isUserOrgMemberCached = async (em: EntityManager, userId: bigint, organizationUuid: string) => {
    const cacheKey = `isUserOrgMembers:${userId}:${organizationUuid}`
    const cachedValue = await redisGet(cacheKey)
    if (cachedValue) {
        return true
    }

    const isMember =
        (await em.findOne(OrganizationMembership, { user: userId, organization: organizationUuid })) !== null
    if (isMember) {
        void redisSet(cacheKey, 'true')
        return true
    }

    return false
}
