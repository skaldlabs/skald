/**
 * Usage Alert Email Service
 *
 * Handles sending email alerts for usage thresholds (80% and 100%)
 */

import { sendEmail } from '@/lib/emailUtils'
import { Organization } from '@/entities/Organization'
import { DI } from '@/di'
import { FRONTEND_URL } from '@/settings'
import { logger } from './logger'

export interface UsageAlertContext {
    organizationName: string
    limitType: string
    limitTypeDisplay: string
    percentage: number
    currentUsage: number
    limit: number
    billingPeriodEnd?: string
    subscriptionUrl: string
}

/**
 * Generate HTML email for usage alert
 */
function generateUsageAlertHTML(context: UsageAlertContext, isWarning: boolean): string {
    const { organizationName, limitTypeDisplay, percentage, currentUsage, limit, billingPeriodEnd, subscriptionUrl } =
        context

    const color = isWarning ? '#f59e0b' : '#ef4444' // amber-500 : red-500
    const icon = isWarning ? '⚠️' : '🚨'
    const title = isWarning
        ? `${icon} Usage Warning: ${percentage}% of ${limitTypeDisplay} Limit Reached`
        : `${icon} Usage Limit Reached: ${limitTypeDisplay}`

    const message = isWarning
        ? `Your organization <strong>${organizationName}</strong> has used <strong>${currentUsage} of ${limit}</strong> ${limitTypeDisplay.toLowerCase()} (${percentage}% of your plan limit).`
        : `Your organization <strong>${organizationName}</strong> has reached the limit for ${limitTypeDisplay.toLowerCase()}. You've used <strong>${currentUsage} of ${limit}</strong>.`

    const actionMessage = isWarning
        ? 'Consider upgrading your plan to avoid service interruption.'
        : 'Please upgrade your plan to continue using this feature.'

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 32px; border-bottom: 3px solid ${color};">
                            <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #111827;">
                                ${icon} Usage ${isWarning ? 'Warning' : 'Limit Reached'}
                            </h1>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 32px 40px;">
                            <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #374151;">
                                ${message}
                            </p>

                            <!-- Usage Stats Box -->
                            <div style="background-color: #f9fafb; border-left: 4px solid ${color}; padding: 16px; margin: 24px 0; border-radius: 4px;">
                                <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.025em;">
                                    Current Usage
                                </p>
                                <p style="margin: 0; font-size: 32px; font-weight: 700; color: ${color};">
                                    ${percentage}%
                                </p>
                                <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280;">
                                    <strong style="color: #111827;">${currentUsage}</strong> of <strong style="color: #111827;">${limit}</strong> ${limitTypeDisplay.toLowerCase()}
                                </p>
                                ${billingPeriodEnd ? `<p style="margin: 8px 0 0; font-size: 13px; color: #9ca3af;">Resets on ${billingPeriodEnd}</p>` : ''}
                            </div>

                            <p style="margin: 24px 0 0; font-size: 16px; line-height: 24px; color: #374151;">
                                ${actionMessage}
                            </p>
                        </td>
                    </tr>

                    <!-- CTA Button -->
                    <tr>
                        <td style="padding: 0 40px 32px;">
                            <table role="presentation" style="border-collapse: collapse; width: 100%;">
                                <tr>
                                    <td align="center">
                                        <a href="${subscriptionUrl}" style="display: inline-block; padding: 12px 32px; background-color: ${color}; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                                            Manage Subscription
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 40px; border-top: 1px solid #e5e7eb; background-color: #f9fafb;">
                            <p style="margin: 0; font-size: 13px; line-height: 20px; color: #6b7280;">
                                This is an automated alert from Skald. If you have questions, please contact our support team.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`
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
 * Send usage alert email
 */
export async function sendUsageAlertEmail(
    organization: Organization,
    limitType: string,
    percentage: number,
    currentUsage: number,
    limit: number,
    billingPeriodEnd?: string
): Promise<void> {
    try {
        // Ensure owner is populated
        await DI.em.populate(organization, ['owner'])

        const ownerEmail = organization.owner.email
        const isWarning = percentage < 100

        const context: UsageAlertContext = {
            organizationName: organization.name,
            limitType,
            limitTypeDisplay: getLimitTypeDisplay(limitType),
            percentage: Math.round(percentage),
            currentUsage,
            limit,
            billingPeriodEnd,
            subscriptionUrl: `${FRONTEND_URL}/organization/subscription`,
        }

        const subject = isWarning
            ? `⚠️ Skald Usage Warning: ${context.limitTypeDisplay} at ${context.percentage}%`
            : `🚨 Skald Usage Limit Reached: ${context.limitTypeDisplay}`

        const html = generateUsageAlertHTML(context, isWarning)

        const { error } = await sendEmail(ownerEmail, subject, html, 'alerts')

        if (error) {
            logger.error({ err: error }, 'Failed to send usage alert email')
            throw new Error(`Email send failed: ${error.message}`)
        }

        logger.info(
            { ownerEmail, organizationName: organization.name, limitType, percentage },
            'Usage alert email sent'
        )
    } catch (error) {
        logger.error({ err: error }, 'Error in sendUsageAlertEmail')
        throw error
    }
}
