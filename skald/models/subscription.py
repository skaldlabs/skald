from datetime import timedelta

from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from skald.models.organization import Organization
from skald.models.plan import Plan


class SubscriptionStatus(models.TextChoices):
    ACTIVE = "active", "Active"
    PAST_DUE = "past_due", "Past Due"
    CANCELED = "canceled", "Canceled"
    INCOMPLETE = "incomplete", "Incomplete"
    INCOMPLETE_EXPIRED = "incomplete_expired", "Incomplete Expired"
    TRIALING = "trialing", "Trialing"
    UNPAID = "unpaid", "Unpaid"


class OrganizationSubscription(models.Model):
    """
    Links an organization to a subscription plan.
    One subscription per organization.
    """

    # Core Relationships
    organization = models.OneToOneField(
        Organization, on_delete=models.CASCADE, related_name="subscription"
    )
    plan = models.ForeignKey(
        Plan, on_delete=models.PROTECT, related_name="subscriptions"
    )

    # Stripe Integration
    stripe_customer_id = models.CharField(
        max_length=255, null=True, blank=True, unique=True
    )
    stripe_subscription_id = models.CharField(
        max_length=255, null=True, blank=True, unique=True
    )
    stripe_schedule_id = models.CharField(
        max_length=255, null=True, blank=True, unique=True
    )

    # Subscription Status
    status = models.CharField(
        max_length=50,
        choices=SubscriptionStatus.choices,
        default=SubscriptionStatus.ACTIVE,
    )

    # Scheduled Plan Change
    scheduled_plan = models.ForeignKey(
        Plan,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="scheduled_subscriptions",
    )
    scheduled_change_date = models.DateTimeField(
        null=True,
        blank=True,
    )

    # Billing Period Tracking
    current_period_start = models.DateTimeField()
    current_period_end = models.DateTimeField()

    # Cancellation
    cancel_at_period_end = models.BooleanField(default=False)
    canceled_at = models.DateTimeField(null=True, blank=True)

    # Trial (if applicable)
    trial_start = models.DateTimeField(null=True, blank=True)
    trial_end = models.DateTimeField(null=True, blank=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["stripe_customer_id"]),
            models.Index(fields=["stripe_subscription_id"]),
            models.Index(fields=["stripe_schedule_id"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"{self.organization.name} - {self.plan.name}"


class StripeEvent(models.Model):
    """
    Audit log of all Stripe webhook events.
    Prevents duplicate event processing and enables debugging.
    """

    stripe_event_id = models.CharField(max_length=255, unique=True)
    event_type = models.CharField(max_length=100)
    payload = models.JSONField()
    processed = models.BooleanField(default=False)
    processing_error = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["stripe_event_id"]),
            models.Index(fields=["event_type", "processed"]),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.event_type} - {self.stripe_event_id}"


@receiver(post_save, sender=Organization)
def create_default_subscription(sender, instance, created, **kwargs):
    """
    Automatically create free plan subscription for new organizations.
    """
    if created:
        try:
            free_plan = Plan.objects.get(is_default=True)
            now = timezone.now()

            OrganizationSubscription.objects.create(
                organization=instance,
                plan=free_plan,
                status=SubscriptionStatus.ACTIVE,
                current_period_start=now,
                current_period_end=now + timedelta(days=30),  # Monthly billing
            )
        except Plan.DoesNotExist:
            # Free plan not yet created (during initial migration)
            # Will be created when fixtures are loaded
            pass
