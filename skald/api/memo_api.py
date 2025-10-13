from rest_framework import serializers, status, viewsets
from rest_framework.authentication import BasicAuthentication, TokenAuthentication
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from skald.api.permissions import ProjectAPIKeyAuthentication, is_user_org_member
from skald.models.memo import Memo
from skald.models.project import Project


class CreateMemoRequestSerializer(serializers.Serializer):
    content = serializers.CharField(required=True)
    title = serializers.CharField(required=True, max_length=255)
    project_id = serializers.UUIDField(required=True)
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
            "id",
            "created_at",
            "updated_at",
            "title",
            "summary",
            "content_length",
            "metadata",
            "client_reference_id",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "content_length"]


class MemoViewSet(viewsets.ModelViewSet):
    serializer_class = MemoSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [
        TokenAuthentication,
        BasicAuthentication,
        ProjectAPIKeyAuthentication,
    ]

    def get_queryset(self):
        return Memo.objects.filter(project=self.get_project())

    def create(self, request):

        user = request.user

        if user.id == "PROJECT_API_USER":
            if user.project is None:
                return Response(
                    {"error": "Project not found"}, status=status.HTTP_400_BAD_REQUEST
                )
            project = user.project
        else:
            project_id = request.data.get("project_id")
            project = Project.objects.get(uuid=project_id)
            if not is_user_org_member(user, project.organization):
                return Response(
                    {"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN
                )

        serializer = CreateMemoRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Data is validated but not used yet
        validated_data = serializer.validated_data

        from skald.flows.process_memo.process_memo import create_new_memo

        created_memo = create_new_memo(validated_data, project)

        return Response({"ok": True}, status=status.HTTP_201_CREATED)

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
