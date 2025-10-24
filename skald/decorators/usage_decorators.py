"""
Usage Limit Decorators
Apply to API endpoints to enforce usage limits.
"""

from functools import wraps

from rest_framework import status
from rest_framework.response import Response

from skald import settings
from skald.services import UsageTrackingService


def require_usage_limit(limit_type, increment=True):
    """
    Decorator to track usage and send alert emails when limits are reached.

    Usage:
        @require_usage_limit('memo_operations', increment=True)
        def create_memo(self, request):
            ...

    Args:
        limit_type: 'memo_operations', 'chat_queries', or 'projects'
        increment: Whether to increment counter after successful execution

    Note:
        This decorator sends email alerts at 80% and 100% usage thresholds.
        Overage usage will be charged at the end of the billing period.
    """

    def decorator(view_func):
        @wraps(view_func)
        def wrapped_view(view_instance, request, *args, **kwargs):
            if settings.SELF_HOSTED_DEPLOY:
                return view_func(view_instance, request, *args, **kwargs)

            # Get organization from request context
            # This assumes the view has get_organization() method (from OrganizationPermissionMixin)
            # or get_project() which has organization
            organization = None

            # Try to get organization from view instance methods
            if hasattr(view_instance, "get_organization"):
                organization = view_instance.get_organization()
            elif hasattr(view_instance, "get_project"):
                project = view_instance.get_project()
                if project:
                    organization = project.organization
            elif hasattr(request, "user") and hasattr(
                request.user, "default_organization"
            ):
                # Fallback to user's default organization
                organization = request.user.default_organization

            if not organization:
                # If we can't determine organization, allow the request
                # (this maintains backward compatibility)
                return view_func(view_instance, request, *args, **kwargs)

            # Execute view
            response = view_func(view_instance, request, *args, **kwargs)

            # Track usage if successful
            if response.status_code < 400:
                service = UsageTrackingService()

                if increment:
                    # Increment counter (which also triggers alert checking)
                    if limit_type == "memo_operations":
                        service.increment_memo_operations(organization)
                    elif limit_type == "chat_queries":
                        service.increment_chat_queries(organization)
                else:
                    # For non-incremented types (like projects), check alerts manually
                    service._check_and_send_usage_alerts(organization, limit_type)

            return response

        return wrapped_view

    return decorator
