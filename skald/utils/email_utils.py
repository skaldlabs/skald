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


def generate_usage_alert_email(
    organization_name: str,
    limit_type: str,
    percentage: int,
    current_usage: int,
    limit: int,
) -> tuple[str, str]:
    """
    Generate subject and HTML for usage alert emails.

    Args:
        organization_name: Name of the organization
        limit_type: Type of limit (memo_operations, chat_queries, projects)
        percentage: Alert threshold (80 or 100)
        current_usage: Current usage count
        limit: Limit value

    Returns:
        Tuple of (subject, html)
    """
    limit_display = {
        "memo_operations": "Memo Operations",
        "chat_queries": "Chat Queries",
        "projects": "Projects",
    }.get(limit_type, limit_type)

    if percentage == 80:
        subject = (
            f"Usage Alert: {organization_name} has reached 80% of {limit_display} limit"
        )
        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #f59e0b;">Usage Alert: 80% Limit Reached</h2>
            <p>Hello,</p>
            <p>Your organization <strong>{organization_name}</strong> has reached <strong>80%</strong> of its <strong>{limit_display}</strong> limit.</p>
            <p><strong>Current Usage:</strong> {current_usage} / {limit}</p>
            <p>You can continue using the service, but please note that any usage over the limit will be charged at the end of the month on top of your subscription charge.</p>
            <p>Consider upgrading your plan to avoid overage charges.</p>
            <br>
            <p>Best regards,<br>The Skald Team</p>
        </body>
        </html>
        """
    else:  # 100%
        subject = f"Usage Alert: {organization_name} has reached 100% of {limit_display} limit"
        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #ef4444;">Usage Alert: Limit Reached</h2>
            <p>Hello,</p>
            <p>Your organization <strong>{organization_name}</strong> has reached <strong>100%</strong> of its <strong>{limit_display}</strong> limit.</p>
            <p><strong>Current Usage:</strong> {current_usage} / {limit}</p>
            <p><strong>Important:</strong> Any additional usage beyond this limit will be charged at the end of the month on top of your subscription charge.</p>
            <p>We recommend upgrading your plan to avoid unexpected overage charges.</p>
            <br>
            <p>Best regards,<br>The Skald Team</p>
        </body>
        </html>
        """

    return subject, html
