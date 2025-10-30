import { Resend } from 'resend'
import { EMAIL_DOMAIN, RESEND_API_KEY } from '../settings'

const resend = new Resend(RESEND_API_KEY)

export async function sendEmail(
    toEmail: string,
    subject: string,
    html: string,
    fromUser: string = 'noreply'
): Promise<void> {
    await resend.emails.send({
        from: `${fromUser}@${EMAIL_DOMAIN}`,
        to: toEmail,
        subject,
        html,
    })
}
