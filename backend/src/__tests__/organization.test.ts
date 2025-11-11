import express, { Express } from 'express'
import request from 'supertest'
import { MikroORM, RequestContext } from '@mikro-orm/postgresql'
import { organizationRouter } from '../api/organization'
import { DI } from '../di'
import { createTestDatabase, clearDatabase, closeDatabase } from './testDb'
import { createTestUser, createTestOrganization, createTestOrganizationMembership } from './testHelpers'
import { generateAccessToken } from '../lib/tokenUtils'
import { userMiddleware } from '../middleware/userMiddleware'
import { User } from '../entities/User'
import { Organization } from '../entities/Organization'
import { OrganizationMembership, OrganizationMembershipRole } from '../entities/OrganizationMembership'
import { OrganizationMembershipInvite } from '../entities/OrganizationMembershipInvite'
import { Project } from '../entities/Project'
import cookieParser from 'cookie-parser'
import * as emailUtils from '../lib/emailUtils'
import * as subscriptionService from '../services/subscriptionService'
import { randomUUID } from 'crypto'

// Mock external dependencies
jest.mock('../lib/emailUtils', () => ({
    sendEmail: jest.fn().mockResolvedValue({ error: null }),
    isValidEmail: jest.fn((email: string) => {
        // Basic email validation for testing
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    }),
}))

jest.mock('../services/subscriptionService')

