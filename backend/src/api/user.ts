import express, { Request, Response } from 'express'
import { DI } from '@/di'
import { checkPassword, makePassword } from '@/lib/passwordUtils'
import { generateAccessToken } from '@/lib/tokenUtils'
import { requireAuth } from '@/middleware/authMiddleware'
import { EMAIL_VERIFICATION_ENABLED, ENABLE_SECURITY_SETTINGS } from '@/settings'

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
    if (!user || !checkPassword(password, user.password)) {
        return res.status(401).json({ error: 'Invalid credentials' })
    }

    const accessToken = generateAccessToken(user.email)
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: ENABLE_SECURITY_SETTINGS,
        sameSite: 'lax',
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

const createUser = async (req: Request, res: Response) => {
    const { email, password } = req.body

    if (!email || !password) {
        return res.status(400).json({
            email: email ? undefined : ['This field is required.'],
            password: password ? undefined : ['This field is required.'],
        })
    }

    const normalizedEmail = email.toLowerCase().trim()

    const existingUser = await DI.users.findOne({ email: normalizedEmail })
    if (existingUser) {
        return res.status(400).json({
            error: ['User with this email already exists.'],
        })
    }

    const hashedPassword = makePassword(password)
    const user = DI.users.create({
        email: normalizedEmail,
        password: hashedPassword,
        emailVerified: !EMAIL_VERIFICATION_ENABLED,
        name: '',
        first_name: '',
        last_name: '',
        is_superuser: false,
        is_staff: false,
        is_active: true,
        date_joined: new Date(),
    })

    await DI.em.persistAndFlush(user)

    const accessToken = generateAccessToken(user.email)
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: ENABLE_SECURITY_SETTINGS,
        sameSite: 'lax',
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

    res.status(201).json({ user: userResponse })
}

const changePassword = async (req: Request, res: Response) => {
    const user = req.context?.requestUser?.userInstance
    if (!user) {
        return res.status(401).json({ error: 'Not authenticated' })
    }

    const { old_password, new_password } = req.body

    if (!old_password) {
        return res.status(400).json({
            old_password: ['This field is required.'],
        })
    }

    if (!new_password) {
        return res.status(400).json({
            new_password: ['This field is required.'],
        })
    }

    if (!checkPassword(old_password, user.password)) {
        return res.status(400).json({
            error: 'Wrong password.',
        })
    }

    const hashedPassword = makePassword(new_password)
    user.password = hashedPassword
    await DI.em.persistAndFlush(user)

    res.status(200).json({ message: 'Password changed successfully' })
}

const getUserDetails = async (req: Request, res: Response) => {
    const user = req.context?.requestUser?.userInstance
    if (!user) {
        return res.status(401).json({ error: 'Not authenticated' })
    }

    const userResponse: UserResponse = {
        email: user.email,
        password: user.password,
        default_organization: user.defaultOrganization?.uuid,
        current_project: user.current_project?.uuid,
        email_verified: user.emailVerified,
        organization_name: user.defaultOrganization?.name,
    }

    res.status(200).json(userResponse)
}

const setCurrentProject = async (req: Request, res: Response) => {
    const user = req.context?.requestUser?.userInstance
    if (!user) {
        return res.status(401).json({ error: 'Not authenticated' })
    }

    const { project_uuid } = req.body

    if (!project_uuid) {
        return res.status(400).json({
            error: 'project_uuid is required',
        })
    }

    const project = await DI.projects.findOne({ uuid: project_uuid })
    if (!project) {
        return res.status(404).json({
            error: 'Project not found',
        })
    }

    if (!user.defaultOrganization) {
        return res.status(400).json({
            error: 'User has no default organization',
        })
    }

    if (project.organization.uuid !== user.defaultOrganization.uuid) {
        return res.status(403).json({
            error: 'Project does not belong to your current organization',
        })
    }

    user.current_project = project
    await DI.em.persistAndFlush(user)

    const userResponse: UserResponse = {
        email: user.email,
        password: user.password,
        default_organization: user.defaultOrganization?.uuid,
        current_project: user.current_project?.uuid,
        email_verified: user.emailVerified,
        organization_name: user.defaultOrganization?.name,
    }

    res.status(200).json(userResponse)
}

export const userRouter = express.Router({ mergeParams: true })
userRouter.post('/login', login)
userRouter.post('/logout', [requireAuth()], logout)
userRouter.post('/', createUser)
userRouter.post('/change_password', [requireAuth()], changePassword)
userRouter.get('/details', [requireAuth()], getUserDetails)
userRouter.post('/set_current_project', [requireAuth()], setCurrentProject)
