from datetime import datetime, timezone
from unittest.mock import patch

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from skald.models.memo import Memo, MemoChunk, MemoContent, MemoSummary, MemoTag


@pytest.mark.django_db
class TestMemoAPICreate:
    """Test suite for memo API create endpoint."""

    @patch("skald.flows.process_memo.process_memo.send_memo_for_async_processing")
    def test_create_memo_with_minimal_fields(
        self, mock_send_memo, user_token, project
    ) -> None:
        """Test creating a memo with only required fields."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("memo-list")

        data = {
            "title": "Test Memo",
            "content": "This is test content",
            "project_id": str(project.uuid),
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["ok"] is True

        memo = Memo.objects.filter(project=project, title="Test Memo").first()
        assert memo is not None
        assert memo.title == "Test Memo"
        assert memo.content_length == len("This is test content")
        assert memo.pending is False

        memo_content = MemoContent.objects.filter(memo=memo).first()
        assert memo_content is not None
        assert memo_content.content == "This is test content"

        mock_send_memo.assert_called_once()

    @patch("skald.flows.process_memo.process_memo.send_memo_for_async_processing")
    def test_create_memo_with_all_fields(
        self, mock_send_memo, user_token, project
    ) -> None:
        """Test creating a memo with all optional fields."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("memo-list")

        expiration_date = datetime(2025, 12, 31, 23, 59, 59, tzinfo=timezone.utc)
        data = {
            "title": "Complete Memo",
            "content": "Full content with all fields",
            "project_id": str(project.uuid),
            "metadata": {"key": "value", "number": 42},
            "reference_id": "REF-123",
            "tags": ["tag1", "tag2"],
            "source": "test-source",
            "expiration_date": expiration_date.isoformat(),
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["ok"] is True

        memo = Memo.objects.filter(project=project, title="Complete Memo").first()
        assert memo is not None
        assert memo.title == "Complete Memo"
        assert memo.metadata == {"key": "value", "number": 42}
        assert memo.client_reference_id == "REF-123"
        assert memo.source == "test-source"
        assert memo.expiration_date == expiration_date

        memo_content = MemoContent.objects.filter(memo=memo).first()
        assert memo_content is not None
        assert memo_content.content == "Full content with all fields"

        mock_send_memo.assert_called_once()

    @patch("skald.flows.process_memo.process_memo.send_memo_for_async_processing")
    def test_create_memo_with_empty_metadata(
        self, mock_send_memo, user_token, project
    ) -> None:
        """Test creating a memo with empty metadata dict."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("memo-list")

        data = {
            "title": "Empty Metadata Memo",
            "content": "Content with empty metadata",
            "project_id": str(project.uuid),
            "metadata": {},
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        memo = Memo.objects.filter(project=project, title="Empty Metadata Memo").first()
        assert memo is not None
        assert memo.metadata == {}

    @patch("skald.flows.process_memo.process_memo.send_memo_for_async_processing")
    def test_create_memo_with_long_content(
        self, mock_send_memo, user_token, project
    ) -> None:
        """Test creating a memo with long content."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("memo-list")

        long_content = "A" * 10000
        data = {
            "title": "Long Content Memo",
            "content": long_content,
            "project_id": str(project.uuid),
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        memo = Memo.objects.filter(project=project, title="Long Content Memo").first()
        assert memo is not None
        assert memo.content_length == 10000
        assert memo.content == long_content

    def test_create_memo_missing_required_fields(self, user_token, project) -> None:
        """Test that creating a memo without required fields fails."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("memo-list")

        data = {
            "project_id": str(project.uuid),
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestMemoAPIDestroy:
    """Test suite for memo API destroy endpoint."""

    @patch("skald.flows.process_memo.process_memo.send_memo_for_async_processing")
    def test_destroy_memo_deletes_memo_and_related_data(
        self, mock_send_memo, user_token, project
    ) -> None:
        """Test that destroying a memo deletes the memo and all related data."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")

        create_url = reverse("memo-list")
        data = {
            "title": "Memo to Delete",
            "content": "This will be deleted",
            "project_id": str(project.uuid),
        }
        client.post(create_url, data, format="json")

        memo = Memo.objects.filter(project=project, title="Memo to Delete").first()
        assert memo is not None
        memo_uuid = memo.uuid

        memo_content = MemoContent.objects.create(
            memo=memo, content="Test content", project=project
        )
        memo_summary = MemoSummary.objects.create(
            memo=memo,
            summary="Test summary",
            embedding=[0.1] * 2048,
            project=project,
        )
        memo_tag = MemoTag.objects.create(memo=memo, tag="test-tag", project=project)
        memo_chunk = MemoChunk.objects.create(
            memo=memo,
            chunk_content="Test chunk",
            chunk_index=0,
            embedding=[0.1] * 2048,
            project=project,
        )

        assert MemoContent.objects.filter(memo=memo).exists()
        assert MemoSummary.objects.filter(memo=memo).exists()
        assert MemoTag.objects.filter(memo=memo).exists()
        assert MemoChunk.objects.filter(memo=memo).exists()

        destroy_url = reverse("memo-detail", kwargs={"pk": memo_uuid})
        response = client.delete(destroy_url)

        assert response.status_code == status.HTTP_204_NO_CONTENT

        assert not Memo.objects.filter(uuid=memo_uuid).exists()
        assert not MemoContent.objects.filter(memo_id=memo_uuid).exists()
        assert not MemoSummary.objects.filter(memo_id=memo_uuid).exists()
        assert not MemoTag.objects.filter(memo_id=memo_uuid).exists()
        assert not MemoChunk.objects.filter(memo_id=memo_uuid).exists()

    @patch("skald.flows.process_memo.process_memo.send_memo_for_async_processing")
    def test_destroy_memo_only_deletes_specified_memo(
        self, mock_send_memo, user_token, project
    ) -> None:
        """Test that destroying a memo only deletes that specific memo."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")

        create_url = reverse("memo-list")
        data1 = {
            "title": "Memo 1",
            "content": "Content 1",
            "project_id": str(project.uuid),
        }
        data2 = {
            "title": "Memo 2",
            "content": "Content 2",
            "project_id": str(project.uuid),
        }
        client.post(create_url, data1, format="json")
        client.post(create_url, data2, format="json")

        memo1 = Memo.objects.filter(project=project, title="Memo 1").first()
        memo2 = Memo.objects.filter(project=project, title="Memo 2").first()
        assert memo1 is not None
        assert memo2 is not None

        destroy_url = reverse("memo-detail", kwargs={"pk": memo1.uuid})
        response = client.delete(destroy_url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Memo.objects.filter(uuid=memo1.uuid).exists()
        assert Memo.objects.filter(uuid=memo2.uuid).exists()

    def test_destroy_nonexistent_memo(self, user_token, project) -> None:
        """Test that attempting to destroy a nonexistent memo returns 404."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")

        fake_uuid = "00000000-0000-0000-0000-000000000000"
        destroy_url = reverse("memo-detail", kwargs={"pk": fake_uuid})
        response = client.delete(destroy_url)

        assert response.status_code == status.HTTP_404_NOT_FOUND

    @patch("skald.flows.process_memo.process_memo.send_memo_for_async_processing")
    def test_destroy_memo_from_different_project_fails(
        self, mock_send_memo, user_token, other_user_token, project, other_project
    ) -> None:
        """Test that a user cannot destroy a memo from a different project."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")

        create_url = reverse("memo-list")
        data = {
            "title": "Memo in Project 1",
            "content": "Content",
            "project_id": str(project.uuid),
        }
        client.post(create_url, data, format="json")

        memo = Memo.objects.filter(project=project, title="Memo in Project 1").first()
        assert memo is not None

        other_client = APIClient()
        other_client.credentials(HTTP_AUTHORIZATION=f"Token {other_user_token}")

        destroy_url = reverse("memo-detail", kwargs={"pk": memo.uuid})
        response = other_client.delete(destroy_url)

        assert response.status_code in [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND,
        ]
        assert Memo.objects.filter(uuid=memo.uuid).exists()


@pytest.mark.django_db
class TestMemoAPIUpdate:
    """Test suite for memo API update endpoint."""

    @patch("skald.flows.process_memo.process_memo.send_memo_for_async_processing")
    def test_update_memo_without_content_only_updates_memo(
        self, mock_send_memo, user_token, project
    ) -> None:
        """Test that updating memo without content field only updates the Memo object."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")

        create_url = reverse("memo-list")
        data = {
            "title": "Original Title",
            "content": "Original content",
            "project_id": str(project.uuid),
            "metadata": {"original": "data"},
        }
        client.post(create_url, data, format="json")

        memo = Memo.objects.filter(project=project, title="Original Title").first()
        assert memo is not None
        memo_uuid = memo.uuid

        MemoContent.objects.filter(memo=memo).update(content="Original content")
        MemoSummary.objects.create(
            memo=memo,
            summary="Original summary",
            embedding=[0.1] * 2048,
            project=project,
        )
        MemoTag.objects.create(memo=memo, tag="original-tag", project=project)
        MemoChunk.objects.create(
            memo=memo,
            chunk_content="Original chunk",
            chunk_index=0,
            embedding=[0.1] * 2048,
            project=project,
        )

        mock_send_memo.reset_mock()

        update_url = reverse("memo-detail", kwargs={"pk": memo_uuid})
        update_data = {
            "title": "Updated Title",
            "metadata": {"updated": "metadata"},
        }
        response = client.patch(update_url, update_data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["ok"] is True

        memo.refresh_from_db()
        assert memo.title == "Updated Title"
        assert memo.metadata == {"updated": "metadata"}

        assert MemoContent.objects.filter(memo=memo).exists()
        assert (
            MemoContent.objects.filter(memo=memo).first().content == "Original content"
        )
        assert MemoSummary.objects.filter(memo=memo).exists()
        assert MemoTag.objects.filter(memo=memo).exists()
        assert MemoChunk.objects.filter(memo=memo).exists()

        # send_memo_for_async_processing is not called when content is not updated
        assert mock_send_memo.call_count == 0

    @patch("skald.api.memo_api.send_memo_for_async_processing")
    def test_update_memo_with_content_deletes_related_data(
        self, mock_send_memo, user_token, project
    ) -> None:
        """Test that updating memo with content field deletes summary, tags, and chunks."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")

        create_url = reverse("memo-list")
        data = {
            "title": "Original Title",
            "content": "Original content",
            "project_id": str(project.uuid),
        }
        client.post(create_url, data, format="json")

        memo = Memo.objects.filter(project=project, title="Original Title").first()
        assert memo is not None
        memo_uuid = memo.uuid

        MemoContent.objects.filter(memo=memo).update(content="Original content")
        MemoSummary.objects.create(
            memo=memo,
            summary="Original summary",
            embedding=[0.1] * 2048,
            project=project,
        )
        MemoTag.objects.create(memo=memo, tag="original-tag", project=project)
        MemoChunk.objects.create(
            memo=memo,
            chunk_content="Original chunk",
            chunk_index=0,
            embedding=[0.1] * 2048,
            project=project,
        )

        assert MemoSummary.objects.filter(memo=memo).exists()
        assert MemoTag.objects.filter(memo=memo).exists()
        assert MemoChunk.objects.filter(memo=memo).exists()

        mock_send_memo.reset_mock()

        update_url = reverse("memo-detail", kwargs={"pk": memo_uuid})
        update_data = {
            "content": "New updated content",
        }
        response = client.patch(update_url, update_data, format="json")

        assert response.status_code == status.HTTP_200_OK

        memo_content = MemoContent.objects.filter(memo=memo).first()
        assert memo_content is not None
        assert memo_content.content == "New updated content"

        assert not MemoSummary.objects.filter(memo=memo).exists()
        assert not MemoTag.objects.filter(memo=memo).exists()
        assert not MemoChunk.objects.filter(memo=memo).exists()

        # send_memo_for_async_processing is called when content is updated
        assert mock_send_memo.call_count == 1

    @patch("skald.api.memo_api.send_memo_for_async_processing")
    def test_update_memo_with_content_and_other_fields(
        self, mock_send_memo, user_token, project
    ) -> None:
        """Test updating memo with both content and other fields."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")

        create_url = reverse("memo-list")
        data = {
            "title": "Original Title",
            "content": "Original content",
            "project_id": str(project.uuid),
            "metadata": {"key": "value"},
        }
        client.post(create_url, data, format="json")

        memo = Memo.objects.filter(project=project, title="Original Title").first()
        assert memo is not None
        memo_uuid = memo.uuid

        MemoContent.objects.filter(memo=memo).update(content="Original content")
        MemoSummary.objects.create(
            memo=memo,
            summary="Original summary",
            embedding=[0.1] * 2048,
            project=project,
        )

        mock_send_memo.reset_mock()

        update_url = reverse("memo-detail", kwargs={"pk": memo_uuid})
        update_data = {
            "title": "New Title",
            "content": "New content",
            "metadata": {"new": "metadata"},
        }
        response = client.patch(update_url, update_data, format="json")

        assert response.status_code == status.HTTP_200_OK

        memo.refresh_from_db()
        assert memo.title == "New Title"
        assert memo.metadata == {"new": "metadata"}

        memo_content = MemoContent.objects.filter(memo=memo).first()
        assert memo_content is not None
        assert memo_content.content == "New content"

        assert not MemoSummary.objects.filter(memo=memo).exists()

        # send_memo_for_async_processing is called when content is updated
        assert mock_send_memo.call_count == 1

    @patch("skald.flows.process_memo.process_memo.send_memo_for_async_processing")
    def test_update_memo_with_nullable_fields(
        self, mock_send_memo, user_token, project
    ) -> None:
        """Test updating memo with nullable fields set to null."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")

        create_url = reverse("memo-list")
        data = {
            "title": "Test Memo",
            "content": "Test content",
            "project_id": str(project.uuid),
            "metadata": {"key": "value"},
            "source": "original-source",
        }
        client.post(create_url, data, format="json")

        memo = Memo.objects.filter(project=project, title="Test Memo").first()
        assert memo is not None
        memo_uuid = memo.uuid

        mock_send_memo.reset_mock()

        update_url = reverse("memo-detail", kwargs={"pk": memo_uuid})
        update_data = {
            "source": None,
        }
        response = client.patch(update_url, update_data, format="json")

        assert response.status_code == status.HTTP_200_OK

        memo.refresh_from_db()
        assert memo.source is None

    def test_update_nonexistent_memo(self, user_token, project) -> None:
        """Test that attempting to update a nonexistent memo returns 404."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")

        fake_uuid = "00000000-0000-0000-0000-000000000000"
        update_url = reverse("memo-detail", kwargs={"pk": fake_uuid})
        update_data = {
            "title": "Updated Title",
        }
        response = client.patch(update_url, update_data, format="json")

        assert response.status_code == status.HTTP_404_NOT_FOUND
