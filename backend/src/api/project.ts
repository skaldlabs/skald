import express from 'express'
import { Request, Response } from 'express'
import { DI } from '@/di'
import { Project } from '@/entities/Project'
import { OrganizationMembershipRole } from '@/entities/OrganizationMembership'
import { Memo } from '@/entities/Memo'
import { MemoChunk } from '@/entities/MemoChunk'
import { MemoTag } from '@/entities/MemoTag'
import { MemoSummary } from '@/entities/MemoSummary'
import { MemoContent } from '@/entities/MemoContent'
import { ProjectAPIKey } from '@/entities/ProjectAPIKey'
import { trackUsage } from '@/middleware/usageTracking'
import { validateUuidParams } from '@/middleware/validateUuidMiddleware'
import crypto, { randomUUID } from 'crypto'
import { posthogCapture } from '@/lib/posthogUtils'
import { ChatMessage } from '@/entities/ChatMessage'
import { Chat } from '@/entities/Chat'

export const projectRouter = express.Router({ mergeParams: true })

// Validate organization_uuid for all routes
projectRouter.use(validateUuidParams('organization_uuid'))

interface ProjectResponse {
    uuid: string
    name: string
    organization: string
    owner: string
    created_at: Date
    updated_at: Date
    has_api_key: boolean
    api_key_first_12_digits: string | null
}

interface GenerateApiKeyResponse {
    api_key: string
}

const generateApiKey = (prefix: string): string => {
    const randomBytes = crypto.randomBytes(20).toString('hex')
    return `${prefix}_${randomBytes}`
}

const hashApiKey = (apiKey: string): string => {
    return crypto.createHash('sha3-256').update(apiKey, 'utf-8').digest('hex')
}

const formatProjectResponse = async (project: any): Promise<ProjectResponse> => {
    const apiKey = await DI.projectAPIKeys.findOne({ project: project })
    return {
        uuid: project.uuid,
        name: project.name,
        organization: project.organization.uuid,
        owner: project.owner.email,
        created_at: project.created_at,
        updated_at: project.updated_at,
        has_api_key: !!apiKey,
        api_key_first_12_digits: apiKey?.first_12_digits || null,
    }
}

const list = async (req: Request, res: Response) => {
    const user = req.context?.requestUser?.userInstance
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    const organizationUuid = req.params.organization_uuid
    if (!organizationUuid) {
        return res.status(400).json({ error: 'Organization UUID is required' })
    }

    const organization = await DI.organizations.findOne({ uuid: organizationUuid }, { populate: ['owner'] })
    if (!organization) {
        return res.status(404).json({ error: 'Organization not found' })
    }

    const membership = await DI.organizationMemberships.findOne({
        user: user,
        organization: organization,
    })
    if (!membership) {
        return res.status(404).json({ error: 'Organization not found' })
    }

    const projects = await DI.projects.find({ organization: organization }, { populate: ['organization', 'owner'] })

    const projectResponses = await Promise.all(projects.map((project) => formatProjectResponse(project)))

    res.status(200).json(projectResponses)
}

const retrieve = async (req: Request, res: Response) => {
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
    if (!membership) {
        return res.status(403).json({ error: 'You are not a member of this organization' })
    }

    const project = await DI.projects.findOne(
        { uuid: projectUuid, organization: organization },
        { populate: ['organization', 'owner'] }
    )
    if (!project) {
        return res.status(404).json({ error: 'Project not found' })
    }

    const projectResponse = await formatProjectResponse(project)
    res.status(200).json(projectResponse)
}

