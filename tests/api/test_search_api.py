from unittest.mock import patch

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from skald.models.memo import Memo, MemoChunk, MemoContent, MemoSummary, MemoTag


@pytest.mark.django_db
class TestSearchAPIBasic:
    """Test suite for basic search API functionality."""

    @pytest.fixture
    def setup_memos(self, project):
        """Create test memos for search testing."""
        memo1 = Memo.objects.create(
            title="Python Programming Guide",
            content_length=100,
            project=project,
            source="docs.python.org",
            metadata={"language": "python", "level": "beginner"},
            content_hash="hash1",
        )
        MemoContent.objects.create(
            memo=memo1, project=project, content="Python is a programming language"
        )
        MemoSummary.objects.create(
            memo=memo1,
            project=project,
            summary="Python guide summary",
            embedding=[0.1] * 2048,
        )
        MemoTag.objects.create(memo=memo1, project=project, tag="python")

        memo2 = Memo.objects.create(
            title="JavaScript Tutorial",
            content_length=150,
            project=project,
            source="mdn.mozilla.org",
            metadata={"language": "javascript", "level": "intermediate"},
            content_hash="hash2",
        )
        MemoContent.objects.create(
            memo=memo2, project=project, content="JavaScript is a versatile language"
        )
        MemoSummary.objects.create(
            memo=memo2,
            project=project,
            summary="JavaScript tutorial summary",
            embedding=[0.2] * 2048,
        )
        MemoTag.objects.create(memo=memo2, project=project, tag="javascript")

        memo3 = Memo.objects.create(
            title="Python Advanced Topics",
            content_length=200,
            project=project,
            source="realpython.com",
            metadata={"language": "python", "level": "advanced"},
            content_hash="hash3",
        )
        MemoContent.objects.create(
            memo=memo3, project=project, content="Advanced Python concepts"
        )
        MemoSummary.objects.create(
            memo=memo3,
            project=project,
            summary="Python advanced summary",
            embedding=[0.15] * 2048,
        )
        MemoTag.objects.create(memo=memo3, project=project, tag="python")

        return {"memo1": memo1, "memo2": memo2, "memo3": memo3}

    def test_missing_query_returns_error(self, user_token, project):
        """Test that missing query parameter returns error."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("search")

        data = {
            "search_method": "title_contains",
            "project_id": str(project.uuid),
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Query is required" in response.data["error"]

    def test_missing_search_method_returns_error(self, user_token, project):
        """Test that missing search_method parameter returns error."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("search")

        data = {
            "query": "test",
            "project_id": str(project.uuid),
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Search method is required" in response.data["error"]

    def test_invalid_search_method_returns_error(self, user_token, project):
        """Test that invalid search_method returns error."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("search")

        data = {
            "query": "test",
            "search_method": "invalid_method",
            "project_id": str(project.uuid),
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Search method is required" in response.data["error"]

    def test_limit_over_50_returns_error(self, user_token, project):
        """Test that limit over 50 returns error."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("search")

        data = {
            "query": "test",
            "search_method": "title_contains",
            "project_id": str(project.uuid),
            "limit": 100,
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Limit must be less than or equal to 50" in response.data["error"]

    def test_title_contains_search(self, user_token, project, setup_memos):
        """Test title_contains search method."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("search")

        data = {
            "query": "python",
            "search_method": "title_contains",
            "project_id": str(project.uuid),
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 2
        titles = [result["title"] for result in response.data["results"]]
        assert "Python Programming Guide" in titles
        assert "Python Advanced Topics" in titles

    def test_title_startswith_search(self, user_token, project, setup_memos):
        """Test title_startswith search method."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("search")

        data = {
            "query": "Python",
            "search_method": "title_startswith",
            "project_id": str(project.uuid),
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 2
        titles = [result["title"] for result in response.data["results"]]
        assert "Python Programming Guide" in titles
        assert "Python Advanced Topics" in titles

    def test_search_result_structure(self, user_token, project, setup_memos):
        """Test that search results have the correct structure."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("search")

        data = {
            "query": "Python",
            "search_method": "title_contains",
            "project_id": str(project.uuid),
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) > 0

        result = response.data["results"][0]
        assert "title" in result
        assert "uuid" in result
        assert "content_snippet" in result
        assert "summary" in result
        assert "distance" in result

    def test_search_limit_parameter(self, user_token, project, setup_memos):
        """Test that limit parameter is respected."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("search")

        data = {
            "query": "python",
            "search_method": "title_contains",
            "project_id": str(project.uuid),
            "limit": 1,
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1


@pytest.mark.django_db
class TestSearchAPIWithFilters:
    """Test suite for search API with filters."""

    @pytest.fixture
    def setup_memos(self, project):
        """Create test memos with diverse attributes for filter testing."""
        memo1 = Memo.objects.create(
            title="Python Basics",
            content_length=100,
            project=project,
            source="docs.python.org",
            client_reference_id="REF-001",
            metadata={"language": "python", "level": "beginner", "topic": "basics"},
            content_hash="hash1",
        )
        MemoContent.objects.create(memo=memo1, project=project, content="Python basics")
        MemoSummary.objects.create(
            memo=memo1,
            project=project,
            summary="Python basics summary",
            embedding=[0.1] * 2048,
        )
        MemoTag.objects.create(memo=memo1, project=project, tag="python")
        MemoTag.objects.create(memo=memo1, project=project, tag="tutorial")

        memo2 = Memo.objects.create(
            title="Python Advanced",
            content_length=150,
            project=project,
            source="realpython.com",
            client_reference_id="REF-002",
            metadata={"language": "python", "level": "advanced", "topic": "decorators"},
            content_hash="hash2",
        )
        MemoContent.objects.create(
            memo=memo2, project=project, content="Advanced Python"
        )
        MemoSummary.objects.create(
            memo=memo2,
            project=project,
            summary="Python advanced summary",
            embedding=[0.2] * 2048,
        )
        MemoTag.objects.create(memo=memo2, project=project, tag="python")
        MemoTag.objects.create(memo=memo2, project=project, tag="advanced")

        memo3 = Memo.objects.create(
            title="JavaScript Guide",
            content_length=200,
            project=project,
            source="mdn.mozilla.org",
            client_reference_id="REF-003",
            metadata={"language": "javascript", "level": "beginner", "topic": "intro"},
            content_hash="hash3",
        )
        MemoContent.objects.create(
            memo=memo3, project=project, content="JavaScript intro"
        )
        MemoSummary.objects.create(
            memo=memo3,
            project=project,
            summary="JavaScript guide summary",
            embedding=[0.15] * 2048,
        )
        MemoTag.objects.create(memo=memo3, project=project, tag="javascript")

        return {"memo1": memo1, "memo2": memo2, "memo3": memo3}

    def test_invalid_filter_returns_error(self, user_token, project):
        """Test that invalid filter structure returns error."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("search")

        data = {
            "query": "test",
            "search_method": "title_contains",
            "project_id": str(project.uuid),
            "filters": [{"invalid": "filter"}],
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Invalid filter" in response.data["error"]

    def test_filter_by_native_field_source(self, user_token, project, setup_memos):
        """Test filtering by source field."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("search")

        data = {
            "query": "python",
            "search_method": "title_contains",
            "project_id": str(project.uuid),
            "filters": [
                {
                    "field": "source",
                    "operator": "eq",
                    "value": "docs.python.org",
                    "filter_type": "native_field",
                }
            ],
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["title"] == "Python Basics"

    def test_filter_by_metadata(self, user_token, project, setup_memos):
        """Test filtering by custom metadata."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("search")

        data = {
            "query": "python",
            "search_method": "title_contains",
            "project_id": str(project.uuid),
            "filters": [
                {
                    "field": "level",
                    "operator": "eq",
                    "value": "advanced",
                    "filter_type": "custom_metadata",
                }
            ],
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["title"] == "Python Advanced"

    def test_filter_by_tags(self, user_token, project, setup_memos):
        """Test filtering by tags."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("search")

        data = {
            "query": "python",
            "search_method": "title_contains",
            "project_id": str(project.uuid),
            "filters": [
                {
                    "field": "tags",
                    "operator": "in",
                    "value": ["tutorial"],
                    "filter_type": "native_field",
                }
            ],
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["title"] == "Python Basics"

    def test_multiple_filters_combined(self, user_token, project, setup_memos):
        """Test combining multiple filters."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("search")

        data = {
            "query": "python",
            "search_method": "title_contains",
            "project_id": str(project.uuid),
            "filters": [
                {
                    "field": "source",
                    "operator": "contains",
                    "value": "python",
                    "filter_type": "native_field",
                },
                {
                    "field": "level",
                    "operator": "eq",
                    "value": "beginner",
                    "filter_type": "custom_metadata",
                },
            ],
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["title"] == "Python Basics"

    def test_filter_with_startswith_search(self, user_token, project, setup_memos):
        """Test filters work with title_startswith search method."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("search")

        data = {
            "query": "Python",
            "search_method": "title_startswith",
            "project_id": str(project.uuid),
            "filters": [
                {
                    "field": "level",
                    "operator": "eq",
                    "value": "advanced",
                    "filter_type": "custom_metadata",
                }
            ],
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["title"] == "Python Advanced"

    def test_filter_returns_no_results(self, user_token, project, setup_memos):
        """Test that non-matching filters return empty results."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("search")

        data = {
            "query": "python",
            "search_method": "title_contains",
            "project_id": str(project.uuid),
            "filters": [
                {
                    "field": "source",
                    "operator": "eq",
                    "value": "nonexistent.com",
                    "filter_type": "native_field",
                }
            ],
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 0


@pytest.mark.django_db
class TestSearchAPIChunkVectorSearch:
    """Test suite for chunk_vector_search with filters."""

    @pytest.fixture
    def setup_memos_with_chunks(self, project):
        """Create test memos with chunks for vector search testing."""
        memo1 = Memo.objects.create(
            title="Python Guide",
            content_length=100,
            project=project,
            source="docs.python.org",
            metadata={"language": "python"},
            content_hash="hash1",
        )
        MemoContent.objects.create(
            memo=memo1, project=project, content="Python content"
        )
        MemoSummary.objects.create(
            memo=memo1, project=project, summary="Python guide", embedding=[0.1] * 2048
        )
        MemoChunk.objects.create(
            memo=memo1,
            project=project,
            chunk_content="Python programming",
            chunk_index=0,
            embedding=[0.1] * 2048,
        )
        MemoTag.objects.create(memo=memo1, project=project, tag="python")

        memo2 = Memo.objects.create(
            title="JavaScript Guide",
            content_length=150,
            project=project,
            source="mdn.mozilla.org",
            metadata={"language": "javascript"},
            content_hash="hash2",
        )
        MemoContent.objects.create(
            memo=memo2, project=project, content="JavaScript content"
        )
        MemoSummary.objects.create(
            memo=memo2,
            project=project,
            summary="JavaScript guide",
            embedding=[0.2] * 2048,
        )
        MemoChunk.objects.create(
            memo=memo2,
            project=project,
            chunk_content="JavaScript programming",
            chunk_index=0,
            embedding=[0.2] * 2048,
        )
        MemoTag.objects.create(memo=memo2, project=project, tag="javascript")

        return {"memo1": memo1, "memo2": memo2}

    @patch("skald.services.embedding_service.EmbeddingService.generate_embedding")
    def test_chunk_vector_search_basic(
        self, mock_generate_embedding, user_token, project, setup_memos_with_chunks
    ):
        """Test basic chunk_vector_search."""
        mock_generate_embedding.return_value = [0.1] * 2048

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("search")

        data = {
            "query": "python programming",
            "search_method": "chunk_vector_search",
            "project_id": str(project.uuid),
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) >= 1
        assert "distance" in response.data["results"][0]

    @patch("skald.services.embedding_service.EmbeddingService.generate_embedding")
    def test_chunk_vector_search_with_filter(
        self, mock_generate_embedding, user_token, project, setup_memos_with_chunks
    ):
        """Test chunk_vector_search with filters."""
        mock_generate_embedding.return_value = [0.1] * 2048

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("search")

        data = {
            "query": "programming",
            "search_method": "chunk_vector_search",
            "project_id": str(project.uuid),
            "filters": [
                {
                    "field": "language",
                    "operator": "eq",
                    "value": "python",
                    "filter_type": "custom_metadata",
                }
            ],
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["title"] == "Python Guide"

    @patch("skald.services.embedding_service.EmbeddingService.generate_embedding")
    def test_chunk_vector_search_with_tag_filter(
        self, mock_generate_embedding, user_token, project, setup_memos_with_chunks
    ):
        """Test chunk_vector_search with tag filters."""
        mock_generate_embedding.return_value = [0.1] * 2048

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("search")

        data = {
            "query": "programming",
            "search_method": "chunk_vector_search",
            "project_id": str(project.uuid),
            "filters": [
                {
                    "field": "tags",
                    "operator": "in",
                    "value": ["python"],
                    "filter_type": "native_field",
                }
            ],
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["title"] == "Python Guide"
