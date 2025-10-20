"""
Subscription Management API

Endpoints:
- GET /api/organization/{org_id}/subscription/ - Get current subscription details
- POST /api/organization/{org_id}/subscription/checkout/ - Create Stripe checkout session
- POST /api/organization/{org_id}/subscription/portal/ - Get Stripe customer portal URL
- POST /api/organization/{org_id}/subscription/change-plan/ - Change subscription plan
- GET /api/organization/{org_id}/subscription/usage/ - Get current usage
- GET /api/organization/{org_id}/subscription/usage/history/ - Get usage history
- GET /api/plans/ - List available plans
"""

import logging

from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from skald.api.permissions import (
    IsAuthenticatedOrAuthDisabled,
    OrganizationPermissionMixin,
    require_access_level,
)
from skald.models import Organization, OrganizationSubscription, Plan, UsageRecord
from skald.models.user import OrganizationMembershipRole
from skald.services import SubscriptionService, UsageTrackingService

logger = logging.getLogger(__name__)


# Serializers


class PlanSerializer(serializers.ModelSerializer):
    """Serializer for Plan model"""

    uuid = serializers.CharField(source="id", read_only=True)

    class Meta:
        model = Plan
        fields = [
            "uuid",
            "slug",
            "name",
            "stripe_price_id",
            "monthly_price",
            "memo_operations_limit",
            "chat_queries_limit",
            "projects_limit",
            "features",
            "is_default",
        ]


class SubscriptionDetailSerializer(serializers.ModelSerializer):
    """Serializer for OrganizationSubscription with plan details"""

    uuid = serializers.CharField(source="id", read_only=True)
    organization = serializers.CharField(source="organization.uuid", read_only=True)
    plan = PlanSerializer(read_only=True)

    class Meta:
        model = OrganizationSubscription
        fields = [
            "uuid",
            "organization",
            "plan",
            "stripe_customer_id",
            "stripe_subscription_id",
            "status",
            "current_period_start",
            "current_period_end",
            "cancel_at_period_end",
        ]


class UsageRecordSerializer(serializers.ModelSerializer):
    """Serializer for historical usage records"""

    projects = serializers.IntegerField(source="projects_count", read_only=True)

    class Meta:
        model = UsageRecord
        fields = [
            "billing_period_start",
            "billing_period_end",
            "memo_operations_count",
            "chat_queries_count",
            "projects",
        ]


# ViewSets


class PlanViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public read-only endpoint for listing available plans.
    No authentication required.
    """

    queryset = Plan.objects.filter(is_active=True)
    serializer_class = PlanSerializer
    permission_classes = []  # Public endpoint


class SubscriptionViewSet(OrganizationPermissionMixin, viewsets.ViewSet):
    """
    ViewSet for managing organization subscriptions.
    Most actions require organization ownership (OWNER role).
    """

    permission_classes = [IsAuthenticatedOrAuthDisabled]
    organization_url_kwarg = "parent_lookup_organization"

    @action(detail=False, methods=["get"])
    def subscription(self, request, **kwargs):
        """
        Get current subscription details for organization.

        Response:
        {
            "plan": {...},
            "status": "active",
            "current_period_start": "2025-01-01T00:00:00Z",
            "current_period_end": "2025-02-01T00:00:00Z",
            "cancel_at_period_end": false
        }
        """
        org = self.get_organization()
        subscription = org.subscription
        serializer = SubscriptionDetailSerializer(subscription)
        return Response(serializer.data)

    @action(detail=False, methods=["post"])
    @require_access_level(OrganizationMembershipRole.OWNER)
    def checkout(self, request, **kwargs):
        """
        Create Stripe Checkout session for subscribing to a plan.

        Request:
        {
            "plan_slug": "pro",
            "success_url": "https://app.useskald.com/organization/settings?success=true",
            "cancel_url": "https://app.useskald.com/organization/settings?canceled=true"
        }

        Response:
        {
            "checkout_url": "https://checkout.stripe.com/..."
        }
        """
        org = self.get_organization()
        plan_slug = request.data.get("plan_slug")
        success_url = request.data.get("success_url")
        cancel_url = request.data.get("cancel_url")

        if not all([plan_slug, success_url, cancel_url]):
            return Response(
                {"error": "plan_slug, success_url, and cancel_url are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            service = SubscriptionService()
            checkout_session = service.create_checkout_session(
                organization=org,
                plan_slug=plan_slug,
                success_url=success_url,
                cancel_url=cancel_url,
            )

            return Response({"checkout_url": checkout_session.url})
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error creating checkout session: {str(e)}")
            return Response(
                {"error": "Failed to create checkout session"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["post"])
    @require_access_level(OrganizationMembershipRole.OWNER)
    def portal(self, request, **kwargs):
        """
        Get Stripe Customer Portal URL for managing payment methods and cancellation.

        Request:
        {
            "return_url": "https://app.useskald.com/organization/settings"
        }

        Response:
        {
            "portal_url": "https://billing.stripe.com/..."
        }

        Error Response (Free Plan):
        {
            "error": "No active subscription to manage. Please upgrade to a paid plan first."
        }
        """
        org = self.get_organization()
        return_url = request.data.get("return_url")

        if not return_url:
            return Response(
                {"error": "return_url is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        if not org.subscription.stripe_customer_id:
            return Response(
                {
                    "error": "No active subscription to manage. Please upgrade to a paid plan first."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            service = SubscriptionService()
            portal_session = service.create_customer_portal_session(
                organization=org, return_url=return_url
            )

            return Response({"portal_url": portal_session.url})
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error creating portal session: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Failed to create portal session: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["post"])
    @require_access_level(OrganizationMembershipRole.OWNER)
    def change_plan(self, request, **kwargs):
        """
        Change organization's subscription plan.
        Handles upgrade/downgrade logic.

        Request:
        {
            "plan_slug": "basic"
        }

        Response:
        {
            "status": "success",
            "subscription": {...}
        }
        """
        org = self.get_organization()
        plan_slug = request.data.get("plan_slug")

        if not plan_slug:
            return Response(
                {"error": "plan_slug is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            service = SubscriptionService()
            subscription = service.change_plan(
                organization=org, new_plan_slug=plan_slug
            )

            serializer = SubscriptionDetailSerializer(subscription)
            return Response({"status": "success", "subscription": serializer.data})
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error changing plan: {str(e)}")
            return Response(
                {"error": "Failed to change plan"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["get"])
    def usage(self, request, **kwargs):
        """
        Get current billing period usage.
        Available to all organization members.

        Response:
        {
            "billing_period_start": "2025-01-01",
            "billing_period_end": "2025-02-01",
            "usage": {
                "memo_operations": {
                    "count": 45000,
                    "limit": 80000,
                    "percentage": 56.25
                },
                ...
            }
        }
        """
        org = self.get_organization()
        service = UsageTrackingService()
        usage_data = service.get_current_usage(org)

        return Response(usage_data)

    @action(detail=False, methods=["get"])
    def usage_history(self, request, **kwargs):
        """
        Get usage history for previous billing periods.
        Available to all organization members.

        Response:
        [
            {
                "billing_period_start": "2024-12-01",
                "billing_period_end": "2025-01-01",
                "memo_operations_count": 72000,
                "chat_queries_count": 8900,
                "projects": 4
            },
            ...
        ]
        """
        org = self.get_organization()
        usage_records = UsageRecord.objects.filter(organization=org).order_by(
            "-billing_period_start"
        )[
            :12
        ]  # Last 12 months

        serializer = UsageRecordSerializer(usage_records, many=True)
        return Response(serializer.data)
