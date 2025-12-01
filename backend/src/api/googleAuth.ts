import express, { Request, Response } from 'express'
import { DI } from '@/di'
import { getGoogleAuthUrl, verifyGoogleIdToken } from '@/lib/googleOAuthUtils'
import { generateAccessToken } from '@/lib/tokenUtils'
import { ENABLE_SECURITY_SETTINGS, FRONTEND_URL } from '@/settings'
import { posthogCapture } from '@/lib/posthogUtils'
import crypto from 'crypto'

export const googleAuthRouter = express.Router({ mergeParams: true })

const initiateGoogleOAuth = async (req: Request, res: Response) => {
    try {
        const state = crypto.randomBytes(32).toString('hex')

        res.cookie('oauth_state', state, {
            httpOnly: true,
            secure: ENABLE_SECURITY_SETTINGS,
            sameSite: 'lax',
            maxAge: 10 * 60 * 1000,
            path: '/',
        })

        const authUrl = getGoogleAuthUrl(state)
        res.redirect(authUrl)
    } catch (error) {
        console.error('Error initiating Google OAuth:', error)
        res.redirect(`${FRONTEND_URL}/login?error=oauth_init_failed`)
    }
}

const handleGoogleCallback = async (req: Request, res: Response) => {
    try {
        const { code, state, error } = req.query

        if (error) {
            return res.redirect(`${FRONTEND_URL}/login?error=access_denied`)
        }

        if (!code || typeof code !== 'string') {
            return res.redirect(`${FRONTEND_URL}/login?error=missing_code`)
        }

        const storedState = req.cookies.oauth_state
        if (!storedState || storedState !== state) {
            return res.redirect(`${FRONTEND_URL}/login?error=invalid_state`)
        }

        res.clearCookie('oauth_state')

        const googleUser = await verifyGoogleIdToken(code)

        if (!googleUser.email_verified) {
            return res.redirect(`${FRONTEND_URL}/login?error=email_not_verified`)
        }

        const normalizedEmail = googleUser.email.toLowerCase().trim()

        let user = await DI.users.findOne({ email: normalizedEmail })

        if (!user) {
            user = DI.users.create({
                email: normalizedEmail,
                password: '',
                emailVerified: true,
                first_name: googleUser.given_name,
                last_name: googleUser.family_name,
                googleId: googleUser.sub,
                authProvider: 'google',
                profilePicture: googleUser.picture,
                is_superuser: false,
                is_staff: false,
                is_active: true,
                date_joined: new Date(),
            })

            await DI.em.persistAndFlush(user)

            posthogCapture('user_signed_up', user.email, {
                user_email: user.email,
                auth_method: 'google',
            })
        } else {
            if (!user.googleId) {
                user.googleId = googleUser.sub
                user.authProvider = user.authProvider || 'google'
                user.emailVerified = true

                if (!user.first_name) {
                    user.first_name = googleUser.given_name
                }
                if (!user.last_name) {
                    user.last_name = googleUser.family_name
                }
                if (!user.profilePicture) {
                    user.profilePicture = googleUser.picture
                }

                await DI.em.persistAndFlush(user)
            }

            posthogCapture('user_logged_in_google', user.email, {
                user_email: user.email,
            })
        }

        const accessToken = generateAccessToken(user.email)
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: ENABLE_SECURITY_SETTINGS,
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000,
            path: '/',
        })

        res.redirect(`${FRONTEND_URL}/`)
    } catch (error) {
        console.error('Error in Google OAuth callback:', error)
        res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`)
    }
}

googleAuthRouter.get('/', initiateGoogleOAuth)
googleAuthRouter.get('/callback', handleGoogleCallback)
