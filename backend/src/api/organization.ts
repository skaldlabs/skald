import express from 'express'
import { Request, Response } from 'express'
import { DI } from '@/di'
import { User } from '@/entities/User'
import { Organization } from '@/entities/Organization'
import { FRONTEND_URL, IS_SELF_HOSTED_DEPLOY } from '@/settings'
import { OrganizationMembershipRole } from '@/entities/OrganizationMembership'
import { sendEmail, isValidEmail } from '@/lib/emailUtils'
import { SubscriptionService } from '@/services/subscriptionService'
import { randomUUID } from 'crypto'
import { validateUuidParams } from '@/middleware/validateUuidMiddleware'
import { logger } from '@/lib/logger'

export const organizationRouter = express.Router({ mergeParams: true })

interface OrganizationResponse {
    uuid: string
    name: string
    owner: string
    created_at: Date
    updated_at: Date
}

const getUserOrganization = async (user: User): Promise<Organization | null> => {
    const memberships = await DI.organizationMemberships.find(
        {
            user: user,
        },
        { populate: ['organization'] }
    )

    if (memberships.length === 0) {
        return null
    }

    return memberships[0].organization
}

const organization = async (req: Request, res: Response) => {
    const user = req.context?.requestUser?.userInstance
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    const organization = await getUserOrganization(user)

    if (!organization) {
        return res.status(404).json({ error: 'Organization not found' })
    }

    const organizationResponse: OrganizationResponse = {
        uuid: organization.uuid,
        name: organization.name,
        owner: organization.owner.email,
        created_at: organization.created_at,
        updated_at: organization.updated_at,
    }

    res.status(200).json(organizationResponse)
}

const create = async (req: Request, res: Response) => {
    if (IS_SELF_HOSTED_DEPLOY && (await DI.organizations.count()) >= 1) {
        return res.status(400).json({ error: 'You can only create one organization in a self-hosted deploy' })
    }
    const name = req.body.name
    const user = req.context?.requestUser?.userInstance
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' })
    }
    if (!name) {
        return res.status(400).json({ error: 'Name is required' })
    }

    const organization = DI.organizations.create({
        uuid: randomUUID(),
        name,
        owner: user,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    })

    DI.organizationMemberships.create({
        organization,
        user,
        joinedAt: new Date().toISOString(),
        accessLevel: OrganizationMembershipRole.OWNER,
    })

    user.defaultOrganization = organization

    DI.projects.create({
        uuid: randomUUID(),
        name: `${organization.name.split(' ')[0]} Default Project`,
        organization,
        owner: user,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    })

    if (!IS_SELF_HOSTED_DEPLOY) {
        const subscriptionService = new SubscriptionService()
        await subscriptionService.createDefaultSubscription(organization, DI.em)
    }

    await DI.em.flush()

    const organizationResponse: OrganizationResponse = {
        uuid: organization.uuid,
        name: organization.name,
        owner: organization.owner.email,
        created_at: organization.created_at,
        updated_at: organization.updated_at,
    }

    res.status(201).json(organizationResponse)
}

const members = async (req: Request, res: Response) => {
    const user = req.context?.requestUser?.userInstance
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    const organization = await getUserOrganization(user)
    if (!organization) {
        return res.status(404).json({ error: 'Organization not found' })
    }
    const members = await DI.organizationMemberships.find(
        {
            organization: organization,
        },
        { populate: ['user'] }
    )
    const membersInfo = members.map((m) => ({
        email: m.user.email,
        name: m.user.name || '',
        role: OrganizationMembershipRole[m.accessLevel as OrganizationMembershipRole] ?? 'MEMBER',
        joined_at: m.joinedAt.toISOString(),
    }))

    res.status(200).json(membersInfo)
}

const _generateInviteEmailContent = (organizationName: string, inviteeEmail: string) => {
    const signupUrl = `${FRONTEND_URL}/signup?email=${encodeURIComponent(inviteeEmail)}`
    const subject = `Invitation to join ${organizationName} on Skald`
    const html_content = `
    <h2>You've been invited to join ${organizationName} on Skald!</h2>
    <p>Click the link below to sign up and join the organization:</p>
    <p><a href="${signupUrl}">Join ${organizationName}</a></p>
    `
    return { subject, html_content }
}

const inviteMember = async (req: Request, res: Response) => {
    let email = req.body.email
    const user = req.context?.requestUser?.userInstance
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' })
    }
    if (!email) {
        return res.status(400).json({ error: 'Email is required' })
    }
    if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Invalid email address' })
    }
    email = email.toLowerCase().trim()
    const organization = await getUserOrganization(user)
    if (!organization) {
        return res.status(404).json({ error: 'Organization not found' })
    }
    const existingMembership = await DI.organizationMemberships.findOne({
        organization: organization,
        user: { email: email },
    })
    if (existingMembership) {
        return res.status(400).json({ error: 'User is already a member of this organization' })
    }

    DI.organizationMembershipInvites.create({
        id: randomUUID(),
        organization: organization,
        invitedBy: user,
        email: email,
        createdAt: new Date(),
    })

    await DI.em.flush()

    const { subject, html_content } = _generateInviteEmailContent(organization.name, email)
    const { error } = await sendEmail(email, subject, html_content)
    if (error) {
        return res.status(503).json({ error: 'Failed to send invitation email' })
    }

    res.status(200).json({ detail: 'Invitation sent successfully' })
}

