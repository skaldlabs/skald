"""
Stripe Webhook Handler

Handles events from Stripe:
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- subscription_schedule.updated
- subscription_schedule.completed
- invoice.paid
- invoice.payment_failed
- checkout.session.completed
"""

import logging

import stripe
from django.conf import settings
from django.http import HttpResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from skald.models import StripeEvent
from skald.services import SubscriptionService

logger = logging.getLogger(__name__)


@csrf_exempt
@require_POST
def stripe_webhook(request):
    """
    Stripe webhook endpoint.
    Verifies signature and processes events idempotently.
    """
    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")

    # Check if Stripe is configured
    if (
        not hasattr(settings, "STRIPE_WEBHOOK_SECRET")
        or not settings.STRIPE_WEBHOOK_SECRET
    ):
        logger.warning("STRIPE_WEBHOOK_SECRET not configured")
        return HttpResponse(status=400)

    webhook_secret = settings.STRIPE_WEBHOOK_SECRET

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except ValueError:
        logger.error("Invalid webhook payload")
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError:
        logger.error("Invalid webhook signature")
        return HttpResponse(status=400)

    # Idempotency check
    if StripeEvent.objects.filter(stripe_event_id=event["id"]).exists():
        logger.info(f"Event {event['id']} already processed")
        return HttpResponse(status=200)

    # Create event record
    stripe_event = StripeEvent.objects.create(
        stripe_event_id=event["id"], event_type=event["type"], payload=event
    )

    try:
        # Route to appropriate handler
        service = SubscriptionService()
        handler = {
            "customer.subscription.created": service.handle_subscription_created,
            "customer.subscription.updated": service.handle_subscription_updated,
            "customer.subscription.deleted": service.handle_subscription_deleted,
            "subscription_schedule.updated": service.handle_subscription_schedule_updated,
            "subscription_schedule.completed": service.handle_subscription_schedule_completed,
            "invoice.paid": service.handle_invoice_paid,
            "invoice.payment_failed": service.handle_payment_failed,
            "checkout.session.completed": service.handle_checkout_completed,
        }.get(event["type"])

        if handler:
            handler(event)
            stripe_event.processed = True
            stripe_event.processed_at = timezone.now()
            stripe_event.save()
        else:
            logger.info(f"Unhandled event type: {event['type']}")

        return HttpResponse(status=200)

    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        stripe_event.processing_error = str(e)
        stripe_event.save()
        return HttpResponse(status=500)