const create = async (req: Request, res: Response) => {
    const name = req.body.name
    const user = req.context?.requestUser?.userInstance
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    const organizationUuid = req.params.organization_uuid
    if (!organizationUuid) {
        return res.status(400).json({ error: 'Organization UUID is required' })
    }

    if (!name) {
        return res.status(400).json({ error: 'Name is required' })
    }

    const organization = await DI.organizations.findOne({ uuid: organizationUuid })
    if (!organization) {
        return res.status(404).json({ error: 'Organization not found' })
    }

    const membership = await DI.organizationMemberships.findOne({
        user: user,
        organization: organization,
    })
    if (!membership) {
        return res.status(403).json({ error: 'You are not a member of this organization' })
    }

    const project = DI.projects.create({
        uuid: randomUUID(),
        name,
        organization,
        owner: user,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    })

    await DI.em.flush()

    posthogCapture('project_created', user.email, {
        organization_name: organization.name,
        organization_uuid: organization.uuid,
        project_name: project.name,
        project_uuid: project.uuid,
    })

    const projectResponse = await formatProjectResponse(project)
    res.status(201).json(projectResponse)
}

const update = async (req: Request, res: Response) => {
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

    if (req.body.name) {
        project.name = req.body.name
        project.updated_at = new Date()
    }

    await DI.em.flush()

    posthogCapture('project_updated', user.email, {
        organization_name: organization.name,
        organization_uuid: organization.uuid,
        project_name: project.name,
        project_uuid: project.uuid,
    })

    const projectResponse = await formatProjectResponse(project)
    res.status(200).json(projectResponse)
}

const destroy = async (req: Request, res: Response) => {
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
        return res.status(403).json({ error: 'You do not have permission to delete this project' })
    }

    const project = await DI.projects.findOne({ uuid: projectUuid, organization: organization })
    if (!project) {
        return res.status(404).json({ error: 'Project not found' })
    }

    // Delete all related data atomically within a transaction
    await DI.em.transactional(async (em) => {
        const memos = await em.find(Memo, { project: project })

        // Delete all memo-related data
        await em.nativeDelete(MemoChunk, { project: project })
        await em.nativeDelete(MemoTag, { project: project })
        await em.nativeDelete(MemoSummary, { project: project })

        // Delete memo contents for all memos in this project
        if (memos.length > 0) {
            await em.nativeDelete(MemoContent, { memo: { $in: memos.map((m) => m.uuid) } })
        }

        // Delete all memos
        await em.nativeDelete(Memo, { project: project })

        // Delete project API keys
        await em.nativeDelete(ProjectAPIKey, { project: project })

        // Delete project chat history
        await em.nativeDelete(ChatMessage, { project: project })
        await em.nativeDelete(Chat, { project: project })

        // Delete the project itself
        await em.nativeDelete(Project, { uuid: project.uuid })
    })

    posthogCapture('project_deleted', user.email, {
        organization_name: organization.name,
        organization_uuid: organization.uuid,
        project_name: project.name,
        project_uuid: project.uuid,
    })

    res.status(204).send()
}

const generateApiKeyEndpoint = async (req: Request, res: Response) => {
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
    if (!membership) {
        return res.status(403).json({ error: 'You are not a member of this organization' })
    }

    const project = await DI.projects.findOne({ uuid: projectUuid, organization: organization })
    if (!project) {
        return res.status(404).json({ error: 'Project not found' })
    }

    const apiKey = generateApiKey('sk_proj')
    const apiKeyHash = hashApiKey(apiKey)

    // Delete existing API key if it exists
    await DI.projectAPIKeys.nativeDelete({ project: project })

    DI.projectAPIKeys.create({
        api_key_hash: apiKeyHash,
        first_12_digits: apiKey.substring(0, 12),
        project: project,
        created_at: new Date(),
    })

    await DI.em.flush()

    const response: GenerateApiKeyResponse = {
        api_key: apiKey,
    }

    res.status(200).json(response)
}

projectRouter.get('/', list)
projectRouter.post('/', trackUsage('projects'), create)
projectRouter.get('/:uuid', validateUuidParams('uuid'), retrieve)
projectRouter.put('/:uuid', validateUuidParams('uuid'), update)
projectRouter.delete('/:uuid', validateUuidParams('uuid'), destroy)
projectRouter.post('/:uuid/generate_api_key', validateUuidParams('uuid'), generateApiKeyEndpoint)
