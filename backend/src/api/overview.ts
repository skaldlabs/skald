import express, { Request, Response } from 'express'
import { DI } from '@/di'
import { redisGet, redisSet } from '@/lib/redisClient'
import { logger } from '@/lib/logger'

const CACHE_TTL_SECONDS = 60 // 1 minute cache

interface ProjectOverviewStats {
    memoCount: number
    chatCount: number
}

const getProjectOverviewStats = async (projectUuid: string): Promise<ProjectOverviewStats> => {
    const cacheKey = `projectOverview:${projectUuid}`
    const cachedValue = await redisGet(cacheKey)

    if (cachedValue) {
        logger.debug('Cache hit (getProjectOverviewStats). Key:', cacheKey)
        return JSON.parse(cachedValue)
    }

    logger.debug('Cache miss (getProjectOverviewStats). Key:', cacheKey)

    const [memoCount, chatCount] = await Promise.all([
        DI.memos.count({ project: projectUuid }),
        DI.chats.count({ project: projectUuid }),
    ])

    const stats: ProjectOverviewStats = { memoCount, chatCount }

    void redisSet(cacheKey, JSON.stringify(stats), CACHE_TTL_SECONDS)

    return stats
}

export const getOverview = async (req: Request, res: Response) => {
    const user = req.context?.requestUser?.userInstance
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    const projectUuid = req.params.uuid
    if (!projectUuid) {
        return res.status(400).json({ error: 'Project UUID is required' })
    }

    const project = await DI.projects.findOne({ uuid: projectUuid })
    if (!project) {
        return res.status(404).json({ error: 'Project not found' })
    }

    const membership = await DI.organizationMemberships.findOne({
        user: user,
        organization: project.organization,
    })
    if (!membership) {
        return res.status(403).json({ error: 'You do not have access to this project' })
    }

    const stats = await getProjectOverviewStats(project.uuid)

    return res.status(200).json({
        memo_count: stats.memoCount,
        chat_count: stats.chatCount,
    })
}

export const overviewRouter = express.Router({ mergeParams: true })
overviewRouter.get('/', getOverview)
