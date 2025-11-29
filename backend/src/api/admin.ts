import { DI } from '@/di'
import { generateAccessToken } from '@/lib/tokenUtils'
import { requireSuperuser } from '@/middleware/authMiddleware'
import { ENABLE_SECURITY_SETTINGS } from '@/settings'
import express, { Request, Response } from 'express'

interface UserListItem {
    id: string
    email: string
    name: string | null
    is_superuser: boolean
    is_active: boolean
    date_joined: string
}

const listUsers = async (req: Request, res: Response) => {
    /*
        #swagger.tags = ['Admin']
        #swagger.summary = 'List all users'
        #swagger.description = 'Retrieve a list of all users. Requires superuser privileges.'
        #swagger.responses[200] = {
            description: 'List of users',
            schema: {
                users: [
                    {
                        id: '1',
                        email: 'user@example.com',
                        name: 'John Doe',
                        is_superuser: false,
                        is_active: true,
                        date_joined: '2023-01-01T00:00:00.000Z'
                    }
                ]
            }
        }
    */
    const users = await DI.users.findAll({
        orderBy: { date_joined: 'DESC' },
    })

    const userList: UserListItem[] = users.map((user) => ({
        id: user.id.toString(),
        email: user.email,
        name: user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.first_name || null,
        is_superuser: user.is_superuser,
        is_active: user.is_active,
        date_joined: user.date_joined.toISOString(),
    }))

    res.status(200).json({ users: userList })
}

const impersonateUser = async (req: Request, res: Response) => {
    /*
        #swagger.tags = ['Admin']
        #swagger.summary = 'Impersonate a user'
        #swagger.description = 'Generate an access token for a specific user. Requires superuser privileges.'
        #swagger.parameters['userId'] = {
            description: 'ID of the user to impersonate',
            required: true,
            type: 'string'
        }
        #swagger.responses[200] = {
            description: 'Impersonation successful',
            schema: { message: 'Impersonation successful' }
        }
        #swagger.responses[400] = { description: 'User ID is required' }
        #swagger.responses[404] = { description: 'User not found' }
    */
    const { userId } = req.params

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' })
    }

    const user = await DI.users.findOne({ id: BigInt(userId) })
    if (!user) {
        return res.status(404).json({ error: 'User not found' })
    }

    const accessToken = generateAccessToken(user.email)
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: ENABLE_SECURITY_SETTINGS,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
        path: '/',
    })

    res.status(200).json({ message: 'Impersonation successful' })
}

export const adminRouter = express.Router({ mergeParams: true })
adminRouter.get('/users', [requireSuperuser()], listUsers)
adminRouter.post('/impersonate/:userId', [requireSuperuser()], impersonateUser)
