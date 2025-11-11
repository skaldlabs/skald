import { Request, Response, NextFunction } from 'express'

import { DI } from '@/di'
import { CachedQueries } from '@/queries/cachedQueries'

export const requireAuth = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!req.context || !req.context.requestUser || req.context.requestUser.userType === 'unauthenticatedUser') {
            return res.status(401).json({ error: 'Unauthorized' })
        }

        return next()
    }
}

export const requireProjectAccess = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!req.context || !req.context.requestUser) {
            return res.status(401).json({ error: 'Unauthorized' })
        }

        if (req.context.requestUser.userType === 'projectAPIKeyUser') {
            return next()
        }

        if (req.context.requestUser.userType === 'authenticatedUser' && req.context.requestUser.userInstance) {
            const projectId = req.body?.project_id || req.query?.project_id

            if (!projectId) {
                return res.status(400).json({ error: 'Project ID is required' })
            }

            const project = await DI.projects.findOne({ uuid: projectId }, { populate: ['organization'] })
            if (!project) {
                return res.status(404).json({ error: 'Project not found' })
            }
            req.context.requestUser.project = project

            const isMember = await CachedQueries.isUserOrgMember(
                DI.em,
                req.context.requestUser.userInstance.id,
                req.context.requestUser.project.organization.uuid
            )
            if (!isMember) {
                return res.status(403).json({ error: 'Forbidden' })
            }
            return next()
        }

        return res.status(403).json({ error: 'Forbidden' })
    }
}
