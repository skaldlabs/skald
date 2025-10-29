import { Request, Response, NextFunction } from 'express'
import { DI } from '../di'

export const projectMiddleware = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!req.context || !req.context.requestUser) {
            return res.status(401).json({ error: 'Unauthorized' })
        }

        if (req.context.requestUser.userType === 'authenticatedUser' && req.context.requestUser.userInstance) {
            const projectId = req.body.project_id || req.query.project_id

            if (!projectId) {
                return res.status(400).json({ error: 'Project ID is required' })
            }

            const project = await DI.projects.findOne({ uuid: projectId }, { populate: ['organization'] })
            if (!project) {
                return res.status(404).json({ error: 'Project not found' })
            }

            req.context.requestUser.project = project
        }

        return next()
    }
}
