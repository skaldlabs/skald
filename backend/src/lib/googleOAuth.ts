import { OAuth2Client } from 'google-auth-library'
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_OAUTH_REDIRECT_URI } from '@/settings'

export interface GoogleUserInfo {
    sub: string
    email: string
    email_verified: boolean
    name: string
    given_name: string
    family_name: string
    picture: string
}

export class GoogleOAuthService {
    private client: OAuth2Client

    constructor() {
        if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
            throw new Error('Google OAuth credentials not configured')
        }

        this.client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_OAUTH_REDIRECT_URI)
    }

    getAuthUrl(state: string): string {
        return this.client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/userinfo.profile',
                'https://www.googleapis.com/auth/userinfo.email',
            ],
            state: state,
        })
    }

    async verifyIdToken(code: string): Promise<GoogleUserInfo> {
        const { tokens } = await this.client.getToken(code)

        if (!tokens.id_token) {
            throw new Error('No ID token received from Google')
        }

        const ticket = await this.client.verifyIdToken({
            idToken: tokens.id_token,
            audience: GOOGLE_CLIENT_ID,
        })

        const payload = ticket.getPayload()
        if (!payload) {
            throw new Error('Invalid token payload')
        }

        if (!payload.email) {
            throw new Error('Email not provided by Google')
        }

        return {
            sub: payload.sub,
            email: payload.email,
            email_verified: payload.email_verified || false,
            name: payload.name || '',
            given_name: payload.given_name || '',
            family_name: payload.family_name || '',
            picture: payload.picture || '',
        }
    }
}
