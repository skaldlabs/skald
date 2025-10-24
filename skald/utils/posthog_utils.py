import posthog
from django.conf import settings


def posthog_capture(event_name: str, distinct_id: str, properties: dict):
    # we don't track self-hosted instances except for organization creation
    if settings.IS_SELF_HOSTED_DEPLOY and event_name not in ["organization_created"]:
        return

    posthog.capture(event_name, distinct_id, properties)
