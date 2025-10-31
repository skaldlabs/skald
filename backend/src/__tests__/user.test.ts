import express, { Express } from 'express'
import request from 'supertest'
import { MikroORM, RequestContext } from '@mikro-orm/postgresql'
import cookieParser from 'cookie-parser'
import { userRouter } from '../api/user'
import { DI } from '../di'
import { createTestDatabase, clearDatabase, closeDatabase } from './testDb'
import { createTestUser, createTestOrganization, createTestProject } from './testHelpers'
import { generateAccessToken } from '../lib/tokenUtils'
import { userMiddleware } from '../middleware/userMiddleware'
import { User } from '../entities/User'
import { Project } from '../entities/Project'

describe('User API', () => {
    let app: Express
    let orm: MikroORM

    beforeAll(async () => {
        orm = await createTestDatabase()
        DI.orm = orm
        DI.em = orm.em
        DI.users = orm.em.getRepository(User)
        DI.projects = orm.em.getRepository(Project)

        app = express()
        app.use(express.json())
        app.use(cookieParser())
        app.use((req, res, next) => RequestContext.create(orm.em, next))
        app.use(userMiddleware())
        app.use('/api/users', userRouter)
    })

    afterAll(async () => {
        await closeDatabase(orm)
    })

    afterEach(async () => {
        await clearDatabase(orm)
    })

    describe('POST /api/users (createUser)', () => {
        it('should create a new user with valid credentials', async () => {
            const response = await request(app).post('/api/users').send({
                email: 'test@example.com',
                password: 'password123',
            })

            expect(response.status).toBe(201)
            expect(response.body.user).toMatchObject({
                email: 'test@example.com',
                email_verified: expect.any(Boolean),
            })
            expect(response.headers['set-cookie']).toBeDefined()
        })

        it('should normalize email to lowercase and trim whitespace', async () => {
            const response = await request(app).post('/api/users').send({
                email: '  TEST@EXAMPLE.COM  ',
                password: 'password123',
            })

            expect(response.status).toBe(201)
            expect(response.body.user.email).toBe('test@example.com')
        })

        it('should return 400 when email is missing', async () => {
            const response = await request(app).post('/api/users').send({
                password: 'password123',
            })

            expect(response.status).toBe(400)
            expect(response.body.email).toEqual(['This field is required.'])
        })

        it('should return 400 when password is missing', async () => {
            const response = await request(app).post('/api/users').send({
                email: 'test@example.com',
            })

            expect(response.status).toBe(400)
            expect(response.body.password).toEqual(['This field is required.'])
        })

        it('should return 400 when both email and password are missing', async () => {
            const response = await request(app).post('/api/users').send({})

            expect(response.status).toBe(400)
            expect(response.body.email).toEqual(['This field is required.'])
            expect(response.body.password).toEqual(['This field is required.'])
        })

        it('should return 400 when user with email already exists', async () => {
            await createTestUser(orm, 'test@example.com', 'password123')

            const response = await request(app).post('/api/users').send({
                email: 'test@example.com',
                password: 'password456',
            })

            expect(response.status).toBe(400)
            expect(response.body.error).toEqual(['User with this email already exists.'])
        })

        it('should set access token cookie on successful registration', async () => {
            const response = await request(app).post('/api/users').send({
                email: 'test@example.com',
                password: 'password123',
            })

            expect(response.status).toBe(201)
            const cookies = response.headers['set-cookie'] as string[] | string
            expect(cookies).toBeDefined()
            const cookieArray = Array.isArray(cookies) ? cookies : [cookies]
            expect(cookieArray.some((c: string) => c.startsWith('accessToken='))).toBe(true)
        })
    })

    describe('POST /api/users/login', () => {
        beforeEach(async () => {
            await createTestUser(orm, 'test@example.com', 'password123')
        })

        it('should login with valid credentials', async () => {
            const response = await request(app).post('/api/users/login').send({
                email: 'test@example.com',
                password: 'password123',
            })

            expect(response.status).toBe(200)
            expect(response.body.user).toMatchObject({
                email: 'test@example.com',
            })
            expect(response.headers['set-cookie']).toBeDefined()
        })

        it('should return 400 when email is missing', async () => {
            const response = await request(app).post('/api/users/login').send({
                password: 'password123',
            })

            expect(response.status).toBe(400)
            expect(response.body.error).toBe('Email and password are required')
        })

        it('should return 400 when password is missing', async () => {
            const response = await request(app).post('/api/users/login').send({
                email: 'test@example.com',
            })

            expect(response.status).toBe(400)
            expect(response.body.error).toBe('Email and password are required')
        })

        it('should return 401 when email does not exist', async () => {
            const response = await request(app).post('/api/users/login').send({
                email: 'nonexistent@example.com',
                password: 'password123',
            })

            expect(response.status).toBe(401)
            expect(response.body.error).toBe('Invalid credentials')
        })

        it('should return 401 when password is incorrect', async () => {
            const response = await request(app).post('/api/users/login').send({
                email: 'test@example.com',
                password: 'wrongpassword',
            })

            expect(response.status).toBe(401)
            expect(response.body.error).toBe('Invalid credentials')
        })

        it('should set access token cookie on successful login', async () => {
            const response = await request(app).post('/api/users/login').send({
                email: 'test@example.com',
                password: 'password123',
            })

            expect(response.status).toBe(200)
            const cookies = response.headers['set-cookie'] as string[] | string
            expect(cookies).toBeDefined()
            const cookieArray = Array.isArray(cookies) ? cookies : [cookies]
            expect(cookieArray.some((c: string) => c.startsWith('accessToken='))).toBe(true)
        })
    })

    describe('POST /api/users/logout', () => {
        let authToken: string

        beforeEach(async () => {
            await createTestUser(orm, 'test@example.com', 'password123')
            authToken = generateAccessToken('test@example.com')
        })

        it('should logout authenticated user', async () => {
            const response = await request(app)
                .post('/api/users/logout')
                .set('Cookie', [`accessToken=${authToken}`])

            expect(response.status).toBe(200)
            expect(response.body.message).toBe('Logged out')
        })

        it('should clear access token cookie on logout', async () => {
            const response = await request(app)
                .post('/api/users/logout')
                .set('Cookie', [`accessToken=${authToken}`])

            expect(response.status).toBe(200)
            const cookies = response.headers['set-cookie'] as string[] | string
            expect(cookies).toBeDefined()
            const cookieArray = Array.isArray(cookies) ? cookies : [cookies]
            expect(cookieArray.some((c: string) => c.includes('accessToken=') && c.includes('Expires='))).toBe(true)
        })

        it('should return 401 when not authenticated', async () => {
            const response = await request(app).post('/api/users/logout')

            expect(response.status).toBe(401)
        })
    })

    describe('GET /api/users/details', () => {
        let authToken: string
        let user: any

        beforeEach(async () => {
            user = await createTestUser(orm, 'test@example.com', 'password123')
            authToken = generateAccessToken('test@example.com')
        })

        it('should return user details for authenticated user', async () => {
            const response = await request(app)
                .get('/api/users/details')
                .set('Cookie', [`accessToken=${authToken}`])

            expect(response.status).toBe(200)
            expect(response.body).toMatchObject({
                email: 'test@example.com',
                email_verified: true,
            })
        })

        it('should return user with organization details when user has default organization', async () => {
            const organization = await createTestOrganization(orm, 'Test Org', user)
            const em = orm.em.fork()
            user.defaultOrganization = organization
            await em.persistAndFlush(user)

            const response = await request(app)
                .get('/api/users/details')
                .set('Cookie', [`accessToken=${authToken}`])

            expect(response.status).toBe(200)
            expect(response.body).toMatchObject({
                email: 'test@example.com',
                default_organization: organization.uuid,
                organization_name: 'Test Org',
            })
        })

        it('should return 401 when not authenticated', async () => {
            const response = await request(app).get('/api/users/details')

            expect(response.status).toBe(401)
        })
    })

    describe('POST /api/users/change_password', () => {
        let authToken: string
        let user: any

        beforeEach(async () => {
            user = await createTestUser(orm, 'test@example.com', 'oldpassword123')
            authToken = generateAccessToken('test@example.com')
        })

        it('should change password with valid old password', async () => {
            const response = await request(app)
                .post('/api/users/change_password')
                .set('Cookie', [`accessToken=${authToken}`])
                .send({
                    old_password: 'oldpassword123',
                    new_password: 'newpassword456',
                })

            expect(response.status).toBe(200)
            expect(response.body.message).toBe('Password changed successfully')

            // Verify old password no longer works
            const loginResponse = await request(app).post('/api/users/login').send({
                email: 'test@example.com',
                password: 'oldpassword123',
            })
            expect(loginResponse.status).toBe(401)

            // Verify new password works
            const newLoginResponse = await request(app).post('/api/users/login').send({
                email: 'test@example.com',
                password: 'newpassword456',
            })
            expect(newLoginResponse.status).toBe(200)
        })

        it('should return 400 when old_password is missing', async () => {
            const response = await request(app)
                .post('/api/users/change_password')
                .set('Cookie', [`accessToken=${authToken}`])
                .send({
                    new_password: 'newpassword456',
                })

            expect(response.status).toBe(400)
            expect(response.body.old_password).toEqual(['This field is required.'])
        })

        it('should return 400 when new_password is missing', async () => {
            const response = await request(app)
                .post('/api/users/change_password')
                .set('Cookie', [`accessToken=${authToken}`])
                .send({
                    old_password: 'oldpassword123',
                })

            expect(response.status).toBe(400)
            expect(response.body.new_password).toEqual(['This field is required.'])
        })

        it('should return 400 when old password is incorrect', async () => {
            const response = await request(app)
                .post('/api/users/change_password')
                .set('Cookie', [`accessToken=${authToken}`])
                .send({
                    old_password: 'wrongpassword',
                    new_password: 'newpassword456',
                })

            expect(response.status).toBe(400)
            expect(response.body.error).toBe('Wrong password.')
        })

        it('should return 401 when not authenticated', async () => {
            const response = await request(app).post('/api/users/change_password').send({
                old_password: 'oldpassword123',
                new_password: 'newpassword456',
            })

            expect(response.status).toBe(401)
        })
    })

    describe('POST /api/users/set_current_project', () => {
        let authToken: string
        let user: any
        let organization: any
        let project: any

        beforeEach(async () => {
            user = await createTestUser(orm, 'test@example.com', 'password123')
            organization = await createTestOrganization(orm, 'Test Org', user)
            project = await createTestProject(orm, 'Test Project', organization, user)

            const em = orm.em.fork()
            user.defaultOrganization = organization
            await em.persistAndFlush(user)

            authToken = generateAccessToken('test@example.com')
        })

        it('should set current project for authenticated user', async () => {
            const response = await request(app)
                .post('/api/users/set_current_project')
                .set('Cookie', [`accessToken=${authToken}`])
                .send({
                    project_uuid: project.uuid,
                })

            expect(response.status).toBe(200)
            expect(response.body.current_project).toBe(project.uuid)
        })

        it('should return 400 when project_uuid is missing', async () => {
            const response = await request(app)
                .post('/api/users/set_current_project')
                .set('Cookie', [`accessToken=${authToken}`])
                .send({})

            expect(response.status).toBe(400)
            expect(response.body.error).toBe('project_uuid is required')
        })

        it('should return 404 when project does not exist', async () => {
            const response = await request(app)
                .post('/api/users/set_current_project')
                .set('Cookie', [`accessToken=${authToken}`])
                .send({
                    project_uuid: '00000000-0000-0000-0000-000000000000',
                })

            expect(response.status).toBe(404)
            expect(response.body.error).toBe('Project not found')
        })

        it('should return 400 when user has no default organization', async () => {
            const em = orm.em.fork()
            user.defaultOrganization = null
            await em.persistAndFlush(user)

            const response = await request(app)
                .post('/api/users/set_current_project')
                .set('Cookie', [`accessToken=${authToken}`])
                .send({
                    project_uuid: project.uuid,
                })

            expect(response.status).toBe(400)
            expect(response.body.error).toBe('User has no default organization')
        })

        it('should return 403 when project does not belong to user organization', async () => {
            const otherUser = await createTestUser(orm, 'other@example.com', 'password123')
            const otherOrg = await createTestOrganization(orm, 'Other Org', otherUser)
            const otherProject = await createTestProject(orm, 'Other Project', otherOrg, otherUser)

            const response = await request(app)
                .post('/api/users/set_current_project')
                .set('Cookie', [`accessToken=${authToken}`])
                .send({
                    project_uuid: otherProject.uuid,
                })

            expect(response.status).toBe(403)
            expect(response.body.error).toBe('Project does not belong to your current organization')
        })

        it('should return 401 when not authenticated', async () => {
            const response = await request(app).post('/api/users/set_current_project').send({
                project_uuid: project.uuid,
            })

            expect(response.status).toBe(401)
        })
    })
})
