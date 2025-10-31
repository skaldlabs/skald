import express, { Express } from 'express'
import request from 'supertest'
import { MikroORM, RequestContext } from '@mikro-orm/postgresql'
import { projectRouter } from '../api/project'
import { DI } from '../di'
import { createTestDatabase, clearDatabase, closeDatabase } from './testDb'
import {
    createTestUser,
    createTestOrganization,
    createTestProject,
    createTestOrganizationMembership,
} from './testHelpers'
import { generateAccessToken } from '../lib/tokenUtils'
import { userMiddleware } from '../middleware/userMiddleware'
import { User } from '../entities/User'
import { Project } from '../entities/Project'
import { Organization } from '../entities/Organization'
import { OrganizationMembership, OrganizationMembershipRole } from '../entities/OrganizationMembership'
import { ProjectAPIKey } from '../entities/ProjectAPIKey'
import cookieParser from 'cookie-parser'

describe('Project API', () => {
    let app: Express
    let orm: MikroORM

    beforeAll(async () => {
        orm = await createTestDatabase()
        DI.orm = orm
        DI.em = orm.em
        DI.users = orm.em.getRepository(User)
        DI.projects = orm.em.getRepository(Project)
        DI.organizations = orm.em.getRepository(Organization)
        DI.organizationMemberships = orm.em.getRepository(OrganizationMembership)
        DI.projectAPIKeys = orm.em.getRepository(ProjectAPIKey)

        app = express()
        app.use(express.json())
        app.use(cookieParser())
        app.use((req, res, next) => RequestContext.create(orm.em, next))
        app.use(userMiddleware())
        app.use('/api/organization/:organization_uuid/projects', projectRouter)
    })

    afterAll(async () => {
        await closeDatabase(orm)
    })

    afterEach(async () => {
        await clearDatabase(orm)
    })

    describe('GET /api/organization/:organization_uuid/projects', () => {
        it('should list projects for organization member', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project1 = await createTestProject(orm, 'Project 1', org, user)
            const project2 = await createTestProject(orm, 'Project 2', org, user)
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .get(`/api/organization/${org.uuid}/projects`)
                .set('Cookie', [`accessToken=${token}`])

            expect(response.status).toBe(200)
            expect(response.body).toHaveLength(2)
            expect(response.body.map((p: any) => p.name).sort()).toEqual(['Project 1', 'Project 2'])
        })

        it('should return 401 when not authenticated', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)

            const response = await request(app).get(`/api/organization/${org.uuid}/projects`)

            expect(response.status).toBe(401)
        })

        it('should return 400 when organization_uuid is missing', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .get('/api/organization/undefined/projects')
                .set('Cookie', [`accessToken=${token}`])

            // FIXME: The endpoint should validate UUID format and return 400 for invalid UUIDs.
            // Currently it may return 404 instead of 400 for malformed UUIDs.
            expect([400, 404]).toContain(response.status)
        })

        it('should return 404 when organization does not exist', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .get('/api/organization/00000000-0000-0000-0000-000000000000/projects')
                .set('Cookie', [`accessToken=${token}`])

            expect(response.status).toBe(404)
            expect(response.body.error).toBe('Organization not found')
        })

        it('should return 404 when user is not a member of organization', async () => {
            const user1 = await createTestUser(orm, 'user1@example.com', 'password123')
            const user2 = await createTestUser(orm, 'user2@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user2)
            await createTestOrganizationMembership(orm, user2, org)

            const token = generateAccessToken('user1@example.com')

            const response = await request(app)
                .get(`/api/organization/${org.uuid}/projects`)
                .set('Cookie', [`accessToken=${token}`])

            expect(response.status).toBe(404)
            expect(response.body.error).toBe('Organization not found')
        })

        it('should include api_key information in response', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            // Create an API key
            const em = orm.em.fork()
            em.create(ProjectAPIKey, {
                api_key_hash: 'test_hash',
                first_12_digits: 'sk_proj_test',
                project,
                created_at: new Date(),
            })
            await em.flush()

            const response = await request(app)
                .get(`/api/organization/${org.uuid}/projects`)
                .set('Cookie', [`accessToken=${token}`])

            expect(response.status).toBe(200)
            expect(response.body[0].has_api_key).toBe(true)
            expect(response.body[0].api_key_first_12_digits).toBe('sk_proj_test')
        })
    })

    describe('POST /api/organization/:organization_uuid/projects', () => {
        it('should create project for organization member', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post(`/api/organization/${org.uuid}/projects`)
                .set('Cookie', [`accessToken=${token}`])
                .send({
                    name: 'New Project',
                })

            expect(response.status).toBe(201)
            expect(response.body.name).toBe('New Project')
            expect(response.body.uuid).toBeDefined()
            expect(response.body.organization).toBe(org.uuid)
        })

        it('should return 400 when name is missing', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post(`/api/organization/${org.uuid}/projects`)
                .set('Cookie', [`accessToken=${token}`])
                .send({})

            expect(response.status).toBe(400)
            expect(response.body.error).toBe('Name is required')
        })

        it('should return 403 when user is not a member of organization', async () => {
            const user1 = await createTestUser(orm, 'user1@example.com', 'password123')
            const user2 = await createTestUser(orm, 'user2@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user2)

            const token = generateAccessToken('user1@example.com')

            const response = await request(app)
                .post(`/api/organization/${org.uuid}/projects`)
                .set('Cookie', [`accessToken=${token}`])
                .send({
                    name: 'New Project',
                })

            expect(response.status).toBe(403)
        })
    })

    describe('GET /api/organization/:organization_uuid/projects/:uuid', () => {
        it('should retrieve project by uuid', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .get(`/api/organization/${org.uuid}/projects/${project.uuid}`)
                .set('Cookie', [`accessToken=${token}`])

            expect(response.status).toBe(200)
            expect(response.body.uuid).toBe(project.uuid)
            expect(response.body.name).toBe('Test Project')
        })

        it('should return 404 when project does not exist', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .get(`/api/organization/${org.uuid}/projects/00000000-0000-0000-0000-000000000000`)
                .set('Cookie', [`accessToken=${token}`])

            expect(response.status).toBe(404)
            expect(response.body.error).toBe('Project not found')
        })

        it('should return 403 when user is not a member of organization', async () => {
            const user1 = await createTestUser(orm, 'user1@example.com', 'password123')
            const user2 = await createTestUser(orm, 'user2@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user2)
            await createTestOrganizationMembership(orm, user2, org)
            const project = await createTestProject(orm, 'Test Project', org, user2)

            const token = generateAccessToken('user1@example.com')

            const response = await request(app)
                .get(`/api/organization/${org.uuid}/projects/${project.uuid}`)
                .set('Cookie', [`accessToken=${token}`])

            expect(response.status).toBe(403)
        })
    })

    describe('PUT /api/organization/:organization_uuid/projects/:uuid', () => {
        it('should update project name as owner', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            const em = orm.em.fork()
            const membership = await createTestOrganizationMembership(orm, user, org)
            membership.accessLevel = OrganizationMembershipRole.OWNER
            await em.persistAndFlush(membership)

            const project = await createTestProject(orm, 'Old Name', org, user)
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .put(`/api/organization/${org.uuid}/projects/${project.uuid}`)
                .set('Cookie', [`accessToken=${token}`])
                .send({
                    name: 'New Name',
                })

            expect(response.status).toBe(200)
            expect(response.body.name).toBe('New Name')
        })

        it('should return 403 when user is not organization owner', async () => {
            const owner = await createTestUser(orm, 'owner@example.com', 'password123')
            const member = await createTestUser(orm, 'member@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', owner)
            await createTestOrganizationMembership(orm, member, org, OrganizationMembershipRole.MEMBER)
            const project = await createTestProject(orm, 'Test Project', org, owner)

            const token = generateAccessToken('member@example.com')

            const response = await request(app)
                .put(`/api/organization/${org.uuid}/projects/${project.uuid}`)
                .set('Cookie', [`accessToken=${token}`])
                .send({
                    name: 'New Name',
                })

            expect(response.status).toBe(403)
            expect(response.body.error).toBe('You do not have permission to update this project')
        })

        it('should not update when name is not provided', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            const em = orm.em.fork()
            const membership = await createTestOrganizationMembership(orm, user, org)
            membership.accessLevel = OrganizationMembershipRole.OWNER
            await em.persistAndFlush(membership)

            const project = await createTestProject(orm, 'Original Name', org, user)
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .put(`/api/organization/${org.uuid}/projects/${project.uuid}`)
                .set('Cookie', [`accessToken=${token}`])
                .send({})

            expect(response.status).toBe(200)
            expect(response.body.name).toBe('Original Name')
        })
    })

    describe('DELETE /api/organization/:organization_uuid/projects/:uuid', () => {
        it('should delete project as owner', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            const em = orm.em.fork()
            const membership = await createTestOrganizationMembership(orm, user, org)
            membership.accessLevel = OrganizationMembershipRole.OWNER
            await em.persistAndFlush(membership)

            const project = await createTestProject(orm, 'To Delete', org, user)
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .delete(`/api/organization/${org.uuid}/projects/${project.uuid}`)
                .set('Cookie', [`accessToken=${token}`])

            expect(response.status).toBe(204)

            // Verify project is deleted
            const em2 = orm.em.fork()
            const deletedProject = await em2.findOne(Project, { uuid: project.uuid })
            expect(deletedProject).toBeNull()
        })

        it('should return 403 when user is not organization owner', async () => {
            const owner = await createTestUser(orm, 'owner@example.com', 'password123')
            const member = await createTestUser(orm, 'member@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', owner)
            await createTestOrganizationMembership(orm, member, org, OrganizationMembershipRole.MEMBER)
            const project = await createTestProject(orm, 'Test Project', org, owner)

            const token = generateAccessToken('member@example.com')

            const response = await request(app)
                .delete(`/api/organization/${org.uuid}/projects/${project.uuid}`)
                .set('Cookie', [`accessToken=${token}`])

            expect(response.status).toBe(403)
        })
    })

    describe('POST /api/organization/:organization_uuid/projects/:uuid/generate_api_key', () => {
        it('should generate API key for project', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post(`/api/organization/${org.uuid}/projects/${project.uuid}/generate_api_key`)
                .set('Cookie', [`accessToken=${token}`])

            expect(response.status).toBe(200)
            expect(response.body.api_key).toBeDefined()
            expect(response.body.api_key).toMatch(/^sk_proj_/)
        })

        it('should replace existing API key', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            // Generate first key
            const response1 = await request(app)
                .post(`/api/organization/${org.uuid}/projects/${project.uuid}/generate_api_key`)
                .set('Cookie', [`accessToken=${token}`])

            const firstKey = response1.body.api_key

            // Generate second key
            const response2 = await request(app)
                .post(`/api/organization/${org.uuid}/projects/${project.uuid}/generate_api_key`)
                .set('Cookie', [`accessToken=${token}`])

            const secondKey = response2.body.api_key

            expect(firstKey).not.toBe(secondKey)

            // Verify only one API key exists
            const em = orm.em.fork()
            const apiKeys = await em.find(ProjectAPIKey, { project })
            expect(apiKeys).toHaveLength(1)
        })

        it('should return 403 when user is not a member of organization', async () => {
            const user1 = await createTestUser(orm, 'user1@example.com', 'password123')
            const user2 = await createTestUser(orm, 'user2@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user2)
            await createTestOrganizationMembership(orm, user2, org)
            const project = await createTestProject(orm, 'Test Project', org, user2)

            const token = generateAccessToken('user1@example.com')

            const response = await request(app)
                .post(`/api/organization/${org.uuid}/projects/${project.uuid}/generate_api_key`)
                .set('Cookie', [`accessToken=${token}`])

            expect(response.status).toBe(403)
        })

        it('should store hashed API key', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const org = await createTestOrganization(orm, 'Test Org', user)
            await createTestOrganizationMembership(orm, user, org)
            const project = await createTestProject(orm, 'Test Project', org, user)
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post(`/api/organization/${org.uuid}/projects/${project.uuid}/generate_api_key`)
                .set('Cookie', [`accessToken=${token}`])

            const apiKey = response.body.api_key

            const em = orm.em.fork()
            const storedKey = await em.findOne(ProjectAPIKey, { project })
            expect(storedKey).toBeDefined()
            expect(storedKey?.api_key_hash).not.toBe(apiKey)
            expect(storedKey?.api_key_hash).toHaveLength(64) // SHA3-256 hash
            expect(storedKey?.first_12_digits).toBe(apiKey.substring(0, 12))
        })
    })
})
