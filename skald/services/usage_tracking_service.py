"""
Usage Tracking Service
Handles increment and retrieval of usage metrics.
"""

from django.db.models import F

from skald.models import Organization, UsageRecord
from skald.utils.email_utils import generate_usage_alert_email, send_email


class UsageTrackingService:
    """Handles usage tracking and limit checking"""

    def increment_memo_operations(self, organization: Organization):
        """Increment memo operations counter for current billing period"""
        usage_record = self._get_or_create_current_usage(organization)
        UsageRecord.objects.filter(pk=usage_record.pk).update(
            memo_operations_count=F("memo_operations_count") + 1
        )
        self._check_and_send_usage_alerts(organization, "memo_operations")

    def increment_chat_queries(self, organization: Organization):
        """Increment chat queries counter for current billing period"""
        usage_record = self._get_or_create_current_usage(organization)
        UsageRecord.objects.filter(pk=usage_record.pk).update(
            chat_queries_count=F("chat_queries_count") + 1
        )
        self._check_and_send_usage_alerts(organization, "chat_queries")

    def get_current_usage(self, organization: Organization):
        """
        Get current billing period usage with limits.

        Returns:
        {
            "billing_period_start": "2025-01-01",
            "billing_period_end": "2025-02-01",
            "usage": {
                "memo_operations": {"count": X, "limit": Y, "percentage": Z},
                ...
            }
        }
        """
        subscription = organization.subscription
        usage_record = self._get_or_create_current_usage(organization)
        plan = subscription.plan

        # Calculate percentages
        def calc_usage(count, limit):
            if limit is None:  # Unlimited
                return {"count": count, "limit": None, "percentage": 0}
            return {
                "count": count,
                "limit": limit,
                "percentage": round((count / limit * 100), 2) if limit > 0 else 0,
            }

        return {
            "billing_period_start": str(subscription.current_period_start.date()),
            "billing_period_end": str(subscription.current_period_end.date()),
            "usage": {
                "memo_operations": calc_usage(
                    usage_record.memo_operations_count, plan.memo_operations_limit
                ),
                "chat_queries": calc_usage(
                    usage_record.chat_queries_count, plan.chat_queries_limit
                ),
                "projects": calc_usage(
                    usage_record.projects_count, plan.projects_limit
                ),
            },
        }

    def check_limit(self, organization: Organization, limit_type: str):
        """
        Check if organization has exceeded limit for a specific type.

        Args:
            limit_type: 'memo_operations', 'chat_queries', or 'projects'

        Returns:
            (within_limit: bool, current_count: int, limit: int|None)
        """
        subscription = organization.subscription
        plan = subscription.plan
        usage_record = self._get_or_create_current_usage(organization)

        limit_map = {
            "memo_operations": (
                usage_record.memo_operations_count,
                plan.memo_operations_limit,
            ),
            "chat_queries": (usage_record.chat_queries_count, plan.chat_queries_limit),
            "projects": (usage_record.projects_count, plan.projects_limit),
        }

        current_count, limit = limit_map[limit_type]

        # None means unlimited
        if limit is None:
            return True, current_count, None

        within_limit = current_count < limit
        return within_limit, current_count, limit

    def _get_or_create_current_usage(self, organization: Organization):
        """Get or create usage record for current billing period"""
        subscription = organization.subscription
        period_start = subscription.current_period_start.date()
        period_end = subscription.current_period_end.date()

        usage_record, created = UsageRecord.objects.get_or_create(
            organization=organization,
            billing_period_start=period_start,
            defaults={"billing_period_end": period_end},
        )

        return usage_record

    def _check_and_send_usage_alerts(self, organization: Organization, limit_type: str):
        """
        Check if usage has crossed alert thresholds and send email alerts.

        Args:
            organization: Organization to check
            limit_type: 'memo_operations', 'chat_queries', or 'projects'
        """
        usage_record = self._get_or_create_current_usage(organization)
        usage_record.refresh_from_db()

        subscription = organization.subscription
        plan = subscription.plan

        limit_map = {
            "memo_operations": (
                usage_record.memo_operations_count,
                plan.memo_operations_limit,
            ),
            "chat_queries": (usage_record.chat_queries_count, plan.chat_queries_limit),
            "projects": (usage_record.projects_count, plan.projects_limit),
        }

        current_count, limit = limit_map[limit_type]

        # Skip if unlimited plan
        if limit is None:
            return

        percentage = (current_count / limit * 100) if limit > 0 else 0

        if percentage >= 80 and percentage < 100:
            alert_key = f"{limit_type}_80"
            if not usage_record.alerts_sent.get(alert_key, False):
                self._send_usage_alert(
                    organization, limit_type, 80, current_count, limit
                )
                usage_record.alerts_sent[alert_key] = True
                usage_record.save(update_fields=["alerts_sent"])

        if percentage >= 100:
            alert_key = f"{limit_type}_100"
            if not usage_record.alerts_sent.get(alert_key, False):
                self._send_usage_alert(
                    organization, limit_type, 100, current_count, limit
                )
                usage_record.alerts_sent[alert_key] = True
                usage_record.save(update_fields=["alerts_sent"])

    def _send_usage_alert(
        self,
        organization: Organization,
        limit_type: str,
        percentage: int,
        current_usage: int,
        limit: int,
    ):
        """
        Send usage alert email to organization owner.

        Args:
            organization: Organization
            limit_type: Type of limit
            percentage: Alert threshold (80 or 100)
            current_usage: Current usage count
            limit: Limit value
        """
        try:
            subject, html = generate_usage_alert_email(
                organization.name, limit_type, percentage, current_usage, limit
            )
            send_email(organization.owner.email, subject, html)
        except Exception as e:
            print(f"Failed to send usage alert email: {e}")
