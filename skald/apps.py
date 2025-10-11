import posthog
from django.apps import AppConfig
from django.conf import settings


class SkaldConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "skald"

    def ready(self):
        posthog.api_key = settings.POSTHOG_API_KEY
        posthog.host = settings.POSTHOG_HOST
        posthog.enable_exception_autocapture = True
