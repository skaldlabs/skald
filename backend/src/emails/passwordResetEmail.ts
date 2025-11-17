import { sendEmail } from '@/lib/emailUtils'
import { FRONTEND_URL } from '@/settings'

export interface PasswordResetContext {
    resetUrl: string
    email: string
}

function generatePasswordResetHTML(context: PasswordResetContext): string {
    const { resetUrl } = context

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset your password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 32px; border-bottom: 3px solid #3b82f6;">
                            <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #111827;">
                                Reset your password
                            </h1>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 32px 40px;">
                            <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #374151;">
                                We received a request to reset your password for your Skald account.
                            </p>

                            <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #374151;">
                                Click the button below to create a new password:
                            </p>

                            <!-- CTA Button -->
                            <table role="presentation" style="border-collapse: collapse; width: 100%; margin: 0 0 24px;">
                                <tr>
                                    <td align="center">
                                        <a href="${resetUrl}" style="display: inline-block; padding: 12px 32px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                                            Reset password
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Expiration Notice -->
                            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
                                <p style="margin: 0; font-size: 14px; line-height: 20px; color: #92400e;">
                                    <strong>This link will expire in 10 minutes.</strong>
                                </p>
                            </div>

                            <p style="margin: 24px 0 0; font-size: 14px; line-height: 20px; color: #6b7280;">
                                If the button doesn't work, copy and paste this link into your browser:
                            </p>
                            <p style="margin: 8px 0 0; font-size: 13px; line-height: 20px; color: #3b82f6; word-break: break-all;">
                                ${resetUrl}
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 40px; border-top: 1px solid #e5e7eb; background-color: #f9fafb;">
                            <p style="margin: 0 0 8px; font-size: 13px; line-height: 20px; color: #6b7280;">
                                If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
                            </p>
                            <p style="margin: 0; font-size: 13px; line-height: 20px; color: #6b7280;">
                                This is an automated message from Skald. Please do not reply to this email.
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

export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`

    const context: PasswordResetContext = {
        resetUrl,
        email,
    }

    const subject = 'Reset Your Skald Password'
    const html = generatePasswordResetHTML(context)

    await sendEmail(email, subject, html)
}
