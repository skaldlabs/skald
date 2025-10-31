import { CreateEmailResponseSuccess, ErrorResponse, Resend } from 'resend'
import { EMAIL_DOMAIN, RESEND_API_KEY } from '@/settings'

const resend = new Resend(RESEND_API_KEY)

export async function sendEmail(
    toEmail: string,
    subject: string,
    html: string,
    fromUser: string = 'noreply'
): Promise<{ data: CreateEmailResponseSuccess | null; error: ErrorResponse | null }> {
    const { data, error } = await resend.emails.send({
        from: `${fromUser}@${EMAIL_DOMAIN}`,
        to: toEmail,
        subject,
        html,
    })
    return { data, error }
}