describe('Organization API', () => {
    let app: Express
    let orm: MikroORM

    beforeAll(async () => {
        orm = await createTestDatabase()
        DI.orm = orm
        DI.em = orm.em
        DI.users = orm.em.getRepository(User)
        DI.organizations = orm.em.getRepository(Organization)
        DI.organizationMemberships = orm.em.getRepository(OrganizationMembership)
        DI.organizationMembershipInvites = orm.em.getRepository(OrganizationMembershipInvite)
        DI.projects = orm.em.getRepository(Project)

        // Mock subscription service
        ;(subscriptionService.SubscriptionService as jest.Mock).mockImplementation(() => ({
            createDefaultSubscription: jest.fn().mockResolvedValue({}),
        }))

        app = express()
        app.use(express.json())
        app.use(cookieParser())
        app.use((req, res, next) => RequestContext.create(orm.em, next))
        app.use(userMiddleware())
        app.use('/api/organization', organizationRouter)
    })

    afterAll(async () => {
        await closeDatabase(orm)
    })

    afterEach(async () => {
        await clearDatabase(orm)
        jest.clearAllMocks()
    })

    describe('GET /api/organization', () => {
        it('should return organization for member', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .get('/api/organization')
                .set('Cookie', [`accessToken=${token}`])

            expect(response.status).toBe(200)
            expect(response.body.uuid).toBe(org.uuid)
            expect(response.body.name).toBe('Test Org')
            expect(response.body.owner).toBe('test@example.com')
        })

        it('should return 404 when user has no organization', async () => {
            await createTestUser(orm, 'test@example.com', 'password123')
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .get('/api/organization')
                .set('Cookie', [`accessToken=${token}`])

            expect(response.status).toBe(404)
            expect(response.body.error).toBe('Organization not found')
        })

        it('should return 401 when not authenticated', async () => {
            const response = await request(app).get('/api/organization')

            expect(response.status).toBe(401)
        })
    })

    describe('POST /api/organization', () => {
        it('should create organization with valid data', async () => {
            await createTestUser(orm, 'test@example.com', 'password123')
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post('/api/organization')
                .set('Cookie', [`accessToken=${token}`])
                .send({
                    name: 'New Organization',
                })

            expect(response.status).toBe(201)
            expect(response.body.name).toBe('New Organization')
            expect(response.body.uuid).toBeDefined()
            expect(response.body.owner).toBe('test@example.com')
        })

        it('should create default project for new organization', async () => {
            await createTestUser(orm, 'test@example.com', 'password123')
            const token = generateAccessToken('test@example.com')

            await request(app)
                .post('/api/organization')
                .set('Cookie', [`accessToken=${token}`])
                .send({
                    name: 'Test Organization',
                })

            const em = orm.em.fork()
            const projects = await em.find(Project, {})
            expect(projects).toHaveLength(1)
            expect(projects[0].name).toContain('Default Project')
        })

        it('should set user default organization', async () => {
            await createTestUser(orm, 'test@example.com', 'password123')
            const token = generateAccessToken('test@example.com')

            await request(app)
                .post('/api/organization')
                .set('Cookie', [`accessToken=${token}`])
                .send({
                    name: 'Test Organization',
                })

            const em = orm.em.fork()
            const updatedUser = await em.findOne(
                User,
                { email: 'test@example.com' },
                { populate: ['defaultOrganization'] }
            )
            expect(updatedUser?.defaultOrganization).toBeDefined()
        })

        it('should create organization membership for creator', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const token = generateAccessToken('test@example.com')

            await request(app)
                .post('/api/organization')
                .set('Cookie', [`accessToken=${token}`])
                .send({
                    name: 'Test Organization',
                })

            const em = orm.em.fork()
            const membership = await em.findOne(OrganizationMembership, { user })
            expect(membership).toBeDefined()
            expect(membership?.accessLevel).toBe(OrganizationMembershipRole.OWNER)
        })

        it('should return 400 when name is missing', async () => {
            await createTestUser(orm, 'test@example.com', 'password123')
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post('/api/organization')
                .set('Cookie', [`accessToken=${token}`])
                .send({})

            expect(response.status).toBe(400)
            expect(response.body.error).toBe('Name is required')
        })

        it('should return 401 when not authenticated', async () => {
            const response = await request(app).post('/api/organization').send({
                name: 'Test Org',
            })

            expect(response.status).toBe(401)
        })
    })

    describe('GET /api/organization/:id/members', () => {
        it('should return organization members', async () => {
            const owner = await createTestUser(orm, 'owner@example.com', 'password123')
            const member = await createTestUser(orm, 'member@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', owner)
            await createTestOrganizationMembership(orm, owner, org, OrganizationMembershipRole.OWNER)
            await createTestOrganizationMembership(orm, member, org, OrganizationMembershipRole.MEMBER)

            const token = generateAccessToken('owner@example.com')

            const response = await request(app)
                .get(`/api/organization/${org.uuid}/members`)
                .set('Cookie', [`accessToken=${token}`])

            expect(response.status).toBe(200)
            expect(response.body).toHaveLength(2)
            expect(response.body.map((m: any) => m.email).sort()).toEqual(['member@example.com', 'owner@example.com'])
        })

        it('should return 401 when not authenticated', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)

            const response = await request(app).get(`/api/organization/${org.uuid}/members`)

            expect(response.status).toBe(401)
        })
    })

    describe('POST /api/organization/:id/invite_member', () => {
        it('should send invitation email', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post(`/api/organization/${org.uuid}/invite_member`)
                .set('Cookie', [`accessToken=${token}`])
                .send({
                    email: 'newuser@example.com',
                })

            expect(response.status).toBe(200)
            expect(response.body.detail).toBe('Invitation sent successfully')
            expect(emailUtils.sendEmail).toHaveBeenCalledWith(
                'newuser@example.com',
                expect.stringContaining('Invitation to join'),
                expect.stringContaining('Test Org')
            )
        })

        it('should create invite in database', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const token = generateAccessToken('test@example.com')

            await request(app)
                .post(`/api/organization/${org.uuid}/invite_member`)
                .set('Cookie', [`accessToken=${token}`])
                .send({
                    email: 'newuser@example.com',
                })

            const em = orm.em.fork()
            const invite = await em.findOne(OrganizationMembershipInvite, { email: 'newuser@example.com' })
            expect(invite).toBeDefined()
            expect(invite?.organization.uuid).toBe(org.uuid)
        })

        it('should normalize email to lowercase and trim', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const token = generateAccessToken('test@example.com')

            await request(app)
                .post(`/api/organization/${org.uuid}/invite_member`)
                .set('Cookie', [`accessToken=${token}`])
                .send({
                    email: '  NEWUSER@EXAMPLE.COM  ',
                })

            const em = orm.em.fork()
            const invite = await em.findOne(OrganizationMembershipInvite, { email: 'newuser@example.com' })
            expect(invite).toBeDefined()
        })

        it('should return 400 when email is missing', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post(`/api/organization/${org.uuid}/invite_member`)
                .set('Cookie', [`accessToken=${token}`])
                .send({})

            expect(response.status).toBe(400)
            expect(response.body.error).toBe('Email is required')
        })

        it('should return 400 for invalid email format', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post(`/api/organization/${org.uuid}/invite_member`)
                .set('Cookie', [`accessToken=${token}`])
                .send({
                    email: 'invalid-email',
                })

            expect(response.status).toBe(400)
            expect(response.body.error).toBe('Invalid email address')
        })

        it('should return 400 when user is already a member', async () => {
            const owner = await createTestUser(orm, 'owner@example.com', 'password123')
            const member = await createTestUser(orm, 'member@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', owner)
            await createTestOrganizationMembership(orm, owner, org)
            await createTestOrganizationMembership(orm, member, org)

            const token = generateAccessToken('owner@example.com')

            const response = await request(app)
                .post(`/api/organization/${org.uuid}/invite_member`)
                .set('Cookie', [`accessToken=${token}`])
                .send({
                    email: 'member@example.com',
                })

            expect(response.status).toBe(400)
            expect(response.body.error).toBe('User is already a member of this organization')
        })

        it('should return 503 when email fails to send', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const token = generateAccessToken('test@example.com')

            ;(emailUtils.sendEmail as jest.Mock).mockResolvedValueOnce({ error: 'Email failed' })

            const response = await request(app)
                .post(`/api/organization/${org.uuid}/invite_member`)
                .set('Cookie', [`accessToken=${token}`])
                .send({
                    email: 'newuser@example.com',
                })

            expect(response.status).toBe(503)
            expect(response.body.error).toBe('Failed to send invitation email')
        })
    })

    describe('GET /api/organization/pending_invites', () => {
        it('should return pending invites for the requesting user', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            const inviteUuid = randomUUID()

            const em = orm.em.fork()
            em.create(OrganizationMembershipInvite, {
                id: inviteUuid,
                organization: org,
                invitedBy: user,
                email: 'test@example.com',
                createdAt: new Date(),
            })

            // should not return this invite because it is not for the requesting user
            em.create(OrganizationMembershipInvite, {
                id: randomUUID(),
                organization: org,
                invitedBy: user,
                email: 'otheruser@example.com',
                createdAt: new Date(),
            })
            await em.flush()

            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .get(`/api/organization/pending_invites`)
                .set('Cookie', [`accessToken=${token}`])

            expect(response.status).toBe(200)
            expect(response.body).toHaveLength(1)
            expect(response.body[0].id).toBe(inviteUuid)
        })
    })

    describe('POST /api/organization/:id/accept_invite', () => {
        it('should accept valid invite', async () => {
            const inviter = await createTestUser(orm, 'inviter@example.com', 'password123')
            await createTestUser(orm, 'invitee@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', inviter)
            await createTestOrganizationMembership(orm, inviter, org)

            const inviteUuid = randomUUID()
            const em = orm.em.fork()
            em.create(OrganizationMembershipInvite, {
                id: inviteUuid,
                organization: org,
                invitedBy: inviter,
                email: 'invitee@example.com',
                createdAt: new Date(),
            })
            await em.flush()

            const token = generateAccessToken('invitee@example.com')

            const response = await request(app)
                .post(`/api/organization/${inviteUuid}/accept_invite`)
                .set('Cookie', [`accessToken=${token}`])

            expect(response.status).toBe(200)
            expect(response.body.detail).toBe('Invite accepted successfully')
        })

        it('should create membership after accepting invite', async () => {
            const inviter = await createTestUser(orm, 'inviter@example.com', 'password123')
            const invitee = await createTestUser(orm, 'invitee@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', inviter)

            const inviteUuid = randomUUID()
            const em = orm.em.fork()
            em.create(OrganizationMembershipInvite, {
                id: inviteUuid,
                organization: org,
                invitedBy: inviter,
                email: 'invitee@example.com',
                createdAt: new Date(),
            })
            await em.flush()

            const token = generateAccessToken('invitee@example.com')

            await request(app)
                .post(`/api/organization/${inviteUuid}/accept_invite`)
                .set('Cookie', [`accessToken=${token}`])

            const em2 = orm.em.fork()
            const membership = await em2.findOne(OrganizationMembership, { user: invitee, organization: org })
            expect(membership).toBeDefined()
            expect(membership?.accessLevel).toBe(OrganizationMembershipRole.MEMBER)
        })

        it('should return 404 when invite_id is missing', async () => {
            await createTestUser(orm, 'test@example.com', 'password123')
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post('/api/organization//accept_invite')
                .set('Cookie', [`accessToken=${token}`])

            expect(response.status).toBe(404)
        })

        it('should return 400 when invite id is not a valid UUID', async () => {
            await createTestUser(orm, 'test@example.com', 'password123')
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post('/api/organization/nonexistent/accept_invite')
                .set('Cookie', [`accessToken=${token}`])

            expect(response.status).toBe(400)
            expect(response.body.error).toBe('Invalid UUID format')
        })

        it('should return 404 when invite does not exist', async () => {
            await createTestUser(orm, 'test@example.com', 'password123')
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post(`/api/organization/${randomUUID()}/accept_invite`)
                .set('Cookie', [`accessToken=${token}`])

            expect(response.status).toBe(404)
        })
    })

    describe('POST /api/organization/:id/remove_member', () => {
        it('should remove member from organization', async () => {
            const owner = await createTestUser(orm, 'owner@example.com', 'password123')
            const member = await createTestUser(orm, 'member@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', owner)
            await createTestOrganizationMembership(orm, owner, org, OrganizationMembershipRole.OWNER)
            await createTestOrganizationMembership(orm, member, org, OrganizationMembershipRole.MEMBER)

            const token = generateAccessToken('owner@example.com')

            const response = await request(app)
                .post(`/api/organization/${org.uuid}/remove_member`)
                .set('Cookie', [`accessToken=${token}`])
                .send({
                    email: 'member@example.com',
                })

            expect(response.status).toBe(200)
            expect(response.body.detail).toBe('Member removed successfully')

            const em = orm.em.fork()
            const membership = await em.findOne(OrganizationMembership, { user: member, organization: org })
            expect(membership).toBeNull()
        })

        it('should return 400 when trying to remove self', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)

            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post(`/api/organization/${org.uuid}/remove_member`)
                .set('Cookie', [`accessToken=${token}`])
                .send({
                    email: 'test@example.com',
                })

            expect(response.status).toBe(400)
            expect(response.body.error).toBe('You cannot remove yourself from the organization')
        })

        it('should return 400 when trying to remove owner', async () => {
            const owner = await createTestUser(orm, 'owner@example.com', 'password123')
            const admin = await createTestUser(orm, 'admin@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', owner)
            await createTestOrganizationMembership(orm, owner, org, OrganizationMembershipRole.OWNER)
            await createTestOrganizationMembership(orm, admin, org, OrganizationMembershipRole.MEMBER)

            const token = generateAccessToken('admin@example.com')

            const response = await request(app)
                .post(`/api/organization/${org.uuid}/remove_member`)
                .set('Cookie', [`accessToken=${token}`])
                .send({
                    email: 'owner@example.com',
                })

            expect(response.status).toBe(400)
            expect(response.body.error).toBe('Cannot remove organization owner')
        })
    })

    describe('GET /api/organization/:id/sent_invites', () => {
        it('should return sent invites for organization', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)

            const inviteUuid = randomUUID()
            const em = orm.em.fork()
            em.create(OrganizationMembershipInvite, {
                id: inviteUuid,
                organization: org,
                invitedBy: user,
                email: 'invite1@example.com',
                createdAt: new Date(),
            })
            const inviteUuid2 = randomUUID()
            em.create(OrganizationMembershipInvite, {
                id: inviteUuid2,
                organization: org,
                invitedBy: user,
                email: 'invite2@example.com',
                createdAt: new Date(),
            })
            await em.flush()

            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .get(`/api/organization/${org.uuid}/sent_invites`)
                .set('Cookie', [`accessToken=${token}`])

            expect(response.status).toBe(200)
            expect(response.body).toHaveLength(2)
        })
    })

    describe('POST /api/organization/:id/cancel_invite', () => {
        it('should cancel pending invite', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)

            const inviteUuid = randomUUID()
            const em = orm.em.fork()
            em.create(OrganizationMembershipInvite, {
                id: inviteUuid,
                organization: org,
                invitedBy: user,
                email: 'invitee@example.com',
                createdAt: new Date(),
            })
            await em.flush()

            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post(`/api/organization/${org.uuid}/cancel_invite`)
                .set('Cookie', [`accessToken=${token}`])
                .send({
                    invite_id: inviteUuid,
                })

            expect(response.status).toBe(200)
            expect(response.body.detail).toBe('Invite cancelled successfully')

            const em2 = orm.em.fork()
            const invite = await em2.findOne(OrganizationMembershipInvite, { id: inviteUuid })
            expect(invite).toBeNull()
        })
    })

    describe('POST /api/organization/:id/resend_invite', () => {
        it('should resend invitation email', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)

            const inviteUuid = randomUUID()
            const em = orm.em.fork()
            em.create(OrganizationMembershipInvite, {
                id: inviteUuid,
                organization: org,
                invitedBy: user,
                email: 'invitee@example.com',
                createdAt: new Date(),
            })
            await em.flush()

            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post(`/api/organization/${org.uuid}/resend_invite`)
                .set('Cookie', [`accessToken=${token}`])
                .send({
                    invite_id: inviteUuid,
                })

            expect(response.status).toBe(200)
            expect(response.body.detail).toBe('Invitation resent successfully')
            expect(emailUtils.sendEmail).toHaveBeenCalled()
        })
    })
})
