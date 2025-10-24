import logging
import re

import posthog
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from skald.api.permissions import (
    IsAuthenticatedOrAuthDisabled,
    OrganizationPermissionMixin,
    require_access_level,
)
from skald.models.organization import Organization
from skald.models.project import Project
from skald.models.user import (
    OrganizationMembership,
    OrganizationMembershipInvite,
    OrganizationMembershipRole,
)
from skald.utils.email_utils import send_email

logger = logging.getLogger(__name__)

User = get_user_model()


def _generate_invite_email_content(
    organization_name: str, invitee_email: str
) -> tuple[str, str]:
    """Generate the email subject and HTML content for organization invites"""
    signup_url = f"{settings.FRONTEND_URL}/signup?email={invitee_email}"
    subject = f"Invitation to join {organization_name} on Skald"
    html_content = f"""
    <h2>You've been invited to join {organization_name} on Skald!</h2>
    <p>Click the link below to sign up and join the organization:</p>
    <p><a href="{signup_url}">Join {organization_name}</a></p>
    """
    return subject, html_content


class OrganizationMemberSerializer(serializers.ModelSerializer):
    email = serializers.CharField(source="user.email")
    name = serializers.CharField(source="user.name")
    role = serializers.SerializerMethodField()
    joined_at = serializers.DateTimeField()

    class Meta:
        model = OrganizationMembership
        fields = ["email", "name", "role", "joined_at"]

    def get_role(self, obj):
        return OrganizationMembershipRole(obj.access_level).name


class OrganizationInviteSerializer(serializers.ModelSerializer):
    invited_by_name = serializers.CharField(source="invited_by.name", read_only=True)
    invited_by_email = serializers.CharField(source="invited_by.email", read_only=True)

    class Meta:
        model = OrganizationMembershipInvite
        fields = ["id", "email", "created_at", "invited_by_name", "invited_by_email"]


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = [
            "uuid",
            "name",
            "owner",
        ]
        read_only_fields = [
            "owner",
        ]

    def _get_sanitized_field(self, obj, field_name):
        """Generic method to sanitize sensitive credential fields"""
        value = getattr(obj, field_name, None)
        return "----sanitized----" if value else None


