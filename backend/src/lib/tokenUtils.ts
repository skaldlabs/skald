import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { SECRET_KEY } from '@/settings'
import { DI } from '@/di'
import { User } from '@/entities/User'
import { PasswordResetToken } from '@/entities/PasswordResetToken'

export const generateAccessToken = (email: string) => {
    return jwt.sign({ email }, SECRET_KEY, { expiresIn: '30d' })
}

export const verifyAccessToken = (token: string): { email: string } | null => {
    try {
        return jwt.verify(token, SECRET_KEY) as { email: string }
    } catch {
        return null
    }
}

export function generateResetToken(): string {
    return crypto.randomBytes(32).toString('base64url')
}

export async function generatePasswordResetToken(user: User): Promise<PasswordResetToken> {
    const token = generateResetToken()

    await DI.passwordResetTokens.nativeDelete({ user })

    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 10)

    const resetToken = DI.passwordResetTokens.create({
        user,
        token,
        expires_at: expiresAt,
        created_at: new Date(),
        attempts: 0,
    })

    await DI.em.persistAndFlush(resetToken)
    return resetToken
}
