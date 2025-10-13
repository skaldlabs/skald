from django.contrib import admin
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.urls import path, re_path
from django.views.generic import TemplateView
from rest_framework_extensions.routers import ExtendedDefaultRouter

from skald.api.email_verification_api import VerifyEmailViewSet
from skald.api.organization_api import OrganizationViewSet
from skald.api.project_api import ProjectViewSet

from .api.chat_api import ChatView
from .api.health_api import HealthView
from .api.memo_api import MemoViewSet
from .api.search_api import SearchView
from .api.user_api import UserViewSet


class Router(ExtendedDefaultRouter):
    """ExtendedDefaultRouter with optional trailing slash"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.trailing_slash = r"/?"


router = Router()

router.register(r"api/user", UserViewSet, basename="user")
router.register(
    r"api/email_verification", VerifyEmailViewSet, basename="email_verification"
)
router.register(r"api/v1/memo", MemoViewSet, basename="memo")
# router.register(r"api/project", ProjectViewSet, basename="project")

# the organizations router is for routes that are org-scoped
organizations_router = router.register(
    r"api/organization", OrganizationViewSet, basename="organization"
)

# nested routes under organizations - format: /api/organization/{organization_id}/...
organizations_router.register(
    r"projects",
    ProjectViewSet,
    basename="organization-project",
    parents_query_lookups=["organization"],
)

urlpatterns = [
    path("", TemplateView.as_view(template_name="index.html"), name="app-root"),
    path("chat", TemplateView.as_view(template_name="chat.html"), name="chat-ui"),
    path(
        "chat/", TemplateView.as_view(template_name="chat.html"), name="chat-ui-slash"
    ),
    path("admin/", admin.site.urls),
    path("api/health", HealthView.as_view(), name="health"),
    path("api/health/", HealthView.as_view(), name="health-slash"),
    path("api/v1/search", SearchView.as_view(), name="search"),
    path("api/v1/search/", SearchView.as_view(), name="search"),
    path("api/v1/chat", ChatView.as_view(), name="chat"),
    path("api/v1/chat/", ChatView.as_view(), name="chat"),
    *router.urls,
] + staticfiles_urlpatterns()

urlpatterns += [
    re_path(r".*", TemplateView.as_view(template_name="index.html"), name="app")
]
