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
)
from skald.flows.process_memo.process_memo import create_new_memo
from skald.models.memo import (
    Memo,
    MemoChunk,
    MemoContent,
    MemoSummary,
    MemoTag,
)


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
        project, error_response = get_project_for_request(user, request)

        if project is None or error_response:
            if error_response:
                return error_response
            else:
                return Response(
                    {"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND
                )

        try:
            memo = (
                Memo.objects.select_related()
                .prefetch_related("memotag_set", "memochunk_set")
                .get(uuid=pk, project=project)
            )
        except Memo.DoesNotExist:
            return Response(
                {"error": "Memo not found"}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = DetailedMemoSerializer(memo)
        return Response(serializer.data)

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
        serializer.is_valid(raise_exception=True)
        validated_data = serializer.validated_data
        created_memo = create_new_memo(validated_data, project)
        return Response({"ok": True}, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        user = getattr(request, "user", None)
        project, error_response = get_project_for_request(user, request)

        if project is None or error_response:
            if error_response:
                return error_response
            else:
                return Response(
                    {"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND
                )
        memo = self.get_object()
        if memo.project.uuid != project.uuid:
            return Response(
                {"error": "Memo does not belong to the project"},
                status=status.HTTP_403_FORBIDDEN,
            )
        with transaction.atomic():
            MemoContent.objects.filter(memo=memo).delete()
            MemoSummary.objects.filter(memo=memo).delete()
            MemoTag.objects.filter(memo=memo).delete()
            MemoChunk.objects.filter(memo=memo).delete()
            memo.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["post"])
    def push(self, request):
        return Response({"ok": True}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"])
    def push_memo_content(self, request):
        return Response({"ok": True}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"])
    def push_memo_tag(self, request):
        return Response({"ok": True}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"])
    def push_memo_relationship(self, request):
        return Response({"ok": True}, status=status.HTTP_201_CREATED)
