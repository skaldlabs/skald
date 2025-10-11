import logging
from functools import wraps

from django.conf import settings
from rest_framework.exceptions import PermissionDenied

from skald.models.organization import Organization
from skald.models.user import OrganizationMembershipRole

logger = logging.getLogger(__name__)


def require_access_level(
    org_access_level: OrganizationMembershipRole = None,
):
    """
    Decorator to specify the minimum access level required for an action.
    Usage:
        @action(detail=True, methods=['post'])
        @require_access_level(OrganizationMembershipRole.OWNER)
        def some_action(self, request, pk=None):
            ...
    """

    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(view_instance, request, *args, **kwargs):
            if not request.user.email_verified:
                raise PermissionDenied("Email not verified")

            if org_access_level:
                if not hasattr(view_instance, "check_organization_permission"):
                    exception_message = (
                        "require_access_level with org_access_level can only be used with OrganizationPermissionMixin"
                        if settings.DEBUG
                        else "You do not have enough permissions to access this resource"
                    )
                    raise Exception(exception_message)

                if view_instance.check_organization_permission(
                    request, required_access_level=org_access_level
                ):
                    return view_func(view_instance, request, *args, **kwargs)
            raise PermissionDenied(
                "You do not have enough permissions to access this resource"
            )

        return _wrapped_view

    return decorator


class OrganizationPermissionMixin:
    """
    Mixin to handle organization-based permissions.
    Requires:
    - permission_classes including IsAuthenticated
    - required_access_level class attribute (optional, defaults to MEMBER)
    - organization_url_kwarg class attribute (optional, defaults to 'organization_id')
    """

    required_access_level = OrganizationMembershipRole.MEMBER
    organization_url_kwarg = "organization_id"

    def get_organization(self):
        """Get the organization from the URL parameters"""
        org_id = self.kwargs.get(self.organization_url_kwarg)
        if not org_id:
            logger.debug("Organization ID not provided in URL")
            raise PermissionDenied("Organization ID not provided in URL")

        org = Organization.objects.filter(id=org_id).first()
        if not org:
            logger.debug("Organization not found")
            raise PermissionDenied("Organization not found")

        return org

    def check_organization_permission(
        self, request, obj=None, required_access_level=None
    ):
        """
        Check if the user has the required access level in the organization.
        Can be overridden for more specific permission checks.

        Args:
            request: The request object
            obj: Optional object being accessed
            required_access_level: Optional access level override. If not provided,
                                 uses the class's required_access_level
        """

        if not request.user.is_authenticated:
            logger.debug("User is not authenticated")
            return False

        try:
            org = self.get_organization()
        except PermissionDenied:
            logger.debug("Organization not found")
            return False

        # Get the user's membership in this organization
        membership = request.user.organizationmembership_set.filter(
            organization=org
        ).first()

        if not membership:
            logger.debug("User is not a member of the organization")
            return False

        # Use provided access level or fall back to class default
        access_level = (
            required_access_level
            if required_access_level is not None
            else self.required_access_level
        )
        # Check if user has sufficient access level
        return membership.access_level >= access_level

    def check_object_organization(self, obj):
        """Check if the object belongs to the user's organization"""
        try:
            return obj.organization_id == self.get_organization().id
        except PermissionDenied:
            return False

    def has_permission(self, request, view):
        """Check organization-level permissions"""
        return self.check_organization_permission(request)

    def has_object_permission(self, request, view, obj):
        """Check object-level permissions"""
        if not self.check_organization_permission(request, obj):
            return False
        return self.check_object_organization(obj)
