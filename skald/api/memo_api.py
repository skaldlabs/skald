from typing import Literal, Tuple

from django.db import transaction
from rest_framework import serializers, status, viewsets
from rest_framework.authentication import BasicAuthentication, TokenAuthentication
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from skald.api.permissions import (
    IsAuthenticatedOrAuthDisabled,
    ProjectAPIKeyAuthentication,
    get_project_for_request,
    verify_user_can_access_project_resource,
)
from skald.decorators import require_usage_limit
from skald.flows.process_memo.process_memo import (
    create_new_memo,
    send_memo_for_async_processing,
)
from skald.models.memo import (
    Memo,
    MemoChunk,
    MemoContent,
    MemoSummary,
    MemoTag,
)
from skald.models.project import Project


def get_memo_by_identifier(
    request, pk: str, user
) -> Tuple[Memo | None, Response | None, Project | None]:
    """
    Get a memo by either UUID or client_reference_id based on id_type query parameter.

    Args:
        request: The request object
        pk: The identifier (either UUID or client_reference_id)
        user: The authenticated user

    Returns:
        Tuple of (memo, error_response, project)
        - If successful: (memo, None, project)
        - If error: (None, error_response, None)
    """
    id_type: Literal["memo_uuid", "reference_id"] = request.query_params.get(
        "id_type", "memo_uuid"
    )

    # Validate id_type parameter
    if id_type not in ["memo_uuid", "reference_id"]:
        return (
            None,
            Response(
                {"error": "id_type must be either 'memo_uuid' or 'reference_id'"},
                status=status.HTTP_400_BAD_REQUEST,
            ),
            None,
        )

    # Get project for filtering
    project, error_response = get_project_for_request(user, request)
    if project is None or error_response:
        if error_response:
            return None, error_response, None
        else:
            return (
                None,
                Response(
                    {"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND
                ),
                None,
            )

    try:
        if id_type == "memo_uuid":
            memo = Memo.objects.get(uuid=pk, project=project)
        else:  # reference_id
            memo = Memo.objects.get(client_reference_id=pk, project=project)
    except Memo.DoesNotExist:
        return (
            None,
            Response({"error": "Memo not found"}, status=status.HTTP_404_NOT_FOUND),
            None,
        )

    # Verify user can access the memo's project
    error_response = verify_user_can_access_project_resource(user, memo.project)
    if error_response:
        return None, error_response, None

    return memo, None, project


class UpdateMemoRequestSerializer(serializers.Serializer):
    title = serializers.CharField(required=False, allow_null=True, max_length=255)
    metadata = serializers.JSONField(required=False, allow_null=True)
    client_reference_id = serializers.CharField(
        required=False, allow_null=True, max_length=255
    )
    source = serializers.CharField(required=False, allow_null=True, max_length=255)
    expiration_date = serializers.DateTimeField(required=False, allow_null=True)
    content = serializers.CharField(required=False, allow_null=True)


class CreateMemoRequestSerializer(serializers.Serializer):
    content = serializers.CharField(required=True)
    title = serializers.CharField(required=True, max_length=255)
    metadata = serializers.JSONField(required=False, allow_null=True)
    reference_id = serializers.CharField(
        required=False, allow_null=True, max_length=255
    )
    tags = serializers.ListField(
        child=serializers.CharField(), required=False, allow_null=True
    )
    source = serializers.CharField(required=False, allow_null=True, max_length=255)
    expiration_date = serializers.DateTimeField(required=False, allow_null=True)


class MemoSerializer(serializers.ModelSerializer):

    class Meta:
        model = Memo

        # eventually allow users to pass in their own last_updated_at field
        fields = [
            "uuid",
            "created_at",
            "updated_at",
            "title",
            "summary",
            "content_length",
            "metadata",
            "client_reference_id",
        ]
        read_only_fields = ["uuid", "created_at", "updated_at", "content_length"]


class MemoTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = MemoTag
        fields = ["uuid", "tag"]


class MemoChunkSerializer(serializers.ModelSerializer):
    class Meta:
        model = MemoChunk
        fields = ["uuid", "chunk_content", "chunk_index"]


class DetailedMemoSerializer(serializers.ModelSerializer):
    content = serializers.SerializerMethodField()
    summary = serializers.SerializerMethodField()
    tags = MemoTagSerializer(many=True, read_only=True)
    chunks = MemoChunkSerializer(many=True, read_only=True)

    class Meta:
        model = Memo
        fields = [
            "uuid",
            "created_at",
            "updated_at",
            "title",
            "content",
            "summary",
            "content_length",
            "metadata",
            "client_reference_id",
            "source",
            "type",
            "expiration_date",
            "archived",
            "pending",
            "tags",
            "chunks",
        ]
        read_only_fields = ["uuid", "created_at", "updated_at", "content_length"]

    def get_content(self, obj):
        try:
            return obj.content
        except MemoContent.DoesNotExist:
            return None

    def get_summary(self, obj):
        try:
            return obj.summary
        except MemoSummary.DoesNotExist:
            return None


class MemoPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class MemoViewSet(viewsets.ModelViewSet):
    serializer_class = MemoSerializer
    permission_classes = [IsAuthenticatedOrAuthDisabled]
    authentication_classes = [
        TokenAuthentication,
        BasicAuthentication,
        ProjectAPIKeyAuthentication,
    ]
    pagination_class = MemoPagination

    def get_project(self):
        """Get project for current request (used by usage decorator)"""
        user = getattr(self.request, "user", None)
        project, _ = get_project_for_request(user, self.request)
        return project

    def get_queryset(self):
        user = getattr(self.request, "user", None)
        project, error_response = get_project_for_request(user, self.request)
        if project is None or error_response:
            if error_response:
                from rest_framework.exceptions import APIException

                raise APIException(
                    detail=error_response.data, code=error_response.status_code
                )
            else:
                from rest_framework.exceptions import NotFound

                raise NotFound("Project not found")
        return Memo.objects.filter(project=project).order_by("-created_at")

    def retrieve(self, request, pk=None):
        user = getattr(request, "user", None)
        memo, error_response, project = get_memo_by_identifier(request, pk, user)
        if error_response:
            return error_response

        # Reload with prefetch for detailed serializer
        memo = (
            Memo.objects.select_related()
            .prefetch_related("memotag_set", "memochunk_set")
            .get(pk=memo.pk)
        )

        serializer = DetailedMemoSerializer(memo)
        return Response(serializer.data)

    @require_usage_limit("memo_operations", increment=True)
    def create(self, request):
        user = getattr(request, "user", None)
        project, error_response = get_project_for_request(user, request)
        if project is None or error_response:
            if error_response:
                return error_response
            else:
                return Response(
                    {"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND
                )
        serializer = CreateMemoRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data
        create_new_memo(validated_data, project)
        return Response({"ok": True}, status=status.HTTP_201_CREATED)

    @require_usage_limit("memo_operations", increment=True)
    def partial_update(self, request, *args, **kwargs):
        user = getattr(request, "user", None)
        pk = kwargs.get("pk")
        memo, error_response, project = get_memo_by_identifier(request, pk, user)
        if error_response:
            return error_response

        serializer = UpdateMemoRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data
        content_updated = False

        with transaction.atomic():
            for field, value in validated_data.items():
                if field == "content":
                    content_updated = True
                    MemoContent.objects.filter(memo=memo).update(content=value)
                    MemoSummary.objects.filter(memo=memo).delete()
                    MemoTag.objects.filter(memo=memo).delete()
                    MemoChunk.objects.filter(memo=memo).delete()
                else:
                    setattr(memo, field, value)

            memo.save()

        if content_updated:
            send_memo_for_async_processing(memo)

        return Response({"ok": True}, status=status.HTTP_200_OK)

    @require_usage_limit("memo_operations", increment=False)
    def destroy(self, request, *args, **kwargs):
        user = getattr(request, "user", None)
        pk = kwargs.get("pk")
        memo, error_response, project = get_memo_by_identifier(request, pk, user)
        if error_response:
            return error_response

        memo.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)
