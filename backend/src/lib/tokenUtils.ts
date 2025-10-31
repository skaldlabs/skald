import jwt from 'jsonwebtoken'
import { SECRET_KEY } from '@/settings'

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
