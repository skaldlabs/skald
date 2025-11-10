/**
 * Usage Tracking Middleware
 *
 * Middleware that tracks usage for memo operations, chat queries, and projects.
 * Only tracks on successful responses (status < 400).
 * Respects IS_SELF_HOSTED_DEPLOY flag to disable tracking for self-hosted instances.
 */

import { Request, Response, NextFunction } from 'express'
import { UsageTrackingService } from '@/services/usageTrackingService'
import { Organization } from '@/entities/Organization'
import { IS_SELF_HOSTED_DEPLOY, TEST } from '@/settings'
import { DI } from '@/di'
import { logger } from '@/lib/logger'

type LimitType = 'memo_operations' | 'chat_queries' | 'projects'

interface TrackUsageOptions {
    increment?: boolean
}

/**
 * Middleware factory for tracking usage
 *
 * @param limitType - The type of limit to track
 * @param options - Configuration options
 * @param options.increment - Whether to increment the counter (default: true). If false, only sends alerts.
 *
 * @example
 * // Track memo creation
 * router.post('/', trackUsage('memo_operations'), createMemo)
 *
 * // Track but don't increment (alerts only)
 * router.delete('/:id', trackUsage('memo_operations', { increment: false }), deleteMemo)
 */
export function trackUsage(limitType: LimitType, options: TrackUsageOptions = {}) {
    const { increment = true } = options

    return async (req: Request, res: Response, next: NextFunction) => {
        // Skip tracking if self-hosted, in test mode, or in debug mode
        if (IS_SELF_HOSTED_DEPLOY || TEST) {
            return next()
        }

        // Check limit BEFORE allowing operation
        // For projects, always check even if increment is false (they're counted differently)
        // For other types, only check if increment is true
        if (limitType === 'projects') {
            try {
                const organization = await extractOrganization(req)

                if (organization) {
                    const service = new UsageTrackingService(DI.em)
                    const { withinLimit, currentCount, limit } = await service.checkLimit(organization, limitType)

                    if (!withinLimit) {
                        // Limit exceeded - return 403 error
                        return res.status(403).json({
                            error: 'Usage limit exceeded',
                            detail: `You have reached your plan limit for ${getLimitTypeDisplay(limitType)}. Current usage: ${currentCount}/${limit}. Please upgrade your plan to continue.`,
                            limit_type: limitType,
                            current_count: currentCount,
                            limit: limit,
                        })
                    }
                }
            } catch (error) {
                logger.error({ err: error }, 'Error checking usage limit')
                // Continue on error - don't block the operation
            }
        }

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

            try {
                // Extract organization from request context
                const organization = await extractOrganization(req)

                if (!organization) {
                    // No organization found - this is fine for some endpoints
                    return
                }

                const service = new UsageTrackingService(DI.em)

                // Increment usage or just check alerts
                if (increment) {
                    switch (limitType) {
                        case 'memo_operations':
                            await service.incrementMemoOperations(organization)
                            break
                        case 'chat_queries':
                            await service.incrementChatQueries(organization)
                            break
                        // Projects don't increment - they're counted differently
                        case 'projects':
                            break
                    }
                } else {
                    // For delete operations or alert-only tracking
                    // The alert checking is handled inside increment methods
                    // For projects, we could add alert checking here if needed
                }
            } catch (error) {
                // Log error but don't break the response
                logger.error({ err: error }, 'Usage tracking error')
            }
        }

        // Intercept res.json
        res.json = function (body: any) {
            // Track usage in background (fire and forget)
            trackUsageIfSuccessful().catch((err) => {
                logger.error({ err }, 'Failed to track usage')
            })
            return originalJson(body)
        }

        // Intercept res.send
        res.send = function (body: any) {
            // Track usage in background (fire and forget)
            trackUsageIfSuccessful().catch((err) => {
                logger.error({ err }, 'Failed to track usage')
            })
            return originalSend(body)
        }

        // Intercept res.end
        res.end = function (...args: any[]) {
            // Track usage in background (fire and forget)
            trackUsageIfSuccessful().catch((err) => {
                logger.error({ err }, 'Failed to track usage')
            })
            return originalEnd(...args)
        }

        next()
    }
}

/**
 * Get display name for limit type
 */
function getLimitTypeDisplay(limitType: string): string {
    switch (limitType) {
        case 'memo_operations':
            return 'Memo Operations'
        case 'chat_queries':
            return 'Chat Queries'
        case 'projects':
            return 'Projects'
        default:
            return limitType
                .split('_')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')
    }
}

/**
 * Extract organization from request context
 * Tries multiple strategies in order of priority
 */
async function extractOrganization(req: Request): Promise<Organization | null> {
    try {
        // Create a forked EntityManager for this context
        const em = DI.em.fork()

        // Strategy 1: Get from project in request context
        const project = req.context?.requestUser?.project
        if (project) {
            // Ensure organization is populated
            await em.populate(project, ['organization'])
            return project.organization
        }

        // Strategy 2: Get from user's default organization
        const user = req.context?.requestUser?.userInstance
        if (user) {
            await em.populate(user, ['defaultOrganization'])
            return user.defaultOrganization || null
        }

        // Strategy 3: Get from organization UUID in params (for org-level endpoints)
        const orgUuid = req.params.organization_uuid
        if (orgUuid) {
            const organization = await DI.organizations.findOne({ uuid: orgUuid })
            return organization
        }

        return null
    } catch (error) {
        logger.error({ err: error }, 'Error extracting organization')
        return null
    }
}
