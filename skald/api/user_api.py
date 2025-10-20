import posthog
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import serializers, status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from skald.utils.error_utils import format_validation_error

User = get_user_model()


class InternalUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["email", "password"]

        extra_kwargs = {"password": {"write_only": True}}

    def validate_email(self, value):
        return value.lower().strip()

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class UserSerializer(serializers.ModelSerializer):
    organization_name = serializers.SerializerMethodField()
    access_levels = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "email",
            "password",
            "default_organization",
            "current_project",
            "email_verified",
            "organization_name",
            "is_superuser",
            "name",
            "access_levels",
        ]
        read_only_fields = [
            "email",
            "default_organization",
            "current_project",
            "email_verified",
        ]

        extra_kwargs = {"password": {"write_only": True}}

    def get_organization_name(self, obj):
        if obj.default_organization:
            return obj.default_organization.name
        return None

    def get_access_levels(self, obj):
        # get the access levels of the user in every organization they're a member of
        # then also get the access levels of the user in every team they're a member of
        organization_access_levels = {}
        team_access_levels = {}
        for organization in obj.organizationmembership_set.all():
            organization_access_levels[str(organization.organization.uuid)] = (
                organization.access_level
            )
        return {
            "organization_access_levels": organization_access_levels,
        }

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [AllowAny]  # Default permission for all actions

    permission_classes_by_action = {
        "logout": [IsAuthenticated],
        "details": [IsAuthenticated],
        "change_password": [IsAuthenticated],
    }

    def get_permissions(self):
        try:
            return [
                permission()
                for permission in self.permission_classes_by_action[self.action]
            ]
        except KeyError:
            return [permission() for permission in self.permission_classes]

    @method_decorator(csrf_exempt)
    def create(self, request):
        serializer = InternalUserSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)

            posthog.capture(
                "user_signed_up",
                distinct_id=user.email,
                properties={
                    "user_email": user.email,
                    "email_verified": user.email_verified,
                },
            )

            return Response(
                {"token": token.key, "user": UserSerializer(user).data},
                status=status.HTTP_201_CREATED,
            )
        else:
            return format_validation_error(serializer.errors)

    @action(detail=False, methods=["post"])
    def change_password(self, request):
        user = request.user
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")

        if not user.check_password(old_password):
            return Response(
                {"old_password": ["Wrong password."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save()
        return Response(status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"])
    @method_decorator(csrf_exempt)
    def login(self, request):
        email = request.data.get("email", "").lower().strip()
        password = request.data.get("password")
        user = authenticate(request, username=email, password=password)
        if user:
            login(request, user)
            token, _ = Token.objects.get_or_create(user=user)

            posthog.capture(
                "user_logged_in",
                distinct_id=user.email,
                properties={
                    "user_email": user.email,
                    "email_verified": user.email_verified,
                },
            )

            return Response(
                {"token": token.key, "user": UserSerializer(user).data},
                status=status.HTTP_200_OK,
            )
        else:
            return Response(
                {"error": "Invalid Credentials"}, status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=["post"])
    def logout(self, request):
        request.user.auth_token.delete()
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(methods=["GET"], detail=False)
    def details(self, request, **kwargs):
        user = request.user
        return Response(
            status=200,
            data=UserSerializer(user).data,
        )

    @action(methods=["POST"], detail=False)
    def set_current_project(self, request):
        from skald.models.project import Project

        user = request.user
        project_uuid = request.data.get("project_uuid")

        if not project_uuid:
            return Response(
                {"error": "project_uuid is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            project = Project.objects.get(uuid=project_uuid)
        except Project.DoesNotExist:
            return Response(
                {"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Validate that the project belongs to the user's current organization
        if project.organization.uuid != user.default_organization.uuid:
            return Response(
                {"error": "Project does not belong to your current organization"},
                status=status.HTTP_403_FORBIDDEN,
            )

        user.current_project = project
        user.save()

        return Response(
            status=status.HTTP_200_OK,
            data=UserSerializer(user).data,
        )
