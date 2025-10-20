"""
Management command to retry failed Stripe webhook events.
Usage: python manage.py retry_stripe_webhook <event_id>
"""

import logging

from django.core.management.base import BaseCommand
from django.utils import timezone

from skald.models import StripeEvent
from skald.services import SubscriptionService

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Retry processing a failed Stripe webhook event"

    def add_arguments(self, parser):
        parser.add_argument(
            "--event-id",
            type=str,
            help="Stripe event ID to retry",
        )
        parser.add_argument(
            "--all-failed",
            action="store_true",
            help="Retry all failed events",
        )

    def handle(self, *args, **options):
        event_id = options.get("event_id")
        all_failed = options.get("all_failed")

        if not event_id and not all_failed:
            self.stdout.write(
                self.style.ERROR("Please provide --event-id or use --all-failed flag")
            )
            return

        if event_id:
            try:
                stripe_event = StripeEvent.objects.get(stripe_event_id=event_id)
                self.retry_event(stripe_event)
            except StripeEvent.DoesNotExist:
                self.stdout.write(self.style.ERROR(f"Event {event_id} not found"))
        elif all_failed:
            failed_events = StripeEvent.objects.filter(
                processed=False, processing_error__isnull=False
            )
            self.stdout.write(f"Found {failed_events.count()} failed events")
            for stripe_event in failed_events:
                self.retry_event(stripe_event)

    def retry_event(self, stripe_event):
        """Retry processing a single event"""
        self.stdout.write(
            f"Retrying event {stripe_event.stripe_event_id} ({stripe_event.event_type})"
        )

        try:
            service = SubscriptionService()
            handler = {
                "customer.subscription.created": service.handle_subscription_created,
                "customer.subscription.updated": service.handle_subscription_updated,
                "customer.subscription.deleted": service.handle_subscription_deleted,
                "invoice.paid": service.handle_invoice_paid,
                "invoice.payment_failed": service.handle_payment_failed,
                "checkout.session.completed": service.handle_checkout_completed,
            }.get(stripe_event.event_type)

            if handler:
                handler(stripe_event.payload)
                stripe_event.processed = True
                stripe_event.processed_at = timezone.now()
                stripe_event.processing_error = None
                stripe_event.save()
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Successfully processed event {stripe_event.stripe_event_id}"
                    )
                )
            else:
                self.stdout.write(
                    self.style.WARNING(
                        f"No handler for event type: {stripe_event.event_type}"
                    )
                )
        except Exception as e:
            logger.error(f"Error retrying event: {str(e)}", exc_info=True)
            stripe_event.processing_error = str(e)
            stripe_event.save()
            self.stdout.write(
                self.style.ERROR(
                    f"Failed to process event {stripe_event.stripe_event_id}: {str(e)}"
                )
            )
