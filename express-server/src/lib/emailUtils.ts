import { Resend } from 'resend'
import { RESEND_API_KEY, EMAIL_DOMAIN } from '../settings'

const resend = new Resend(RESEND_API_KEY)

export const sendEmail = async (to: string, subject: string, html: string, from_user: string = 'noreply') => {
    const { data, error } = await resend.emails.send({
        from: `${from_user}@${EMAIL_DOMAIN}`,
        to,
        subject,
        html: html,
    })

    return { data, error }
}
