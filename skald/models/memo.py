import uuid

from django.contrib.postgres.indexes import GinIndex
from django.db import models
from pgvector.django import VectorField

from skald.models.project import Project


class Memo(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    title = models.CharField(max_length=255)
    content_length = models.IntegerField()
    metadata = models.JSONField(default=dict)
    expiration_date = models.DateTimeField(blank=True, null=True)
    archived = models.BooleanField(default=False)
    content_hash = models.CharField(max_length=255)

    pending = models.BooleanField(default=True)

    # can be code, document, etc
    type = models.CharField(max_length=255, blank=True, null=True)

    # client provided source. could be a url, a file name, a third-party app name, a repository name, etc
    source = models.CharField(max_length=255, blank=True, null=True)

    # clients can give us their own reference id for the memo, which matches with a record in their own system
    client_reference_id = models.CharField(max_length=255, blank=True, null=True)

    # project scope
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="memos",
    )

    @property
    def content(self) -> str:
        try:
            return MemoContent.objects.get(memo=self).content
        except MemoContent.DoesNotExist:
            return ""

    @property
    def summary(self) -> str:
        try:
            return MemoSummary.objects.get(memo=self).summary
        except MemoSummary.DoesNotExist:
            return ""

    class Meta:
        indexes = [
            models.Index(fields=["project", "client_reference_id"]),
            models.Index(fields=["project", "source"]),
            GinIndex(fields=["metadata"]),
        ]


class MemoSummary(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    memo = models.ForeignKey(Memo, on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)

    summary = models.TextField()
    embedding = VectorField(dimensions=2048)


class MemoContent(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    memo = models.ForeignKey(Memo, on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)

    content = models.TextField()


class MemoTag(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    memo = models.ForeignKey(Memo, on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)

    tag = models.TextField()


class MemoChunk(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    memo = models.ForeignKey(Memo, on_delete=models.CASCADE)

    chunk_content = models.TextField()
    chunk_index = models.IntegerField()
    embedding = VectorField(dimensions=2048)
