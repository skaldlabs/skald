"""
Usage Limit Decorators
Apply to API endpoints to enforce usage limits.
"""

from functools import wraps

from rest_framework import status
from rest_framework.response import Response

from skald.services import UsageTrackingService


def require_usage_limit(limit_type, increment=True):
    """
    Decorator to check and optionally increment usage limits.

    Usage:
        @require_usage_limit('memo_operations', increment=True)
        def create_memo(self, request):
            ...

    Args:
        limit_type: 'memo_operations', 'chat_queries', or 'projects'
        increment: Whether to increment counter after successful check

    Returns:
        402 Payment Required if limit exceeded, otherwise executes view
    """

    def decorator(view_func):
        @wraps(view_func)
        def wrapped_view(view_instance, request, *args, **kwargs):
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

            # Check limit
            service = UsageTrackingService()
            within_limit, current_count, limit = service.check_limit(
                organization, limit_type
            )

            if not within_limit:
                return Response(
                    {
                        "error": "usage_limit_exceeded",
                        "message": f"You have reached your {limit_type.replace('_', ' ')} limit",
                        "current_usage": current_count,
                        "limit": limit,
                        "upgrade_required": True,
                    },
                    status=status.HTTP_402_PAYMENT_REQUIRED,
                )

            # Execute view
            response = view_func(view_instance, request, *args, **kwargs)

            # Increment counter if successful and requested
            if increment and response.status_code < 400:
                if limit_type == "memo_operations":
                    service.increment_memo_operations(organization)
                elif limit_type == "chat_queries":
                    service.increment_chat_queries(organization)
                # Note: projects limit is checked but not incremented
                # (projects_count is a computed property)

            return response

        return wrapped_view

    return decorator
