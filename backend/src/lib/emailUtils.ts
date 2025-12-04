import { CreateEmailResponseSuccess, ErrorResponse, Resend } from 'resend'
import { EMAIL_DOMAIN, RESEND_API_KEY, RESEND_DEFAULT_AUDIENCE_ID } from '@/settings'

// Initialize Resend only if API key is available
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null

/**
 * Validates if a string is a valid email address
 * Uses RFC 5322 compliant regex pattern
 */
export function isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
        return false
    }

    // Basic regex for email validation
    // This pattern covers most common email formats and rejects obvious XSS attempts
    const emailRegex =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

    // Additional checks to prevent XSS and other attacks
    if (email.includes('<') || email.includes('>') || email.includes('script')) {
        return false
    }

    // Check max length (RFC 5321 specifies 254 characters max)
    if (email.length > 254) {
        return false
    }

    // Check local part length (before @) - max 64 characters
    const parts = email.split('@')
    if (parts.length !== 2 || parts[0].length > 64 || parts[0].length === 0) {
        return false
    }

    return emailRegex.test(email)
}

export async function sendEmail(
    toEmail: string,
    subject: string,
    html: string,
    fromUser: string = 'noreply'
): Promise<{ data: CreateEmailResponseSuccess | null; error: ErrorResponse | null }> {
    if (!resend) {
        throw new Error('Resend API key not configured')
    }
    const { data, error } = await resend.emails.send({
        from: `${fromUser}@${EMAIL_DOMAIN}`,
        to: toEmail,
        subject,
        html,
    })
    return { data, error }
}

export async function addContactToResend(email: string, firstName?: string, lastName?: string): Promise<void> {
    if (!resend) {
        return
    }

    try {
        await resend.contacts.create({
            email,
            firstName,
            lastName,
            audienceId: RESEND_DEFAULT_AUDIENCE_ID,
        })
    } catch (error) {
        console.error('Failed to add contact to Resend:', error)
    }
}

export async function sendWelcomeEmail(email: string, firstName?: string): Promise<void> {
    if (!resend) {
        return
    }

    try {
        await resend.emails.send({
            from: `Pedrique from Skald <pedrique@updates.${EMAIL_DOMAIN}>`,
            to: email,
            replyTo: `pedrique@${EMAIL_DOMAIN}`,
            subject: 'Welcome to Skald',
            html: `
                <p>Hey ${firstName ?? 'there'},</p>

                <p>I'm Pedrique. I'm the co-founder at Skald.</p>

                <p>
                    We built Skald because teams deserved a cleaner way to make their data actually usable with AI.
                    A simple, fast platform you can run inside your own infra.
                    Just drop in your knowledge and get reliable answers back.
                </p>

                <p>Here are 3 tips to get started:</p>

                <ul>
                    <li><a href="https://platform.useskald.com/">Create your first Memo</a></li>
                    <li><a href="https://docs.useskald.com">Explore the docs</a></li>
                </ul>

                <p><b>P.S. What made you sign up? I'm genuinely curious.</b></p>
                <p>Just hit reply and tell me. I read and respond to every message.</p>

                <p>Cheers,<br/>Pedrique</p>
            `,
        })
    } catch (error) {
        console.error('Failed to send welcome email:', error)
    }
}
