import uuid

from django.db import models

from skald.models.organization import Organization
from skald.models.project import Project


# temporary, will be re-done on the express side
class ChatMessageGroup(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    user_query = models.TextField()
    model_response = models.TextField()
    context_str = models.TextField()
