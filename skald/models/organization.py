import uuid

from django.conf import settings
from django.db import models


class Organization(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    name = models.CharField(max_length=255)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owned_organizations",
    )

    @property
    def current_plan(self):
        """Returns the current plan for this organization"""
        try:
            return self.subscription.plan
        except Exception:
            # Import here to avoid circular dependency
            from skald.models.plan import Plan

            # Return free plan if no subscription exists
            try:
                return Plan.objects.get(is_default=True)
            except Plan.DoesNotExist:
                return None

    def __str__(self):
        return self.name
