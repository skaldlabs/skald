import express from 'express'
import { Request, Response } from 'express'
import { DI } from '@/di'

export const planRouter = express.Router({ mergeParams: true })

interface PlanResponse {
    id: string
    slug: string
    name: string
    stripe_price_id: string | undefined
    monthly_price: string
    memo_operations_limit: number | undefined
    chat_queries_limit: number | undefined
    projects_limit: number | undefined
    features: Record<string, unknown>
    is_default: boolean
}

const list = async (req: Request, res: Response) => {
    const plans = await DI.plans.findAll({
        where: {
            isActive: true,
        },
        orderBy: {
            monthly_price: 'ASC',
        },
    })

    const planResponses: PlanResponse[] = plans.map((plan) => ({
        id: plan.id.toString(),
        slug: plan.slug,
        name: plan.name,
        stripe_price_id: plan.stripe_price_id,
        monthly_price: plan.monthly_price,
        memo_operations_limit: plan.memo_operations_limit,
        chat_queries_limit: plan.chat_queries_limit,
        projects_limit: plan.projects_limit,
        features: plan.features,
        is_default: plan.isDefault,
    }))

    res.status(200).json(planResponses)
}

planRouter.get('/', list)