const pendingInvites = async (req: Request, res: Response) => {
    const user = req.context?.requestUser?.userInstance
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    // Find invites where the current user's email matches the invited email
    const invites = await DI.organizationMembershipInvites.find({
        email: user.email,
        acceptedAt: null,
    })

    if (invites.length === 0) {
        return res.status(200).json([])
    }

    const invitesInfo = invites.map((i) => ({
        id: i.id,
        organization_uuid: i.organization.uuid,
        organization_name: i.organization.name,
    }))
    res.status(200).json(invitesInfo)
}

const acceptInvite = async (req: Request, res: Response) => {
    const user = req.context?.requestUser?.userInstance
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    const inviteId = req.params.id
    if (!inviteId) {
        return res.status(400).json({ error: 'Invite ID is required' })
    }

    const invite = await DI.organizationMembershipInvites.findOne({
        id: inviteId,
        email: user.email,
        acceptedAt: null,
    })
    if (!invite) {
        return res.status(404).json({ error: 'No pending invite found' })
    }

    const organization = invite.organization
    DI.organizationMemberships.create({
        user,
        organization,
        accessLevel: OrganizationMembershipRole.MEMBER,
        joinedAt: new Date().toISOString(),
    })
    invite.acceptedAt = new Date()
    user.defaultOrganization = organization

    await DI.em.flush()

    res.status(200).json({ detail: 'Invite accepted successfully' })
}

const removeMember = async (req: Request, res: Response) => {
    let email = req.body.email
    const user = req.context?.requestUser?.userInstance
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' })
    }
    if (!email) {
        return res.status(400).json({ error: 'Email is required' })
    }

    email = email.toLowerCase().trim()
    const organization = await getUserOrganization(user)
    if (!organization) {
        return res.status(404).json({ error: 'Organization not found' })
    }

    const membership = await DI.organizationMemberships.findOne(
        {
            organization: organization,
            user: { email: email },
        },
        { populate: ['user'] }
    )

    if (!membership) {
        return res.status(404).json({ error: 'User is not a member of this organization' })
    }

    if (membership.user.email === user.email) {
        return res.status(400).json({ error: 'You cannot remove yourself from the organization' })
    }

    if (membership.accessLevel === OrganizationMembershipRole.OWNER) {
        return res.status(400).json({ error: 'Cannot remove organization owner' })
    }

    await DI.organizationMemberships.nativeDelete({ id: membership.id })

    if (membership.user.defaultOrganization?.uuid === organization.uuid) {
        membership.user.defaultOrganization = undefined
        await DI.em.flush()
    }

    res.status(200).json({ detail: 'Member removed successfully' })
}

const sentInvites = async (req: Request, res: Response) => {
    const user = req.context?.requestUser?.userInstance
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    const organization = await getUserOrganization(user)
    if (!organization) {
        return res.status(404).json({ error: 'Organization not found' })
    }

    const invites = await DI.organizationMembershipInvites.find(
        {
            organization: organization,
            acceptedAt: null,
        },
        {
            populate: ['invitedBy'],
            orderBy: { createdAt: 'DESC' },
        }
    )

    const invitesInfo = invites.map((i) => ({
        id: i.id,
        email: i.email,
        created_at: i.createdAt.toISOString(),
        invited_by_name: i.invitedBy.name || '',
        invited_by_email: i.invitedBy.email,
    }))

    res.status(200).json(invitesInfo)
}

const cancelInvite = async (req: Request, res: Response) => {
    const inviteId = req.body.invite_id
    const user = req.context?.requestUser?.userInstance
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' })
    }
    if (!inviteId) {
        return res.status(400).json({ error: 'Invite ID is required' })
    }

    const organization = await getUserOrganization(user)
    if (!organization) {
        return res.status(404).json({ error: 'Organization not found' })
    }

    const invite = await DI.organizationMembershipInvites.findOne({
        id: inviteId,
        organization: organization,
        acceptedAt: null,
    })

    if (!invite) {
        return res.status(404).json({ error: 'Invite not found or already accepted' })
    }

    await DI.organizationMembershipInvites.nativeDelete({ id: invite.id })

    res.status(200).json({ detail: 'Invite cancelled successfully' })
}

const resendInvite = async (req: Request, res: Response) => {
    const inviteId = req.body.invite_id
    const user = req.context?.requestUser?.userInstance
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' })
    }
    if (!inviteId) {
        return res.status(400).json({ error: 'Invite ID is required' })
    }

    const organization = await getUserOrganization(user)
    if (!organization) {
        return res.status(404).json({ error: 'Organization not found' })
    }

    const invite = await DI.organizationMembershipInvites.findOne({
        id: inviteId,
        organization: organization,
        acceptedAt: null,
    })

    if (!invite) {
        return res.status(404).json({ error: 'Invite not found or already accepted' })
    }

    const { subject, html_content } = _generateInviteEmailContent(organization.name, invite.email)
    const { error } = await sendEmail(invite.email, subject, html_content)
    if (error) {
        return res.status(503).json({ error: 'Failed to resend invitation' })
    }

    res.status(200).json({ detail: 'Invitation resent successfully' })
}

organizationRouter.get('/', organization)
organizationRouter.post('/', create)
organizationRouter.get('/:id/members', validateUuidParams('id'), members)
organizationRouter.post('/:id/invite_member', validateUuidParams('id'), inviteMember)
organizationRouter.get('/:id/pending_invites', validateUuidParams('id'), pendingInvites)
organizationRouter.post('/:id/accept_invite', validateUuidParams('id'), acceptInvite)
organizationRouter.get('/:id/sent_invites', validateUuidParams('id'), sentInvites)
organizationRouter.post('/:id/cancel_invite', validateUuidParams('id'), cancelInvite)
organizationRouter.post('/:id/resend_invite', validateUuidParams('id'), resendInvite)
organizationRouter.post('/:id/remove_member', validateUuidParams('id'), removeMember)
