from skald.models.memo import Memo, MemoContent, MemoTag, MemoRelationship, MemoChunk
from rest_framework import serializers, status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

class CreateMemoRequestSerializer(serializers.Serializer):
    content = serializers.CharField(required=True)
    title = serializers.CharField(required=True, max_length=255)
    metadata = serializers.JSONField(required=False, allow_null=True)
    reference_id = serializers.CharField(required=False, allow_null=True, max_length=255)
    tags = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_null=True
    )
    source = serializers.CharField(required=False, allow_null=True, max_length=255)
    expiration_date = serializers.DateTimeField(required=False, allow_null=True)
    
    
class MemoSerializer(serializers.ModelSerializer):

    class Meta:
        model = Memo
        
        # eventually allow users to pass in their own last_updated_at field
        fields = ["id", "created_at", "updated_at", "title", "summary", "content_length", "metadata", "client_reference_id"]
        read_only_fields = ["id", "created_at", "updated_at", "content_length"]


@method_decorator(csrf_exempt, name='dispatch')
class MemoViewSet(viewsets.ModelViewSet):
    serializer_class = MemoSerializer
    permission_classes = [AllowAny]  # Default permission for all actions
    
    def get_queryset(self):
        return Memo.objects.all()

    @csrf_exempt
    def create(self, request):
        serializer = CreateMemoRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Data is validated but not used yet
        validated_data = serializer.validated_data
        from skald.flows.process_memo.process_memo import create_new_memo

        created_memo = create_new_memo(validated_data)
        
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