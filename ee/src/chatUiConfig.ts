import express, { Request, Response } from 'express'
import { DI } from '@/di'
import { OrganizationMembershipRole } from '@/entities/OrganizationMembership'
import { validateUuidParams } from '@/middleware/validateUuidMiddleware'
import { RAGConfig } from '@/agents/chatAgent/ragGraph'

export const chatUiConfigRouter = express.Router({ mergeParams: true })

interface UpdateChatUiConfigRequest {
    chat_ui_enabled?: boolean
    chat_ui_rag_config?: RAGConfig | null
    chat_ui_slug?: string | null
}

const updateChatUiConfig = async (req: Request, res: Response) => {
    const user = req.context?.requestUser?.userInstance
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    const organizationUuid = req.params.organization_uuid
    const projectUuid = req.params.uuid
    if (!organizationUuid || !projectUuid) {
        return res.status(400).json({ error: 'Organization UUID and Project UUID are required' })
    }

    const organization = await DI.organizations.findOne({ uuid: organizationUuid })
    if (!organization) {
        return res.status(404).json({ error: 'Organization not found' })
    }

    const membership = await DI.organizationMemberships.findOne({
        user: user,
        organization: organization,
    })
    if (!membership || membership.accessLevel !== OrganizationMembershipRole.OWNER) {
        return res.status(403).json({ error: 'You do not have permission to update this project' })
    }

    const project = await DI.projects.findOne(
        { uuid: projectUuid, organization: organization },
        { populate: ['organization', 'owner'] }
    )
    if (!project) {
        return res.status(404).json({ error: 'Project not found' })
    }

    const body: UpdateChatUiConfigRequest = req.body

    if (body.chat_ui_enabled !== undefined) {
        project.chat_ui_enabled = body.chat_ui_enabled
        project.updated_at = new Date()
    }

    if (body.chat_ui_rag_config !== undefined) {
        project.chat_ui_rag_config = body.chat_ui_rag_config
        project.updated_at = new Date()
    }

    if (body.chat_ui_slug !== undefined) {
        const newSlug = body.chat_ui_slug?.trim() || null

        // Check uniqueness if slug is being set to a non-null value
        if (newSlug) {
            // Allow keeping the same slug for the current project
            const existingProject = await DI.projects.findOne({ chat_ui_slug: newSlug }, { fields: ['uuid'] })

            if (existingProject && existingProject.uuid !== project.uuid) {
                return res.status(400).json({ error: 'This slug is already in use by another project' })
            }
        }

        project.chat_ui_slug = newSlug
        project.updated_at = new Date()
    }

    try {
        await DI.em.flush()
    } catch (error: any) {
        // Catch database-level unique constraint violations
        if (error.code === '23505' || error.message?.includes('unique constraint')) {
            return res.status(400).json({ error: 'This slug is already in use by another project' })
        }
        throw error
    }

    res.status(200).json({
        uuid: project.uuid,
        chat_ui_enabled: project.chat_ui_enabled,
        chat_ui_rag_config: project.chat_ui_rag_config,
        chat_ui_slug: project.chat_ui_slug,
    })
}

chatUiConfigRouter.put('/', validateUuidParams('organization_uuid', 'uuid'), updateChatUiConfig)
