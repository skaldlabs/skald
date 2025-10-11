import resend
from django.conf import settings

resend.api_key = settings.RESEND_API_KEY


def send_email(to_email: str, subject: str, html: str, from_user: str = "noreply"):
    resend.Emails.send(
        {
            "from": f"{from_user}@{settings.EMAIL_DOMAIN}",
            "to": to_email,
            "subject": subject,
            "html": html,
        }
    )
