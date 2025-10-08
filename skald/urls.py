from django.contrib import admin
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.urls import path, re_path
from django.views.generic import TemplateView
from rest_framework_extensions.routers import ExtendedDefaultRouter

from .api.memo_api import MemoViewSet
from .api.user_api import UserViewSet


class Router(ExtendedDefaultRouter):
    """ExtendedDefaultRouter with optional trailing slash"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.trailing_slash = r"/?"


router = Router()
router.register(r"api/user", UserViewSet, basename="user")
router.register(r"api/memo", MemoViewSet, basename="memo")

urlpatterns = [
    path("", TemplateView.as_view(template_name="index.html"), name="app-root"),
    path("admin/", admin.site.urls),
    *router.urls,
] + staticfiles_urlpatterns()

urlpatterns += [
    re_path(r".*", TemplateView.as_view(template_name="index.html"), name="app")
]
