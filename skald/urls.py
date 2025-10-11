from django.contrib import admin
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.urls import path, re_path
from django.views.generic import TemplateView
from rest_framework_extensions.routers import ExtendedDefaultRouter

from skald.api.email_verification_api import VerifyEmailViewSet
from skald.api.organization_api import OrganizationViewSet

from .api.chat_api import ChatView
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

# the organizations router is for routes that are org-scoped
organizations_router = router.register(
    r"api/organization", OrganizationViewSet, basename="organization"
)


urlpatterns = [
    path("", TemplateView.as_view(template_name="index.html"), name="app-root"),
    path("chat", TemplateView.as_view(template_name="chat.html"), name="chat-ui"),
    path(
        "chat/", TemplateView.as_view(template_name="chat.html"), name="chat-ui-slash"
    ),
    path("admin/", admin.site.urls),
    path("api/v1/search", SearchView.as_view(), name="search"),
    path("api/v1/search/", SearchView.as_view(), name="search"),
    path("api/v1/chat", ChatView.as_view(), name="chat"),
    path("api/v1/chat/", ChatView.as_view(), name="chat"),
    *router.urls,
] + staticfiles_urlpatterns()

urlpatterns += [
    re_path(r".*", TemplateView.as_view(template_name="index.html"), name="app")
]
