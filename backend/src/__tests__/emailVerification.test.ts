import express, { Express } from 'express'
import request from 'supertest'
import { MikroORM, RequestContext } from '@mikro-orm/postgresql'
import { emailVerificationRouter } from '../api/emailVerification'
import { DI } from '../di'
import { createTestDatabase, clearDatabase, closeDatabase } from './testDb'
import { createTestUser } from './testHelpers'
import { generateAccessToken } from '../lib/tokenUtils'
import { userMiddleware } from '../middleware/userMiddleware'
import { User } from '../entities/User'
import { EmailVerificationCode } from '../entities/EmailVerificationCode'
import cookieParser from 'cookie-parser'
import * as emailUtils from '../lib/emailUtils'

// Mock the sendEmail function
jest.mock('../lib/emailUtils', () => ({
    sendEmail: jest.fn().mockResolvedValue({ error: null }),
}))

describe('Email Verification API', () => {
    let app: Express
    let orm: MikroORM

    beforeAll(async () => {
        orm = await createTestDatabase()
        DI.orm = orm
        DI.em = orm.em
        DI.users = orm.em.getRepository(User)
        DI.emailVerificationCodes = orm.em.getRepository(EmailVerificationCode)

        app = express()
        app.use(express.json())
        app.use(cookieParser())
        app.use((req, res, next) => RequestContext.create(orm.em, next))
        app.use(userMiddleware())
        app.use('/api/email-verification', emailVerificationRouter)
    })

    afterAll(async () => {
        await closeDatabase(orm)
    })

    afterEach(async () => {
        await clearDatabase(orm)
        jest.clearAllMocks()
    })

    describe('POST /api/email-verification/send', () => {
        it('should send verification code for unauthenticated user', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            // Mark user as not verified
            const em = orm.em.fork()
            user.emailVerified = false
            await em.persistAndFlush(user)

            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post('/api/email-verification/send')
                .set('Cookie', [`accessToken=${token}`])

            expect(response.status).toBe(200)
            expect(response.body.success).toBe(true)
            expect(response.body.message).toBe('Verification code sent!')
            expect(emailUtils.sendEmail).toHaveBeenCalledWith(
                'test@example.com',
                'Your Skald Email Verification Code',
                expect.stringContaining('Verify your email address')
            )
        })

        it('should create verification code in database', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const em = orm.em.fork()
            user.emailVerified = false
            await em.persistAndFlush(user)

            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post('/api/email-verification/send')
                .set('Cookie', [`accessToken=${token}`])

            expect(response.status).toBe(200)

            const em2 = orm.em.fork()
            const verificationCode = await em2.findOne(EmailVerificationCode, { user })
            expect(verificationCode).toBeDefined()
            expect(verificationCode?.code).toHaveLength(6)
            expect(verificationCode?.attempts).toBe(0)
        })

        it('should return 401 when not authenticated', async () => {
            const response = await request(app).post('/api/email-verification/send')

            expect(response.status).toBe(401)
            expect(response.body.error).toBe('Not authenticated')
        })

        it('should return 400 when email already verified', async () => {
            await createTestUser(orm, 'test@example.com', 'password123')
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post('/api/email-verification/send')
                .set('Cookie', [`accessToken=${token}`])

            expect(response.status).toBe(400)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toBe('Email already verified.')
        })

        it('should prevent sending multiple codes within 5 minutes', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const em = orm.em.fork()
            user.emailVerified = false
            await em.persistAndFlush(user)

            const token = generateAccessToken('test@example.com')

            // Send first code
            await request(app)
                .post('/api/email-verification/send')
                .set('Cookie', [`accessToken=${token}`])

            // Try to send second code immediately
            const response = await request(app)
                .post('/api/email-verification/send')
                .set('Cookie', [`accessToken=${token}`])

            expect(response.status).toBe(400)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toBe('Please wait 5 minutes before requesting a new verification code.')
        })

        it('should allow sending new code after 5 minutes', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const em = orm.em.fork()
            user.emailVerified = false
            await em.persistAndFlush(user)

            const token = generateAccessToken('test@example.com')

            // Create an old verification code (older than 5 minutes)
            const oldDate = new Date()
            oldDate.setMinutes(oldDate.getMinutes() - 6)

            const em2 = orm.em.fork()
            em2.create(EmailVerificationCode, {
                user,
                code: '123456',
                created_at: oldDate,
                expires_at: new Date(),
                attempts: 0,
            })
            await em2.flush()

            const response = await request(app)
                .post('/api/email-verification/send')
                .set('Cookie', [`accessToken=${token}`])

            expect(response.status).toBe(200)
            expect(response.body.success).toBe(true)
        })
    })

    describe('POST /api/email-verification/verify', () => {
        it('should verify email with correct code', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')
            const em = orm.em.fork()
            user.emailVerified = false
            await em.persistAndFlush(user)

            // Create verification code
            const expiresAt = new Date()
            expiresAt.setMinutes(expiresAt.getMinutes() + 10)

            const em2 = orm.em.fork()
            em2.create(EmailVerificationCode, {
                user,
                code: '123456',
                created_at: new Date(),
                expires_at: expiresAt,
                attempts: 0,
            })
            await em2.flush()

            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post('/api/email-verification/verify')
                .set('Cookie', [`accessToken=${token}`])
                .send({ code: '123456' })

            expect(response.status).toBe(200)
            expect(response.body.success).toBe(true)
            expect(response.body.message).toBe('Email verified successfully!')

            // Verify user is now verified
            const em3 = orm.em.fork()
            const updatedUser = await em3.findOne(User, { email: 'test@example.com' })
            expect(updatedUser?.emailVerified).toBe(true)

            // Verify code is deleted
            const deletedCode = await em3.findOne(EmailVerificationCode, { user })
            expect(deletedCode).toBeNull()
        })

        it('should return 401 when not authenticated', async () => {
            const response = await request(app).post('/api/email-verification/verify').send({ code: '123456' })

            expect(response.status).toBe(401)
            expect(response.body.error).toBe('Not authenticated')
        })

        it('should return 400 when code is missing', async () => {
            await createTestUser(orm, 'test@example.com', 'password123')
            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post('/api/email-verification/verify')
                .set('Cookie', [`accessToken=${token}`])
                .send({})

            expect(response.status).toBe(400)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toBe('Verification code is required.')
        })

        it('should return error for incorrect code', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')

            const expiresAt = new Date()
            expiresAt.setMinutes(expiresAt.getMinutes() + 10)

            const em = orm.em.fork()
            em.create(EmailVerificationCode, {
                user,
                code: '123456',
                created_at: new Date(),
                expires_at: expiresAt,
                attempts: 0,
            })
            await em.flush()

            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post('/api/email-verification/verify')
                .set('Cookie', [`accessToken=${token}`])
                .send({ code: '654321' })

            expect(response.status).toBe(400)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toBe('Invalid code.')
        })

        it('should return error for expired code', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')

            const expiredDate = new Date()
            expiredDate.setMinutes(expiredDate.getMinutes() - 1)

            const em = orm.em.fork()
            em.create(EmailVerificationCode, {
                user,
                code: '123456',
                created_at: new Date(),
                expires_at: expiredDate,
                attempts: 0,
            })
            await em.flush()

            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post('/api/email-verification/verify')
                .set('Cookie', [`accessToken=${token}`])
                .send({ code: '123456' })

            expect(response.status).toBe(400)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toBe('Code expired or not found.')
        })

        it('should increment attempts on wrong code', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')

            const expiresAt = new Date()
            expiresAt.setMinutes(expiresAt.getMinutes() + 10)

            const em = orm.em.fork()
            em.create(EmailVerificationCode, {
                user,
                code: '123456',
                created_at: new Date(),
                expires_at: expiresAt,
                attempts: 0,
            })
            await em.flush()

            const token = generateAccessToken('test@example.com')

            await request(app)
                .post('/api/email-verification/verify')
                .set('Cookie', [`accessToken=${token}`])
                .send({ code: 'wrong' })

            const em2 = orm.em.fork()
            const verificationCode = await em2.findOne(EmailVerificationCode, { user })
            expect(verificationCode?.attempts).toBe(1)
        })

        it('should delete code and fail after 3 failed attempts', async () => {
            const user = await createTestUser(orm, 'test@example.com', 'password123')

            const expiresAt = new Date()
            expiresAt.setMinutes(expiresAt.getMinutes() + 10)

            const em = orm.em.fork()
            em.create(EmailVerificationCode, {
                user,
                code: '123456',
                created_at: new Date(),
                expires_at: expiresAt,
                attempts: 3,
            })
            await em.flush()

            const token = generateAccessToken('test@example.com')

            const response = await request(app)
                .post('/api/email-verification/verify')
                .set('Cookie', [`accessToken=${token}`])
                .send({ code: '123456' })

            expect(response.status).toBe(400)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toBe('Too many failed attempts. Please request a new code.')

            // Verify code is deleted
            const em2 = orm.em.fork()
            const deletedCode = await em2.findOne(EmailVerificationCode, { user })
            expect(deletedCode).toBeNull()
        })
    })
})
