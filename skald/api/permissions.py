import logging
from functools import wraps
from typing import Optional, Tuple

from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import BasePermission
from rest_framework.response import Response

from skald.models.organization import Organization
from skald.models.project import Project, ProjectApiKey
from skald.models.user import OrganizationMembership, OrganizationMembershipRole
from skald.utils.api_key_utils import hash_api_key

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

        org = Organization.objects.filter(uuid=org_id).first()
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
        membership = OrganizationMembership.objects.filter(
            user=request.user, organization=org
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
            return obj.organization_id == self.get_organization().uuid
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


class ProjectAPIUser(AnonymousUser):
    """
    User for project-based API authentication.
    """

    id = "PROJECT_API_USER"
    project: Optional[Project] = None

    class Meta:
        managed = False

    @property
    def is_authenticated(self):
        return True


class ProjectAPIKeyAuthentication:
    """
    Authentication class to handle project-based API key permissions.
    """

    def authenticate(self, request):
        # Get API key from Authorization header
        auth_header = request.META.get("HTTP_AUTHORIZATION")
        if not auth_header:
            return None

        # Check if it's a Bearer token
        if not auth_header.startswith("Bearer "):
            return None

        api_key = auth_header.split(" ")[1]
        api_key_hash = hash_api_key(api_key)

        try:
            project_api_key = ProjectApiKey.objects.get(api_key_hash=api_key_hash)
            project = project_api_key.project
            user = ProjectAPIUser()
            user.project = project

            # mark this request as API key authenticated to exempt CSRF protection
            request._api_key_authenticated = True

            return (user, project_api_key)
        except ProjectApiKey.DoesNotExist:
            return None

    def authenticate_header(self, request):
        return "Bearer"


def is_user_org_member(user, organization):
    return OrganizationMembership.objects.filter(
        user=user, organization=organization
    ).exists()


def get_project_for_request(
    user, request
) -> Tuple[Optional[Project], Optional[Response]]:
    """
    Get the project for a request, handling both PROJECT_API_USER and regular users.

    Returns:
        tuple: (project, error_response) where one will be None
            - If successful: (project, None)
            - If error: (None, error_response)
    """
    # If auth is disabled, try to get project from request data
    if settings.DISABLE_AUTH:
        project_id = request.data.get("project_id")
        if not project_id:
            return None, Response(
                {"error": "project_id is required when authentication is disabled"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            project = Project.objects.get(uuid=project_id)
            return project, None
        except Project.DoesNotExist:
            return None, Response(
                {"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND
            )

    # Check if this is a ProjectAPIUser (authenticated via API key)
    if isinstance(user, ProjectAPIUser):
        # For API key auth, the project is already attached to the user
        if user.project is None:
            return None, Response(
                {"error": "Project not found"}, status=status.HTTP_400_BAD_REQUEST
            )

        return user.project, None
    else:
        # For regular user authentication
        project_id = request.data.get("project_id")
        try:
            project = Project.objects.get(uuid=project_id)
        except Project.DoesNotExist:
            return None, Response(
                {"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND
            )

        if not is_user_org_member(user, project.organization):
            return None, Response(
                {"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN
            )

        return project, None


class AuthBypassMixin:
    """
    Mixin to bypass authentication when DISABLE_AUTH is True.
    This should be used in combination with existing permission classes.
    """

    def get_permissions(self):
        """Override to conditionally disable authentication"""
        if settings.DISABLE_AUTH:
            return []
        return super().get_permissions()

    def get_authenticators(self):
        """Override to conditionally disable authentication classes"""
        if settings.DISABLE_AUTH:
            return []
        return super().get_authenticators()


class AllowAnyWhenAuthDisabled(BasePermission):
    """
    Permission class that allows access when DISABLE_AUTH is True,
    otherwise delegates to the next permission class.
    """

    def has_permission(self, request, view):
        if settings.DISABLE_AUTH:
            return True
        # If auth is not disabled, this permission class doesn't grant access
        # The next permission class in the list will be checked
        return False


class IsAuthenticatedOrAuthDisabled(BasePermission):
    """
    Permission class that allows access if user is authenticated OR if DISABLE_AUTH is True.
    """

    def has_permission(self, request, view):
        if settings.DISABLE_AUTH:
            return True
        return request.user and request.user.is_authenticated
