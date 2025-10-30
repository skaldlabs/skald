import express from 'express'
import { Request, Response } from 'express'
import { DI } from '../di'
import { User } from '../entities/User'
import { Organization } from '../entities/Organization'
import { FRONTEND_URL, IS_SELF_HOSTED_DEPLOY } from '../settings'
import { OrganizationMembershipRole } from '../entities/OrganizationMembership'
import { sendEmail } from '../lib/emailUtils'

export const organizationRouter = express.Router({ mergeParams: true })

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

    res.json(organization)
}

const create = async (req: Request, res: Response) => {
    if (IS_SELF_HOSTED_DEPLOY && (await DI.organizations.count()) >= 1) {
        return res.status(400).json({ error: 'Self-hosted deploys are not allowed to create organizations' })
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
        name,
        owner: user,
        created_at: new Date(),
        updated_at: new Date(),
    })

    DI.organizationMemberships.create({
        organization,
        user,
        joinedAt: new Date(),
        accessLevel: OrganizationMembershipRole.OWNER,
    })

    user.defaultOrganization = organization

    DI.projects.create({
        name: `${organization.name.split(' ')[0]} Default Project`,
        organization,
        owner: user,
        created_at: new Date(),
        updated_at: new Date(),
    })

    await DI.em.flush()

    res.status(201).json({ organization })
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
    const signupUrl = `${FRONTEND_URL}/signup?email=${inviteeEmail}`
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
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
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
        organization: organization,
        invitedBy: user,
        email: email,
        createdAt: new Date(),
    })

    await DI.em.flush()

    const { subject, html_content } = _generateInviteEmailContent(organization.name, email)
    const { data: _, error } = await sendEmail(email, subject, html_content)
    if (error) {
        return res.status(503).json({ error: 'Failed to send invitation email' })
    }

    res.status(200).json({ detail: 'Invitation sent successfully' })
}

const pendingInvites = async (req: Request, res: Response) => {
    res.json({ status: 'ok' })
}

const acceptInvite = async (req: Request, res: Response) => {
    res.json({ status: 'ok' })
}

const removeMember = async (req: Request, res: Response) => {
    res.json({ status: 'ok' })
}

const sentInvites = async (req: Request, res: Response) => {
    res.json({ status: 'ok' })
}

const cancelInvite = async (req: Request, res: Response) => {
    res.json({ status: 'ok' })
}

const resendInvite = async (req: Request, res: Response) => {
    res.json({ status: 'ok' })
}

organizationRouter.get('/', organization)
organizationRouter.post('/', create)
organizationRouter.get('/:id/members', members)
organizationRouter.post('/:id/invite_member', inviteMember)
organizationRouter.get('/:id/pending_invites', pendingInvites)
organizationRouter.post('/:id/accept_invite', acceptInvite)
organizationRouter.get('/:id/sent_invites', sentInvites)
organizationRouter.post('/:id/cancel_invite', cancelInvite)
organizationRouter.post('/:id/resend_invite', resendInvite)
organizationRouter.post('/:id/remove_member', removeMember)
