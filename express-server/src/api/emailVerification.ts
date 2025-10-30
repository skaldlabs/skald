import express, { Request, Response } from 'express'
import { DI } from '../di'
import { User } from '../entities/User'
import { EmailVerificationCode } from '../entities/EmailVerificationCode'
import { sendEmail } from '../lib/emailUtils'

function generateCode(length: number = 6): string {
    let code = ''
    for (let i = 0; i < length; i++) {
        code += Math.floor(Math.random() * 10).toString()
    }
    return code
}

async function generateVerificationCode(user: User): Promise<EmailVerificationCode> {
    const code = generateCode(6)

    await DI.emailVerificationCodes.nativeDelete({ user })

    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 10)

    const verificationCode = DI.emailVerificationCodes.create({
        user,
        code,
        expires_at: expiresAt,
        created_at: new Date(),
        attempts: 0,
    })

    await DI.em.persistAndFlush(verificationCode)
    return verificationCode
}

async function sendVerificationEmail(user: User): Promise<void> {
    const verificationCode = await generateVerificationCode(user)

    await sendEmail(
        user.email,
        'Your Skald Email Verification Code',
        `
            <h1>Verify your email address</h1>
            <p>Your verification code is:</p>
            <h2 style="font-size: 24px; letter-spacing: 5px;">${verificationCode.code}</h2>
            <p>This code will expire in 10 minutes.</p>
        `
    )
}

async function verifyCode(user: User, code: string): Promise<{ success: boolean; message: string }> {
    const verification = await DI.emailVerificationCodes.findOne({
        user,
        expires_at: { $gt: new Date() },
    })

    if (!verification) {
        return { success: false, message: 'Code expired or not found.' }
    }

    if (verification.attempts >= 3) {
        await DI.em.removeAndFlush(verification)
        return { success: false, message: 'Too many failed attempts. Please request a new code.' }
    }

    verification.attempts += 1
    await DI.em.persistAndFlush(verification)

    if (verification.code !== code) {
        return { success: false, message: 'Invalid code.' }
    }

    user.emailVerified = true
    await DI.em.persistAndFlush(user)

    await DI.em.removeAndFlush(verification)
    return { success: true, message: 'Email verified successfully!' }
}

const verifyEmailVerification = async (req: Request, res: Response) => {
    const user = req.context?.requestUser?.userInstance
    if (!user) {
        return res.status(401).json({ error: 'Not authenticated' })
    }

    const { code } = req.body
    if (!code) {
        return res.status(400).json({
            success: false,
            message: 'Verification code is required.',
        })
    }

    const result = await verifyCode(user, code)

    return res.status(result.success ? 200 : 400).json(result)
}

const sendEmailVerification = async (req: Request, res: Response) => {
    const user = req.context?.requestUser?.userInstance
    if (!user) {
        return res.status(401).json({ error: 'Not authenticated' })
    }

    if (user.emailVerified) {
        return res.status(400).json({
            success: false,
            message: 'Email already verified.',
        })
    }

    const existingCode = await DI.emailVerificationCodes.findOne({ user })
    if (existingCode) {
        const fiveMinutesAgo = new Date()
        fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5)

        if (existingCode.created_at > fiveMinutesAgo) {
            return res.status(400).json({
                success: false,
                message: 'Please wait 5 minutes before requesting a new verification code.',
            })
        }
    }

    await sendVerificationEmail(user)
    return res.status(200).json({
        success: true,
        message: 'Verification code sent!',
    })
}

export const emailVerificationRouter = express.Router({ mergeParams: true })
emailVerificationRouter.post('/send', sendEmailVerification)
emailVerificationRouter.post('/verify', verifyEmailVerification)
