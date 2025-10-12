import logging

import posthog
from rest_framework import serializers, status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from skald.api.permissions import OrganizationPermissionMixin, require_access_level
from skald.models.organization import Organization
from skald.models.project import Project
from skald.models.user import OrganizationMembership, OrganizationMembershipRole

logger = logging.getLogger(__name__)


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = [
            "uuid",
            "name",
            "organization",
            "owner",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "uuid",
            "owner",
            "created_at",
            "updated_at",
        ]


class ProjectViewSet(OrganizationPermissionMixin, viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]
    organization_url_kwarg = "organization_id"
    required_access_level = OrganizationMembershipRole.MEMBER

    def get_queryset(self):
        """Filter projects by organizations the user is a member of"""
        user_orgs = OrganizationMembership.objects.filter(
            user=self.request.user
        ).values_list("organization_id", flat=True)

        return Project.objects.filter(organization_id__in=user_orgs)

    @require_access_level(OrganizationMembershipRole.MEMBER)
    def create(self, request):
        """Create a new project"""
        organization_uuid = request.data.get("organization")
        name = request.data.get("name")

        if not organization_uuid:
            return Response(
                {"detail": "Organization is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not name:
            return Response(
                {"detail": "Name is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if user is a member of the organization
        membership = OrganizationMembership.objects.filter(
            user=request.user, organization__uuid=organization_uuid
        ).first()

        if not membership:
            return Response(
                {"detail": "You are not a member of this organization"},
                status=status.HTTP_403_FORBIDDEN,
            )

        org = Organization.objects.get(uuid=organization_uuid)
        project = Project.objects.create(
            name=name,
            organization=org,
            owner=request.user,
        )

        posthog.capture(
            "project_created",
            distinct_id=request.user.id,
            properties={
                "project_uuid": project.uuid,
                "project_name": project.name,
                "organization_uuid": org.uuid,
                "organization_name": org.name,
                "user_email": request.user.email,
            },
        )

        return Response(ProjectSerializer(project).data, status=status.HTTP_201_CREATED)

    @require_access_level(OrganizationMembershipRole.MEMBER)
    def update(self, request, pk=None):
        """Update a project"""
        project = self.get_object()

        # Check if user is a member of the project's organization
        membership = OrganizationMembership.objects.filter(
            user=request.user, organization=project.organization
        ).first()

        if not membership:
            return Response(
                {"detail": "You do not have permission to update this project"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ProjectSerializer(project, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        posthog.capture(
            "project_updated",
            distinct_id=request.user.id,
            properties={
                "project_uuid": project.uuid,
                "project_name": project.name,
                "organization_uuid": project.organization.uuid,
                "user_email": request.user.email,
            },
        )

        return Response(serializer.data)

    @require_access_level(OrganizationMembershipRole.OWNER)
    def destroy(self, request, pk=None):
        """Delete a project"""
        project = self.get_object()

        # Check if user is a member of the project's organization
        membership = OrganizationMembership.objects.filter(
            user=request.user, organization=project.organization
        ).first()

        if not membership:
            return Response(
                {"detail": "You do not have permission to delete this project"},
                status=status.HTTP_403_FORBIDDEN,
            )

        project_uuid = project.uuid
        project_name = project.name
        org_uuid = project.organization.uuid

        # TODO: delete all memos in the project
        project.delete()

        posthog.capture(
            "project_deleted",
            distinct_id=request.user.id,
            properties={
                "project_uuid": project_uuid,
                "project_name": project_name,
                "organization_uuid": org_uuid,
                "user_email": request.user.email,
            },
        )

        return Response(status=status.HTTP_204_NO_CONTENT)
