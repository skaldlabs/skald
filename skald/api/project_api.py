import logging

import posthog
from django.db import transaction
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from skald.api.permissions import (
    IsAuthenticatedOrAuthDisabled,
    OrganizationPermissionMixin,
    require_access_level,
)
from skald.decorators import require_usage_limit
from skald.models.memo import Memo, MemoChunk, MemoContent, MemoSummary, MemoTag
from skald.models.organization import Organization
from skald.models.project import Project, ProjectApiKey
from skald.models.user import OrganizationMembership, OrganizationMembershipRole
from skald.utils.api_key_utils import generate_api_key, hash_api_key

logger = logging.getLogger(__name__)


class ProjectSerializer(serializers.ModelSerializer):
    has_api_key = serializers.BooleanField(read_only=True)
    api_key_first_12_digits = serializers.SerializerMethodField()

    def get_api_key_first_12_digits(self, obj):
        api_key = ProjectApiKey.objects.filter(project=obj).first()
        return api_key.first_12_digits if api_key else None

    class Meta:
        model = Project
        fields = [
            "uuid",
            "name",
            "organization",
            "owner",
            "created_at",
            "updated_at",
            "has_api_key",
            "api_key_first_12_digits",
        ]
        read_only_fields = [
            "uuid",
            "owner",
            "created_at",
            "updated_at",
            "has_api_key",
            "api_key_first_12_digits",
        ]


class ProjectViewSet(OrganizationPermissionMixin, viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticatedOrAuthDisabled]
    organization_url_kwarg = "parent_lookup_organization"
    required_access_level = OrganizationMembershipRole.MEMBER

    def get_queryset(self):
        return Project.objects.filter(organization=self.get_organization())

    @require_access_level(OrganizationMembershipRole.MEMBER)
    @require_usage_limit("projects", increment=False)
    def create(self, request, parent_lookup_organization=None):
        """Create a new project"""
        name = request.data.get("name")
        org = self.get_organization()
        if not org:
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
            user=request.user, organization=org
        ).first()

        if not membership:
            return Response(
                {"detail": "You are not a member of this organization"},
                status=status.HTTP_403_FORBIDDEN,
            )

        project = Project.objects.create(
            name=name,
            organization=org,
            owner=request.user,
        )

        posthog.capture(
            "project_created",
            distinct_id=request.user.email,
            properties={
                "project_uuid": str(project.uuid),
                "project_name": project.name,
                "organization_uuid": str(org.uuid),
                "organization_name": org.name,
                "user_email": request.user.email,
            },
        )

        return Response(ProjectSerializer(project).data, status=status.HTTP_201_CREATED)

    @require_access_level(OrganizationMembershipRole.OWNER)
    def update(self, request, pk=None, parent_lookup_organization=None):
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
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()

        posthog.capture(
            "project_updated",
            distinct_id=request.user.email,
            properties={
                "project_uuid": str(project.uuid),
                "project_name": project.name,
                "organization_uuid": str(project.organization.uuid),
                "user_email": request.user.email,
            },
        )

        return Response(serializer.data)

    @require_access_level(OrganizationMembershipRole.OWNER)
    def destroy(self, request, pk=None, parent_lookup_organization=None):
        """Delete a project and all its associated data atomically"""
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

        # Delete all related data atomically
        with transaction.atomic():
            # Get all memos for this project
            memos = Memo.objects.filter(project=project)

            # Delete all memo-related data
            # Note: Due to CASCADE foreign keys, these will be deleted automatically,
            # but we explicitly delete them here for clarity and to ensure atomicity
            MemoChunk.objects.filter(project=project).delete()
            MemoTag.objects.filter(project=project).delete()
            MemoSummary.objects.filter(project=project).delete()
            MemoContent.objects.filter(memo__in=memos).delete()

            # Delete all memos
            memos.delete()

            # Delete project API keys
            ProjectApiKey.objects.filter(project=project).delete()

            # Finally, delete the project itself
            project.delete()

        posthog.capture(
            "project_deleted",
            distinct_id=request.user.email,
            properties={
                "project_uuid": str(project_uuid),
                "project_name": project_name,
                "organization_uuid": str(org_uuid),
                "user_email": request.user.email,
            },
        )

        logger.info(
            f"Project {project_uuid} ({project_name}) and all related data deleted by user {request.user.email}"
        )

        return Response(status=status.HTTP_204_NO_CONTENT)

    @require_access_level(OrganizationMembershipRole.MEMBER)
    @action(detail=True, methods=["POST"])
    def generate_api_key(self, request, *args, **kwargs):
        """Generate a new API key for a project"""
        project = self.get_object()

        api_key = generate_api_key(prefix="sk_proj")
        api_key_hash = hash_api_key(api_key)
        if ProjectApiKey.objects.filter(project=project).exists():
            ProjectApiKey.objects.filter(project=project).delete()

        ProjectApiKey.objects.create(
            project=project,
            api_key_hash=api_key_hash,
            first_12_digits=api_key[:12],
        )

        return Response({"api_key": api_key}, status=status.HTTP_200_OK)
