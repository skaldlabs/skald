import { Request, Response, NextFunction } from 'express'
import { UsageTrackingService } from '@/services/usageTrackingService'
import { IS_SELF_HOSTED_DEPLOY, TEST } from '@/settings'
import { DI } from '@/di'
import { logger } from '@/lib/logger'
import * as Sentry from '@sentry/node'

// KLUDGE: this should ideally not be a middleware and just happen on the route handler itself.
export function trackChatUsage() {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Skip tracking if self-hosted, in test mode, or in debug mode
        if (IS_SELF_HOSTED_DEPLOY || TEST) {
            return next()
        }

        if (!req.context?.requestUser?.project) {
            throw new Error("Can't track usage for routes without requireProjectAccess middleware")
        }
        const organization = req.context?.requestUser?.project?.organization

        // Store the original res.json to intercept the response
        const originalJson = res.json.bind(res)
        const originalSend = res.send.bind(res)
        const originalEnd = res.end.bind(res)

        // Flag to ensure we only track once
        let tracked = false

        const trackUsageIfSuccessful = async () => {
            if (tracked) return
            tracked = true

            // Only track on successful responses
            if (res.statusCode >= 400) {
                return
            }

            const service = new UsageTrackingService(DI.em)
            await service.incrementChatQueries(organization)
        }

        // Intercept res.json
        res.json = function (body: any) {
            // Track usage in background (fire and forget)
            trackUsageIfSuccessful().catch((err) => {
                logger.error({ err }, 'Usage tracking error')
                Sentry.captureException(err)
            })
            return originalJson(body)
        }

        // Intercept res.send
        res.send = function (body: any) {
            // Track usage in background (fire and forget)
            trackUsageIfSuccessful().catch((err) => {
                logger.error({ err: err }, 'Usage tracking error')
                Sentry.captureException(err)
            })
            return originalSend(body)
        }

        // Intercept res.end
        res.end = function (...args: any[]) {
            // Track usage in background (fire and forget)
            trackUsageIfSuccessful().catch((err) => {
                logger.error({ err }, 'Usage tracking error')
                Sentry.captureException(err)
            })
            return originalEnd(...args)
        }

        next()
    }
}
