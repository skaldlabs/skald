"""
Usage Tracking Service
Handles increment and retrieval of usage metrics.
"""

from django.db.models import F

from skald.models import Organization, UsageRecord


class UsageTrackingService:
    """Handles usage tracking and limit checking"""

    def increment_memo_operations(self, organization: Organization):
        """Increment memo operations counter for current billing period"""
        usage_record = self._get_or_create_current_usage(organization)
        UsageRecord.objects.filter(pk=usage_record.pk).update(
            memo_operations_count=F("memo_operations_count") + 1
        )

    def increment_chat_queries(self, organization: Organization):
        """Increment chat queries counter for current billing period"""
        usage_record = self._get_or_create_current_usage(organization)
        UsageRecord.objects.filter(pk=usage_record.pk).update(
            chat_queries_count=F("chat_queries_count") + 1
        )

    def get_current_usage(self, organization: Organization):
        """
        Get current billing period usage with limits.

        Returns:
        {
            "current_period": {...},
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
            "current_period": {
                "start": str(subscription.current_period_start.date()),
                "end": str(subscription.current_period_end.date()),
            },
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
