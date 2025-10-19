"""
Subscription Service
Encapsulates all Stripe subscription logic.
"""

import logging
from datetime import datetime

import stripe
from django.conf import settings
from django.utils import timezone

from skald.models import Organization, OrganizationSubscription, Plan, UsageRecord
from skald.models.subscription import SubscriptionStatus

logger = logging.getLogger(__name__)

stripe.api_key = (
    settings.STRIPE_SECRET_KEY if hasattr(settings, "STRIPE_SECRET_KEY") else None
)


class SubscriptionService:
    """Handles all subscription-related operations with Stripe"""

    def create_checkout_session(
        self,
        organization: Organization,
        plan_slug: str,
        success_url: str,
        cancel_url: str,
    ):
        """
        Create Stripe Checkout session for plan subscription.
        Creates Stripe Customer if doesn't exist.
        """
        plan = Plan.objects.get(slug=plan_slug, is_active=True)

        if not plan.stripe_price_id:
            raise ValueError(
                f"Plan {plan_slug} does not have a Stripe price ID configured"
            )

        # Get or create Stripe customer
        customer_id = self._get_or_create_stripe_customer(organization)

        # Create checkout session
        checkout_session = stripe.checkout.Session.create(
            customer=customer_id,
            mode="subscription",
            payment_method_types=["card"],
            line_items=[
                {
                    "price": plan.stripe_price_id,
                    "quantity": 1,
                }
            ],
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "organization_id": str(organization.uuid),
                "plan_slug": plan_slug,
            },
        )

        return checkout_session

    def create_customer_portal_session(
        self, organization: Organization, return_url: str
    ):
        """Create Stripe Customer Portal session for managing subscription"""
        subscription = organization.subscription

        if not subscription.stripe_customer_id:
            raise ValueError("Organization does not have a Stripe customer")

        portal_session = stripe.billing_portal.Session.create(
            customer=subscription.stripe_customer_id,
            return_url=return_url,
        )

        return portal_session

    def change_plan(self, organization: Organization, new_plan_slug: str):
        """
        Change organization's plan.
        Handles both Stripe-managed and free plan transitions.
        """
        new_plan = Plan.objects.get(slug=new_plan_slug, is_active=True)
        subscription = organization.subscription

        # Free plan -> Paid plan: Create checkout session (handled by frontend)
        if not subscription.stripe_subscription_id and new_plan.monthly_price > 0:
            raise ValueError("Use checkout session to upgrade from free plan")

        # Paid plan -> Free plan: Cancel Stripe subscription
        if subscription.stripe_subscription_id and new_plan.monthly_price == 0:
            stripe.Subscription.modify(
                subscription.stripe_subscription_id, cancel_at_period_end=True
            )
            subscription.cancel_at_period_end = True
            subscription.save()
            return subscription

        # Paid plan -> Different paid plan: Update Stripe subscription
        if subscription.stripe_subscription_id and new_plan.monthly_price > 0:
            stripe_subscription = stripe.Subscription.retrieve(
                subscription.stripe_subscription_id
            )

            stripe.Subscription.modify(
                subscription.stripe_subscription_id,
                items=[
                    {
                        "id": stripe_subscription["items"]["data"][0].id,
                        "price": new_plan.stripe_price_id,
                    }
                ],
                proration_behavior="always_invoice",  # Immediate proration
            )

            # Update local record
            subscription.plan = new_plan
            subscription.save()

        return subscription

    def _get_or_create_stripe_customer(self, organization: Organization) -> str:
        """Get existing or create new Stripe customer for organization"""
        subscription = organization.subscription

        if subscription.stripe_customer_id:
            return subscription.stripe_customer_id

        # Create new customer
        customer = stripe.Customer.create(
            email=organization.owner.email,
            name=organization.name,
            metadata={
                "organization_id": str(organization.uuid),
                "organization_name": organization.name,
            },
        )

        subscription.stripe_customer_id = customer.id
        subscription.save()

        return customer.id

    # Webhook Handlers

    def handle_checkout_completed(self, event):
        """Handle successful checkout completion"""
        session = event["data"]["object"]
        org_id = session["metadata"]["organization_id"]

        organization = Organization.objects.get(uuid=org_id)

        # Stripe will send subscription.created event, just log here
        logger.info(f"Checkout completed for {organization.name}")

    def handle_subscription_created(self, event):
        """Handle new subscription creation"""
        stripe_subscription = event["data"]["object"]
        customer_id = stripe_subscription["customer"]

        # Find organization by customer ID
        subscription = OrganizationSubscription.objects.get(
            stripe_customer_id=customer_id
        )

        # Get plan from Stripe price ID
        price_id = stripe_subscription["items"]["data"][0]["price"]["id"]
        plan = Plan.objects.get(stripe_price_id=price_id)

        # Update subscription
        subscription.stripe_subscription_id = stripe_subscription["id"]
        subscription.plan = plan
        subscription.status = stripe_subscription["status"]
        subscription.current_period_start = datetime.fromtimestamp(
            stripe_subscription["current_period_start"], tz=timezone.utc
        )
        subscription.current_period_end = datetime.fromtimestamp(
            stripe_subscription["current_period_end"], tz=timezone.utc
        )
        subscription.save()

        # Create new usage record for this billing period
        UsageRecord.objects.get_or_create(
            organization=subscription.organization,
            billing_period_start=subscription.current_period_start.date(),
            defaults={"billing_period_end": subscription.current_period_end.date()},
        )

        logger.info(f"Subscription created for {subscription.organization.name}")

    def handle_subscription_updated(self, event):
        """Handle subscription updates (plan changes, renewals)"""
        stripe_subscription = event["data"]["object"]

        subscription = OrganizationSubscription.objects.get(
            stripe_subscription_id=stripe_subscription["id"]
        )

        # Update fields
        subscription.status = stripe_subscription["status"]
        subscription.current_period_start = datetime.fromtimestamp(
            stripe_subscription["current_period_start"], tz=timezone.utc
        )
        subscription.current_period_end = datetime.fromtimestamp(
            stripe_subscription["current_period_end"], tz=timezone.utc
        )
        subscription.cancel_at_period_end = stripe_subscription["cancel_at_period_end"]

        # Check for plan change
        price_id = stripe_subscription["items"]["data"][0]["price"]["id"]
        new_plan = Plan.objects.get(stripe_price_id=price_id)
        if subscription.plan != new_plan:
            subscription.plan = new_plan

        subscription.save()

        # On billing period change, create new usage record
        previous_attributes = event["data"].get("previous_attributes", {})
        if "current_period_start" in previous_attributes:
            UsageRecord.objects.get_or_create(
                organization=subscription.organization,
                billing_period_start=subscription.current_period_start.date(),
                defaults={"billing_period_end": subscription.current_period_end.date()},
            )

        logger.info(f"Subscription updated for {subscription.organization.name}")

    def handle_subscription_deleted(self, event):
        """Handle subscription cancellation"""
        stripe_subscription = event["data"]["object"]

        subscription = OrganizationSubscription.objects.get(
            stripe_subscription_id=stripe_subscription["id"]
        )

        # Downgrade to free plan
        free_plan = Plan.objects.get(is_default=True)
        subscription.plan = free_plan
        subscription.status = SubscriptionStatus.CANCELED
        subscription.canceled_at = timezone.now()
        subscription.save()

        logger.info(f"Subscription canceled for {subscription.organization.name}")

    def handle_invoice_paid(self, event):
        """Handle successful payment"""
        invoice = event["data"]["object"]
        logger.info(f"Invoice paid: {invoice['id']}")
        # Could send email confirmation here

    def handle_payment_failed(self, event):
        """Handle payment failure"""
        invoice = event["data"]["object"]
        customer_id = invoice["customer"]

        subscription = OrganizationSubscription.objects.get(
            stripe_customer_id=customer_id
        )
        subscription.status = SubscriptionStatus.PAST_DUE
        subscription.save()

        # Send email notification to organization owner
        logger.warning(f"Payment failed for {subscription.organization.name}")
        # TODO: Send email notification
