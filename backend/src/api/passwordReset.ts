import express, { Request, Response } from 'express'
import { DI } from '@/di'
import { generatePasswordResetToken } from '@/lib/tokenUtils'
import { sendPasswordResetEmail } from '@/emails/passwordResetEmail'
import { makePassword } from '@/lib/passwordUtils'
import { isValidEmail } from '@/lib/emailUtils'
import { IS_SELF_HOSTED_DEPLOY, RESEND_API_KEY, FRONTEND_URL } from '@/settings'
import { logger } from '@/lib/logger'
import crypto from 'crypto'

const forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body

    if (!email) {
        return res.status(400).json({ error: 'Email is required' })
    }

    if (!isValidEmail(email)) {
        // Always return success to prevent email enumeration
        return res.status(200).json({
            success: true,
            message: 'If an account exists with this email, a password reset link has been sent.',
        })
    }

    const normalizedEmail = email.toLowerCase().trim()

    try {
        const user = await DI.users.findOne({ email: normalizedEmail })

        if (!user) {
            return res.status(200).json({
                success: true,
                message: 'If an account exists with this email, a password reset link has been sent.',
            })
        }

        const existingToken = await DI.passwordResetTokens.findOne({ user })
        if (existingToken) {
            const fiveMinutesAgo = new Date()
            fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5)

            if (existingToken.created_at > fiveMinutesAgo) {
                return res.status(400).json({
                    success: false,
                    message: 'Please wait 5 minutes before requesting another password reset.',
                })
            }
        }

        const resetToken = await generatePasswordResetToken(user)

        const canSendEmail = !IS_SELF_HOSTED_DEPLOY && RESEND_API_KEY

        if (canSendEmail) {
            await sendPasswordResetEmail(user.email, resetToken.token)
        } else {
            // Self-hosted mode: log to console
            const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken.token}`
            logger.info(
                `\n${'='.repeat(80)}\nPASSWORD RESET REQUEST\n${'='.repeat(80)}\n` +
                    `User: ${user.email}\n` +
                    `Reset URL: ${resetUrl}\n` +
                    `Expires: in 10 minutes\n` +
                    `\nPlease copy and provide this URL to the user.\n${'='.repeat(80)}\n`
            )
        }

        return res.status(200).json({
            success: true,
            message: 'If an account exists with this email, a password reset link has been sent.',
        })
    } catch (error) {
        logger.error({ err: error }, 'Error in forgotPassword')
        return res.status(500).json({ error: 'An error occurred while processing your request.' })
    }
}

const resetPassword = async (req: Request, res: Response) => {
    const { token, new_password } = req.body

    if (!token || !new_password) {
        return res.status(400).json({
            success: false,
            message: 'Token and new password are required.',
        })
    }

    if (new_password.length < 8) {
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 8 characters long.',
        })
    }

    try {
        const resetToken = await DI.passwordResetTokens.findOne({
            token,
            expires_at: { $gt: new Date() },
        })

        if (!resetToken) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token.',
            })
        }

        if (resetToken.attempts >= 3) {
            await DI.em.removeAndFlush(resetToken)
            return res.status(400).json({
                success: false,
                message: 'Too many failed attempts. Please request a new password reset.',
            })
        }

        resetToken.attempts += 1
        await DI.em.persistAndFlush(resetToken)

        const tokenBuffer = Buffer.from(token)
        const storedTokenBuffer = Buffer.from(resetToken.token)

        if (tokenBuffer.length !== storedTokenBuffer.length) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token.',
            })
        }

        const tokensMatch = crypto.timingSafeEqual(tokenBuffer, storedTokenBuffer)

        if (!tokensMatch) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token.',
            })
        }

        await DI.em.populate(resetToken, ['user'])
        const user = resetToken.user

        user.password = await makePassword(new_password)
        user.last_login = new Date()

        await DI.em.persistAndFlush(user)
        await DI.em.removeAndFlush(resetToken)

        return res.status(200).json({
            success: true,
            message: 'Password reset successfully!',
        })
    } catch (error) {
        logger.error({ err: error }, 'Error in resetPassword')
        return res.status(500).json({
            success: false,
            message: 'An error occurred while resetting your password.',
        })
    }
}

export const passwordResetRouter = express.Router({ mergeParams: true })
passwordResetRouter.post('/forgot-password', forgotPassword)
passwordResetRouter.post('/reset-password', resetPassword)