class OrganizationViewSet(OrganizationPermissionMixin, viewsets.ModelViewSet):
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticatedOrAuthDisabled]
    organization_url_kwarg = "pk"

    def get_queryset(self):
        return Organization.objects.filter(
            uuid__in=OrganizationMembership.objects.filter(
                user=self.request.user
            ).values_list("organization_id", flat=True)
        )

    def create(self, request):
        if settings.IS_SELF_HOSTED_DEPLOY and Organization.objects.count() >= 1:
            return Response(
                {
                    "detail": "You can only create one organization in a self-hosted deploy"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        org = Organization.objects.create(
            name=request.data["name"],
            owner=request.user,
        )
        OrganizationMembership.objects.create(
            user=request.user,
            organization=org,
            access_level=OrganizationMembershipRole.OWNER,
        )

        request.user.default_organization = org
        request.user.save()

        Project.objects.create(
            name=f"{org.name.split(' ')[0]} Default Project",
            organization=org,
            owner=request.user,
        )

        posthog.capture(
            "organization_created",
            distinct_id=request.user.email,
            properties={
                "organization_uuid": str(org.uuid),
                "organization_name": org.name,
                "user_email": request.user.email,
            },
        )

        return Response(
            OrganizationSerializer(org).data, status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=["get"])
    def members(self, request, pk=None):
        """Get all members of the organization"""
        org = self.get_object()
        members = OrganizationMembership.objects.filter(
            organization=org
        ).select_related("user")
        return Response(OrganizationMemberSerializer(members, many=True).data)

    @action(detail=True, methods=["post"])
    def invite_member(self, request, pk=None):
        """Invite a new member to the organization"""
        org = self.get_object()
        email = request.data.get("email")

        if not email:
            return Response(
                {"detail": "Email is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = email.lower().strip()
        logger.info(f"Inviting member with email: {email}")
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            return Response(
                {"detail": "Invalid email address"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing_membership = OrganizationMembership.objects.filter(
            organization=org, user__email=email
        ).first()

        if existing_membership:
            return Response(
                {"detail": "User is already a member of this organization"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        OrganizationMembershipInvite.objects.get_or_create(
            organization=org, email=email, defaults={"invited_by": request.user}
        )

        try:
            subject, html_content = _generate_invite_email_content(org.name, email)
            send_email(
                to_email=email,
                subject=subject,
                html=html_content,
            )
            return Response({"detail": "Invitation sent successfully"})
        except Exception as e:
            return Response(
                {"detail": f"Failed to send invitation: {str(e)}"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

    @action(detail=False, methods=["get"])
    def pending_invites(self, request):
        """Get all pending organization invites for the current user"""
        invites = OrganizationMembershipInvite.objects.filter(
            email=request.user.email,
            accepted_at__isnull=True,
        ).distinct()

        return Response(
            [
                {
                    "id": invite.id,
                    "organization_uuid": invite.organization.uuid,
                    "organization_name": invite.organization.name,
                }
                for invite in invites
            ]
        )

    @action(detail=True, methods=["post"])
    def accept_invite(self, request, pk=None):
        """Accept an organization invite and set it as the default organization"""

        # Verify the user has a pending invite
        membership = OrganizationMembershipInvite.objects.filter(
            id=pk,
            email=request.user.email,
            accepted_at__isnull=True,
        ).first()

        if not membership:
            return Response(
                {"detail": "No pending invite found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        OrganizationMembership.objects.create(
            user=request.user,
            organization=membership.organization,
            access_level=OrganizationMembershipRole.MEMBER,
        )

        membership.accepted_at = timezone.now()
        membership.save()

        request.user.default_organization = membership.organization
        request.user.save()

        posthog.capture(
            "organization_invite_accepted",
            distinct_id=request.user.email,
            properties={
                "organization_uuid": str(membership.organization.uuid),
                "organization_name": membership.organization.name,
                "user_email": request.user.email,
            },
        )

        return Response({"detail": "Invite accepted successfully"})

    @require_access_level(OrganizationMembershipRole.OWNER)
    @action(detail=True, methods=["post"])
    def remove_member(self, request, pk=None):
        """Remove a member from the organization"""
        org = self.get_object()
        email = request.data.get("email")

        if not email:
            return Response(
                {"detail": "Email is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = email.lower().strip()

        try:
            membership = OrganizationMembership.objects.get(
                organization=org, user__email=email
            )
        except OrganizationMembership.DoesNotExist:
            return Response(
                {"detail": "User is not a member of this organization"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if membership.user == request.user:
            return Response(
                {"detail": "You cannot remove yourself from the organization"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if membership.access_level == OrganizationMembershipRole.OWNER:
            return Response(
                {"detail": "Cannot remove organization owner"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        membership.delete()

        if membership.user.default_organization == org:
            membership.user.default_organization = None
            membership.user.save()

        posthog.capture(
            "organization_member_removed",
            distinct_id=request.user.email,
            properties={
                "organization_uuid": str(org.uuid),
                "organization_name": org.name,
                "removed_user_email": email,
                "removed_by_email": request.user.email,
            },
        )

        return Response({"detail": "Member removed successfully"})

    @action(detail=True, methods=["get"])
    def sent_invites(self, request, pk=None):
        """Get all pending invites sent by this organization"""
        org = self.get_object()
        invites = (
            OrganizationMembershipInvite.objects.filter(
                organization=org,
                accepted_at__isnull=True,
            )
            .select_related("invited_by")
            .order_by("-created_at")
        )

        return Response(OrganizationInviteSerializer(invites, many=True).data)

    @require_access_level(OrganizationMembershipRole.OWNER)
    @action(detail=True, methods=["post"])
    def cancel_invite(self, request, pk=None):
        """Cancel a pending organization invite"""
        org = self.get_object()
        invite_id = request.data.get("invite_id")

        if not invite_id:
            return Response(
                {"detail": "Invite ID is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            invite = OrganizationMembershipInvite.objects.get(
                id=invite_id,
                organization=org,
                accepted_at__isnull=True,
            )
        except OrganizationMembershipInvite.DoesNotExist:
            return Response(
                {"detail": "Invite not found or already accepted"},
                status=status.HTTP_404_NOT_FOUND,
            )

        invite.delete()

        posthog.capture(
            "organization_invite_cancelled",
            distinct_id=request.user.email,
            properties={
                "organization_uuid": str(org.uuid),
                "organization_name": org.name,
                "invited_email": invite.email,
                "cancelled_by_email": request.user.email,
            },
        )

        return Response({"detail": "Invite cancelled successfully"})

    @require_access_level(OrganizationMembershipRole.OWNER)
    @action(detail=True, methods=["post"])
    def resend_invite(self, request, pk=None):
        """Resend an organization invite email"""
        org = self.get_object()
        invite_id = request.data.get("invite_id")

        if not invite_id:
            return Response(
                {"detail": "Invite ID is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            invite = OrganizationMembershipInvite.objects.get(
                id=invite_id,
                organization=org,
                accepted_at__isnull=True,
            )
        except OrganizationMembershipInvite.DoesNotExist:
            return Response(
                {"detail": "Invite not found or already accepted"},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            subject, html_content = _generate_invite_email_content(
                org.name, invite.email
            )
            send_email(
                to_email=invite.email,
                subject=subject,
                html=html_content,
            )

            posthog.capture(
                "organization_invite_resent",
                distinct_id=request.user.email,
                properties={
                    "organization_uuid": str(org.uuid),
                    "organization_name": org.name,
                    "invited_email": invite.email,
                    "resent_by_email": request.user.email,
                },
            )

            return Response({"detail": "Invitation resent successfully"})
        except Exception as e:
            logger.error(f"Failed to resend invitation: {str(e)}")
            return Response(
                {"detail": f"Failed to resend invitation: {str(e)}"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
