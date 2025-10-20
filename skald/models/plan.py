from django.db import models


class Plan(models.Model):
    """
    Defines subscription plan tiers and their limits.
    """

    # Identifiers
    slug = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)

    # Stripe Integration
    stripe_price_id = models.CharField(
        max_length=255, null=True, blank=True, unique=True
    )

    # Pricing
    monthly_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Usage Limits (null = unlimited)
    memo_operations_limit = models.IntegerField(null=True, blank=True)
    chat_queries_limit = models.IntegerField(null=True, blank=True)
    projects_limit = models.IntegerField(null=True, blank=True)

    # Additional Features (flexible JSON for future expansion)
    features = models.JSONField(default=dict)

    # Status
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["monthly_price"]

    def __str__(self):
        return f"{self.name} (${self.monthly_price}/month)"
