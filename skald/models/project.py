import uuid

from django.conf import settings
from django.db import models

from skald.models.organization import Organization


class Project(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    name = models.CharField(max_length=255)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="projects",
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owned_projects",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.organization.name})"

    @property
    def has_api_key(self):
        return ProjectApiKey.objects.filter(project=self).exists()


class ProjectApiKey(models.Model):
    api_key_hash = models.CharField(max_length=255, unique=True, primary_key=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    first_12_digits = models.CharField(max_length=12)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.project.name} - {self.api_key_hash}"
