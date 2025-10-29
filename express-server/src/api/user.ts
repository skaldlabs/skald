import express, { Request, Response } from 'express'
import { DI } from '../di'
import { checkPassword } from '../lib/passwordUtils'
import { generateAccessToken } from '../lib/tokenUtils'
import { requireAuth } from '../middleware/authMiddleware'
export const userRouter = express.Router({ mergeParams: true })

interface UserResponse {
    email: string
    password: string
    default_organization?: string | null
    current_project?: string | null
    email_verified: boolean
    organization_name?: string | null
}

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' })
    }
    const user = await DI.users.findOne({ email })
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' })
    }

    if (!checkPassword(password, user.password)) {
        return res.status(401).json({ error: 'Invalid credentials' })
    }

    const accessToken = generateAccessToken(user.email)
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
        path: '/',
    })

    const userResponse: UserResponse = {
        email: user.email,
        password: user.password,
        default_organization: user.defaultOrganization?.uuid,
        current_project: user.current_project?.uuid,
        email_verified: user.emailVerified,
        organization_name: user.defaultOrganization?.name,
    }

    res.json({ user: userResponse })
}

const logout = async (req: Request, res: Response) => {
    res.clearCookie('accessToken')
    res.json({ message: 'Logged out' })
}

userRouter.post('/login', login)
userRouter.post('/logout', [requireAuth()], logout)
// userRouter.post('/', createUser)
// userRouter.post('/change_password', changePassword)
// userRouter.get('/details', getUserDetails)
// userRouter.post('/set_current_project', setCurrentProject)
