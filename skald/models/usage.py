from django.db import models

from skald.models.organization import Organization


class UsageRecord(models.Model):
    """
    Tracks organization usage per billing period.
    One record per organization per billing period.
    """

    # Relationships
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="usage_records"
    )

    # Billing Period
    billing_period_start = models.DateField()
    billing_period_end = models.DateField()

    # Usage Counters
    memo_operations_count = models.IntegerField(default=0)
    chat_queries_count = models.IntegerField(default=0)

    # Alert Tracking - stores which usage alerts have been sent
    # Structure: {"memo_operations_80": true, "chat_queries_100": true, ...}
    alerts_sent = models.JSONField(default=dict)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [("organization", "billing_period_start")]
        indexes = [
            models.Index(fields=["organization", "billing_period_start"]),
            models.Index(fields=["billing_period_start"]),
        ]
        ordering = ["-billing_period_start"]

    @property
    def projects_count(self):
        """Compute current projects count (not stored)"""
        return self.organization.projects.count()

    def __str__(self):
        return f"{self.organization.name} - {self.billing_period_start} to {self.billing_period_end}"
