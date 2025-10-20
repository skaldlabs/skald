"""
Subscription Service
Encapsulates all Stripe subscription logic.
"""

import logging
from datetime import datetime
from datetime import timezone as dt_timezone

import stripe
from django.conf import settings
from django.utils import timezone

from skald.models import Organization, OrganizationSubscription, Plan, UsageRecord
from skald.models.subscription import SubscriptionStatus

logger = logging.getLogger(__name__)


class SubscriptionService:
    """Handles all subscription-related operations with Stripe"""

    def __init__(self):
        if hasattr(settings, "STRIPE_SECRET_KEY") and settings.STRIPE_SECRET_KEY:
            stripe.api_key = settings.STRIPE_SECRET_KEY
        else:
            logger.warning("STRIPE_SECRET_KEY not configured")

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

        customer_id = self._get_or_create_stripe_customer(organization)

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

        # Paid plan -> Different paid plan downgrade: Schedule change for end of period
        if (
            subscription.stripe_subscription_id
            and new_plan.monthly_price < subscription.plan.monthly_price
        ):
            stripe_subscription = stripe.Subscription.retrieve(
                subscription.stripe_subscription_id
            )

            schedule = stripe.SubscriptionSchedule.create(
                from_subscription=subscription.stripe_subscription_id,
            )

            stripe.SubscriptionSchedule.modify(
                schedule.id,
                phases=[
                    {
                        "items": [
                            {
                                "price": subscription.plan.stripe_price_id,
                                "quantity": 1,
                            }
                        ],
                        "start_date": int(
                            subscription.current_period_start.timestamp()
                        ),
                        "end_date": int(subscription.current_period_end.timestamp()),
                    },
                    {
                        "items": [
                            {
                                "price": new_plan.stripe_price_id,
                                "quantity": 1,
                            }
                        ],
                        "start_date": int(subscription.current_period_end.timestamp()),
                    },
                ],
            )

            subscription.plan = new_plan
            subscription.save()
            return subscription

        # Paid plan -> Different paid plan upgrade: Create new Stripe subscription for upgrade
        if (
            subscription.stripe_subscription_id
            and new_plan.monthly_price > subscription.plan.monthly_price
        ):
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
            subscription.plan = new_plan
            subscription.save()

        return subscription

    def _get_or_create_stripe_customer(self, organization: Organization) -> str:
        """Get existing or create new Stripe customer for organization"""
        subscription = organization.subscription

        if subscription.stripe_customer_id:
            return subscription.stripe_customer_id

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
        try:
            stripe_subscription = event["data"]["object"]
            logger.info(
                f"Processing subscription.created event: {stripe_subscription.get('id')}"
            )

            customer_id = stripe_subscription.get("customer")
            if not customer_id:
                logger.error(f"No customer_id in subscription: {stripe_subscription}")
                raise ValueError("No customer_id found in subscription event")

            subscription = OrganizationSubscription.objects.get(
                stripe_customer_id=customer_id
            )

            price_id = stripe_subscription["items"]["data"][0]["price"]["id"]
            plan = Plan.objects.get(stripe_price_id=price_id)

            subscription.stripe_subscription_id = stripe_subscription.get("id")
            subscription.plan = plan
            subscription.status = stripe_subscription.get("status", "active")

            period_start = stripe_subscription.get("current_period_start")
            period_end = stripe_subscription.get("current_period_end")

            if not period_start or not period_end:
                items_data = stripe_subscription.get("items", {}).get("data", [])
                if items_data:
                    period_start = items_data[0].get("current_period_start")
                    period_end = items_data[0].get("current_period_end")

            if not period_start:
                period_start = stripe_subscription.get(
                    "billing_cycle_anchor"
                ) or stripe_subscription.get("start_date")
                if not period_start:
                    logger.error(f"No period start timestamp found in subscription")
                    raise ValueError("Cannot determine current_period_start")

            if not period_end:
                # Calculate end based on start + 30 days as fallback
                logger.warning(f"No period end found, calculating from start date")
                period_end = period_start + (30 * 24 * 60 * 60)  # 30 days in seconds

            subscription.current_period_start = datetime.fromtimestamp(
                period_start, tz=dt_timezone.utc
            )
            subscription.current_period_end = datetime.fromtimestamp(
                period_end, tz=dt_timezone.utc
            )
            subscription.save()

            UsageRecord.objects.get_or_create(
                organization=subscription.organization,
                billing_period_start=subscription.current_period_start.date(),
                defaults={"billing_period_end": subscription.current_period_end.date()},
            )

            logger.info(
                f"Subscription created successfully for {subscription.organization.name}"
            )
        except Exception as e:
            logger.error(
                f"Error in handle_subscription_created: {str(e)}", exc_info=True
            )
            raise

    def handle_subscription_updated(self, event):
        """Handle subscription updates (plan changes, renewals)"""
        try:
            stripe_subscription = event["data"]["object"]
            logger.info(
                f"Processing subscription.updated event: {stripe_subscription.get('id')}"
            )

            subscription = OrganizationSubscription.objects.get(
                stripe_subscription_id=stripe_subscription.get("id")
            )

            subscription.status = stripe_subscription.get("status", subscription.status)

            period_start = stripe_subscription.get("current_period_start")
            period_end = stripe_subscription.get("current_period_end")

            if not period_start or not period_end:
                items_data = stripe_subscription.get("items", {}).get("data", [])
                if items_data:
                    period_start = items_data[0].get("current_period_start")
                    period_end = items_data[0].get("current_period_end")

            if period_start:
                subscription.current_period_start = datetime.fromtimestamp(
                    period_start, tz=dt_timezone.utc
                )
            if period_end:
                subscription.current_period_end = datetime.fromtimestamp(
                    period_end, tz=dt_timezone.utc
                )

            subscription.cancel_at_period_end = stripe_subscription.get(
                "cancel_at_period_end", False
            )

            price_id = stripe_subscription["items"]["data"][0]["price"]["id"]
            new_plan = Plan.objects.get(stripe_price_id=price_id)
            if subscription.plan != new_plan:
                logger.info(
                    f"Plan changed from {subscription.plan.name} to {new_plan.name}"
                )
                subscription.plan = new_plan

            subscription.save()

            previous_attributes = event["data"].get("previous_attributes", {})
            if "current_period_start" in previous_attributes:
                UsageRecord.objects.get_or_create(
                    organization=subscription.organization,
                    billing_period_start=subscription.current_period_start.date(),
                    defaults={
                        "billing_period_end": subscription.current_period_end.date()
                    },
                )

            logger.info(
                f"Subscription updated successfully for {subscription.organization.name}"
            )
        except Exception as e:
            logger.error(
                f"Error in handle_subscription_updated: {str(e)}", exc_info=True
            )
            raise

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

    def handle_payment_failed(self, event):
        """Handle payment failure"""
        invoice = event["data"]["object"]
        customer_id = invoice["customer"]

        subscription = OrganizationSubscription.objects.get(
            stripe_customer_id=customer_id
        )
        subscription.status = SubscriptionStatus.PAST_DUE
        subscription.save()

        logger.warning(f"Payment failed for {subscription.organization.name}")
