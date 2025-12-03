import express, { Request, Response } from 'express'
import { DI } from '@/di'
import { checkPassword, makePassword } from '@/lib/passwordUtils'
import { generateAccessToken } from '@/lib/tokenUtils'
import { requireAuth } from '@/middleware/authMiddleware'
import { EMAIL_VERIFICATION_ENABLED, ENABLE_SECURITY_SETTINGS } from '@/settings'
import { addContactToResend, isValidEmail } from '@/lib/emailUtils'
import { posthogCapture } from '@/lib/posthogUtils'
import { User } from '@/entities/User'
import { passwordResetRouter } from '@/api/passwordReset'

interface UserResponse {
    email: string
    default_organization?: string | null
    current_project?: string | null
    email_verified: boolean
    organization_name?: string | null
    name?: string | null
    is_superuser: boolean
    oauth_provider?: string | null
    profile_picture?: string | null
    role?: string | null
    onboarding_completed?: boolean
}

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' })
    }

    // Validate email format to prevent XSS and invalid inputs
    if (!isValidEmail(email)) {
        return res.status(401).json({ error: 'Invalid credentials' })
    }

    const user = await DI.users.findOne({ email })
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' })
    }

    if (!user.password || user.password === '') {
        return res.status(401).json({ error: 'This account uses Google Sign-In. Please sign in with Google.' })
    }

    if (!checkPassword(password, user.password)) {
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

    posthogCapture({
        event: 'user_logged_in',
        distinctId: user.email,
        properties: {
            user_email: user.email,
        },
    })

    const userResponse: UserResponse = {
        email: user.email,
        default_organization: user.defaultOrganization?.uuid,
        current_project: user.current_project?.uuid,
        email_verified: user.emailVerified,
        organization_name: user.defaultOrganization?.name,
        name: _fullName(user),
        is_superuser: user.is_superuser,
        profile_picture: user.profilePicture,
        oauth_provider: user.authProvider,
        onboarding_completed: user.onboarding_completed,
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

    // Validate email format to prevent XSS and invalid emails
    if (!isValidEmail(normalizedEmail)) {
        return res.status(400).json({
            email: ['Please enter a valid email address.'],
        })
    }

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

    posthogCapture({
        event: 'user_signed_up',
        distinctId: user.email,
        properties: {
            user_email: user.email,
            auth_method: 'password',
        },
    })

    const userResponse: UserResponse = {
        email: user.email,
        default_organization: user.defaultOrganization?.uuid,
        current_project: user.current_project?.uuid,
        email_verified: user.emailVerified,
        organization_name: user.defaultOrganization?.name,
        name: _fullName(user),
        is_superuser: user.is_superuser,
        profile_picture: user.profilePicture,
        oauth_provider: user.authProvider,
        onboarding_completed: user.onboarding_completed,
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
        default_organization: user.defaultOrganization?.uuid,
        current_project: user.current_project?.uuid,
        email_verified: user.emailVerified,
        organization_name: user.defaultOrganization?.name,
        name: _fullName(user),
        is_superuser: user.is_superuser,
        oauth_provider: user.authProvider,
        profile_picture: user.profilePicture,
        role: user.role,
        onboarding_completed: user.onboarding_completed,
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
        default_organization: user.defaultOrganization?.uuid,
        current_project: user.current_project?.uuid,
        email_verified: user.emailVerified,
        organization_name: user.defaultOrganization?.name,
        name: _fullName(user),
        is_superuser: user.is_superuser,
        profile_picture: user.profilePicture,
        oauth_provider: user.authProvider,
        onboarding_completed: user.onboarding_completed,
    }

    res.status(200).json(userResponse)
}

const updateUserDetails = async (req: Request, res: Response) => {
    const user = req.context?.requestUser?.userInstance
    if (!user) {
        return res.status(401).json({ error: 'Not authenticated' })
    }

    const { first_name, last_name, role, phone_number, referral_source, referral_details } = req.body

    if (!first_name || !last_name) {
        return res.status(400).json({
            first_name: first_name ? undefined : ['This field is required.'],
            last_name: last_name ? undefined : ['This field is required.'],
        })
    }

    if (!role) {
        return res.status(400).json({
            role: ['This field is required.'],
        })
    }

    user.first_name = first_name.trim()
    user.last_name = last_name.trim()
    user.role = role

    if (phone_number) {
        user.phone_number = phone_number.trim()
    }

    if (referral_source) {
        user.referral_source = referral_source
    }

    if (referral_details) {
        user.referral_details = referral_details.trim()
    }

    await DI.em.persistAndFlush(user)

    addContactToResend(user.email, user.first_name, user.last_name).catch(() => {})

    posthogCapture({
        event: 'user_details_completed',
        distinctId: user.email,
        properties: {
            user_email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            referral_source: user.referral_source,
        },
    })

    const userResponse: UserResponse = {
        email: user.email,
        default_organization: user.defaultOrganization?.uuid,
        current_project: user.current_project?.uuid,
        email_verified: user.emailVerified,
        organization_name: user.defaultOrganization?.name,
        name: _fullName(user),
        is_superuser: user.is_superuser,
        profile_picture: user.profilePicture,
        oauth_provider: user.authProvider,
        onboarding_completed: user.onboarding_completed,
    }

    res.status(200).json(userResponse)
}

const _fullName = (user: User): string | null => {
    if (!user.first_name) {
        return null
    }

    if (!user.last_name) {
        return user.first_name
    }

    return `${user.first_name} ${user.last_name}`
}

export const userRouter = express.Router({ mergeParams: true })
userRouter.post('/login', login)
userRouter.post('/logout', [requireAuth()], logout)
userRouter.post('/', createUser)
userRouter.post('/change_password', [requireAuth()], changePassword)
userRouter.get('/details', [requireAuth()], getUserDetails)
userRouter.post('/set_current_project', [requireAuth()], setCurrentProject)
userRouter.post('/details', [requireAuth()], updateUserDetails)
userRouter.use('/', passwordResetRouter)
