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

const listPlans = async (req: Request, res: Response) => {
    const plans = await DI.plans.findAll({ orderBy: { monthly_price: 'ASC' } })

    const planList = plans.map((plan) => ({
        id: plan.id.toString(),
        slug: plan.slug,
        name: plan.name,
        monthly_price: plan.monthly_price,
        memo_operations_limit: plan.memo_operations_limit ?? null,
        chat_queries_limit: plan.chat_queries_limit ?? null,
        memo_operation_overage_price: plan.memo_operation_overage_price || null,
        chat_query_overage_price: plan.chat_query_overage_price || null,
        is_active: plan.isActive,
    }))

    res.status(200).json({ plans: planList })
}

const updateOveragePricing = async (req: Request, res: Response) => {
    const { planId } = req.params
    const { memo_operation_overage_price, chat_query_overage_price } = req.body

    const plan = await DI.plans.findOne({ id: BigInt(planId) })
    if (!plan) {
        return res.status(404).json({ error: 'Plan not found' })
    }

    if (plan.slug === 'free') {
        return res.status(400).json({ error: 'Cannot set overage pricing on the free plan' })
    }

    if (memo_operation_overage_price !== undefined) {
        if (memo_operation_overage_price === null) {
            plan.memo_operation_overage_price = undefined
        } else {
            const price = parseFloat(memo_operation_overage_price)
            if (isNaN(price) || price < 0) {
                return res.status(400).json({ error: 'memo_operation_overage_price must be a non-negative number' })
            }
            plan.memo_operation_overage_price = String(price)
        }
    }

    if (chat_query_overage_price !== undefined) {
        if (chat_query_overage_price === null) {
            plan.chat_query_overage_price = undefined
        } else {
            const price = parseFloat(chat_query_overage_price)
            if (isNaN(price) || price < 0) {
                return res.status(400).json({ error: 'chat_query_overage_price must be a non-negative number' })
            }
            plan.chat_query_overage_price = String(price)
        }
    }

    plan.updatedAt = new Date()
    await DI.em.persistAndFlush(plan)

    res.status(200).json({
        id: plan.id.toString(),
        slug: plan.slug,
        name: plan.name,
        memo_operation_overage_price: plan.memo_operation_overage_price || null,
        chat_query_overage_price: plan.chat_query_overage_price || null,
    })
}

export const adminRouter = express.Router({ mergeParams: true })
adminRouter.get('/users', [requireSuperuser()], listUsers)
adminRouter.post('/impersonate/:userId', [requireSuperuser()], impersonateUser)
adminRouter.get('/plans', [requireSuperuser()], listPlans)
adminRouter.patch('/plans/:planId/overage-pricing', [requireSuperuser()], updateOveragePricing)
