import { Request, Response, NextFunction } from 'express'
import { User } from '../entities/User'
import { Organization } from '../entities/Organization'
import { DI } from '../di'

export const isUserOrgMember = async (user: User, organization: Organization): Promise<boolean> => {
    return (await DI.organizationMemberships.findOne({ user, organization })) !== null
}

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

            const isMember = await isUserOrgMember(
                req.context.requestUser.userInstance,
                req.context.requestUser.project.organization
            )
            if (!isMember) {
                return res.status(403).json({ error: 'Forbidden' })
            }
            return next()
        }

        return res.status(403).json({ error: 'Forbidden' })
    }
}
