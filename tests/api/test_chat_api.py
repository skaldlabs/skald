from unittest.mock import MagicMock, patch

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from skald.models.memo import Memo, MemoChunk, MemoContent, MemoSummary


@pytest.mark.django_db
class TestChatAPIBasic:
    """Test suite for basic chat API functionality."""

    def test_missing_query_returns_error(self, user_token, project):
        """Test that missing query parameter returns error."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("chat")

        data = {
            "project_id": str(project.uuid),
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Query is required" in response.data["error"]

    def test_filters_must_be_list(self, user_token, project):
        """Test that filters parameter must be a list."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("chat")

        data = {
            "query": "test query",
            "project_id": str(project.uuid),
            "filters": "not_a_list",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Filters must be a list" in response.data["error"]

    def test_invalid_filter_returns_error(self, user_token, project):
        """Test that invalid filter structure returns error."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("chat")

        data = {
            "query": "test query",
            "project_id": str(project.uuid),
            "filters": [{"invalid": "filter"}],
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Invalid filter" in response.data["error"]


@pytest.mark.django_db
class TestChatAPIContextPreparation:
    """Test suite for chat API context preparation."""

    @pytest.fixture
    def setup_memos_with_chunks(self, project):
        """Create test memos with chunks for context testing."""
        memo1 = Memo.objects.create(
            title="Python Guide",
            content_length=100,
            project=project,
            source="docs.python.org",
            metadata={"language": "python", "level": "beginner"},
            content_hash="hash1",
        )
        MemoContent.objects.create(
            memo=memo1, project=project, content="Python basics content"
        )
        MemoSummary.objects.create(
            memo=memo1,
            project=project,
            summary="Python guide summary",
            embedding=[0.1] * 2048,
        )
        chunk1 = MemoChunk.objects.create(
            memo=memo1,
            project=project,
            chunk_content="Python is a high-level programming language",
            chunk_index=0,
            embedding=[0.1] * 2048,
        )

        memo2 = Memo.objects.create(
            title="JavaScript Guide",
            content_length=150,
            project=project,
            source="mdn.mozilla.org",
            metadata={"language": "javascript", "level": "intermediate"},
            content_hash="hash2",
        )
        MemoContent.objects.create(
            memo=memo2, project=project, content="JavaScript content"
        )
        MemoSummary.objects.create(
            memo=memo2,
            project=project,
            summary="JavaScript guide summary",
            embedding=[0.2] * 2048,
        )
        chunk2 = MemoChunk.objects.create(
            memo=memo2,
            project=project,
            chunk_content="JavaScript is versatile",
            chunk_index=0,
            embedding=[0.2] * 2048,
        )

        return {"memo1": memo1, "memo2": memo2, "chunk1": chunk1, "chunk2": chunk2}

    @patch("skald.api.chat_api.run_chat_agent")
    @patch("skald.api.chat_api.prepare_context_for_chat_agent")
    def test_context_preparation_called_with_query(
        self,
        mock_prepare_context,
        mock_run_agent,
        user_token,
        project,
        setup_memos_with_chunks,
    ):
        """Test that prepare_context_for_chat_agent is called with correct query."""
        # Mock the preprocessing to return dummy results
        mock_result = MagicMock()
        mock_result.document = "Test document"
        mock_prepare_context.return_value = [mock_result]

        # Mock the agent to return a simple response
        mock_run_agent.return_value = {
            "output": "Test response",
            "intermediate_steps": [],
        }

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("chat")

        data = {
            "query": "What is Python?",
            "project_id": str(project.uuid),
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        mock_prepare_context.assert_called_once_with("What is Python?", project, [])

    @patch("skald.api.chat_api.run_chat_agent")
    @patch("skald.api.chat_api.prepare_context_for_chat_agent")
    def test_context_preparation_with_filters(
        self,
        mock_prepare_context,
        mock_run_agent,
        user_token,
        project,
        setup_memos_with_chunks,
    ):
        """Test that filters are properly parsed and passed to context preparation."""
        # Mock the preprocessing to return dummy results
        mock_result = MagicMock()
        mock_result.document = "Test document"
        mock_prepare_context.return_value = [mock_result]

        # Mock the agent to return a simple response
        mock_run_agent.return_value = {
            "output": "Test response",
            "intermediate_steps": [],
        }

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("chat")

        data = {
            "query": "What is Python?",
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
        # Check that prepare_context was called with the right arguments
        assert mock_prepare_context.call_count == 1
        call_args = mock_prepare_context.call_args
        assert call_args[0][0] == "What is Python?"
        assert call_args[0][1] == project
        # Check that filters were parsed correctly
        filters = call_args[0][2]
        assert len(filters) == 1
        assert filters[0].field == "language"
        assert filters[0].operator == "eq"
        assert filters[0].value == "python"
        assert filters[0].filter_type == "custom_metadata"

    @patch("skald.api.chat_api.run_chat_agent")
    @patch("skald.api.chat_api.prepare_context_for_chat_agent")
    def test_context_preparation_with_multiple_filters(
        self,
        mock_prepare_context,
        mock_run_agent,
        user_token,
        project,
        setup_memos_with_chunks,
    ):
        """Test that multiple filters are properly parsed and passed."""
        # Mock the preprocessing to return dummy results
        mock_result = MagicMock()
        mock_result.document = "Test document"
        mock_prepare_context.return_value = [mock_result]

        # Mock the agent to return a simple response
        mock_run_agent.return_value = {
            "output": "Test response",
            "intermediate_steps": [],
        }

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("chat")

        data = {
            "query": "What is Python?",
            "project_id": str(project.uuid),
            "filters": [
                {
                    "field": "language",
                    "operator": "eq",
                    "value": "python",
                    "filter_type": "custom_metadata",
                },
                {
                    "field": "source",
                    "operator": "contains",
                    "value": "python.org",
                    "filter_type": "native_field",
                },
            ],
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        # Check that filters were parsed correctly
        filters = mock_prepare_context.call_args[0][2]
        assert len(filters) == 2
        assert filters[0].field == "language"
        assert filters[1].field == "source"

    @patch("skald.api.chat_api.run_chat_agent")
    @patch("skald.api.chat_api.prepare_context_for_chat_agent")
    def test_context_string_formatting(
        self,
        mock_prepare_context,
        mock_run_agent,
        user_token,
        project,
        setup_memos_with_chunks,
    ):
        """Test that context string is properly formatted from reranked results."""
        # Mock the preprocessing to return multiple results
        mock_result1 = MagicMock()
        mock_result1.document = "First document content"
        mock_result2 = MagicMock()
        mock_result2.document = "Second document content"
        mock_prepare_context.return_value = [mock_result1, mock_result2]

        # Mock the agent to return a simple response
        mock_run_agent.return_value = {
            "output": "Test response",
            "intermediate_steps": [],
        }

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("chat")

        data = {
            "query": "test query",
            "project_id": str(project.uuid),
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        # Check that the agent was called with properly formatted context
        assert mock_run_agent.call_count == 1
        call_args = mock_run_agent.call_args
        assert call_args[0][0] == "test query"
        context_str = call_args[0][1]
        assert "Result 1: First document content" in context_str
        assert "Result 2: Second document content" in context_str

    @patch("skald.api.chat_api.run_chat_agent")
    @patch("skald.api.chat_api.prepare_context_for_chat_agent")
    def test_empty_context_still_calls_agent(
        self,
        mock_prepare_context,
        mock_run_agent,
        user_token,
        project,
    ):
        """Test that agent is called even when context preparation returns no results."""
        # Mock the preprocessing to return empty results
        mock_prepare_context.return_value = []

        # Mock the agent to return a simple response
        mock_run_agent.return_value = {
            "output": "No relevant context found",
            "intermediate_steps": [],
        }

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("chat")

        data = {
            "query": "nonexistent query",
            "project_id": str(project.uuid),
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        # Check that the agent was called with empty context
        assert mock_run_agent.call_count == 1
        call_args = mock_run_agent.call_args
        assert call_args[0][0] == "nonexistent query"
        context_str = call_args[0][1]
        assert context_str == ""


@pytest.mark.django_db
class TestChatAPIResponseModes:
    """Test suite for chat API streaming and non-streaming responses."""

    @patch("skald.api.chat_api.run_chat_agent")
    @patch("skald.api.chat_api.prepare_context_for_chat_agent")
    def test_non_streaming_response_structure(
        self, mock_prepare_context, mock_run_agent, user_token, project
    ):
        """Test that non-streaming response has correct structure."""
        # Mock the preprocessing
        mock_result = MagicMock()
        mock_result.document = "Test document"
        mock_prepare_context.return_value = [mock_result]

        # Mock the agent with intermediate steps
        mock_run_agent.return_value = {
            "output": "Final answer",
            "intermediate_steps": [
                {"action": "search", "result": "search result"},
                {"action": "think", "result": "thinking"},
            ],
        }

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("chat")

        data = {
            "query": "test query",
            "project_id": str(project.uuid),
            "stream": False,
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert "ok" in response.data
        assert response.data["ok"] is True
        assert "response" in response.data
        assert response.data["response"] == "Final answer"
        assert "intermediate_steps" in response.data
        assert len(response.data["intermediate_steps"]) == 2

    @patch("skald.api.chat_api.stream_chat_agent")
    @patch("skald.api.chat_api.prepare_context_for_chat_agent")
    def test_streaming_response_uses_streaming_agent(
        self, mock_prepare_context, mock_stream_agent, user_token, project
    ):
        """Test that streaming mode uses stream_chat_agent."""
        # Mock the preprocessing
        mock_result = MagicMock()
        mock_result.document = "Test document"
        mock_prepare_context.return_value = [mock_result]

        # Mock the streaming agent to return chunks
        mock_stream_agent.return_value = iter(
            [
                {"type": "token", "content": "Hello"},
                {"type": "token", "content": " world"},
                {"type": "done"},
            ]
        )

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("chat")

        data = {
            "query": "test query",
            "project_id": str(project.uuid),
            "stream": True,
        }

        response = client.post(url, data, format="json")

        # Streaming responses return 200 with StreamingHttpResponse
        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"] == "text/event-stream"
        # Consume the streaming response to trigger the generator
        list(response.streaming_content)
        assert mock_stream_agent.call_count == 1

    @patch("skald.api.chat_api.run_chat_agent")
    @patch("skald.api.chat_api.prepare_context_for_chat_agent")
    def test_agent_error_returns_500(
        self, mock_prepare_context, mock_run_agent, user_token, project
    ):
        """Test that agent errors are properly handled."""
        # Mock the preprocessing
        mock_result = MagicMock()
        mock_result.document = "Test document"
        mock_prepare_context.return_value = [mock_result]

        # Mock the agent to raise an error
        mock_run_agent.side_effect = Exception("Agent processing error")

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("chat")

        data = {
            "query": "test query",
            "project_id": str(project.uuid),
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert "Agent error" in response.data["error"]
        assert "Agent processing error" in response.data["error"]


@pytest.mark.django_db
class TestChatAPIFilterIntegration:
    """Test suite for chat API filter integration with native and custom metadata."""

    @pytest.fixture
    def setup_diverse_memos(self, project):
        """Create test memos with diverse attributes for comprehensive filter testing."""
        memo1 = Memo.objects.create(
            title="Python Basics",
            content_length=100,
            project=project,
            source="docs.python.org",
            metadata={"language": "python", "level": "beginner"},
            content_hash="hash1",
        )
        MemoContent.objects.create(memo=memo1, project=project, content="Python basics")
        MemoSummary.objects.create(
            memo=memo1,
            project=project,
            summary="Python basics summary",
            embedding=[0.1] * 2048,
        )
        MemoChunk.objects.create(
            memo=memo1,
            project=project,
            chunk_content="Python content",
            chunk_index=0,
            embedding=[0.1] * 2048,
        )

        memo2 = Memo.objects.create(
            title="JavaScript Guide",
            content_length=150,
            project=project,
            source="mdn.mozilla.org",
            metadata={"language": "javascript", "level": "intermediate"},
            content_hash="hash2",
        )
        MemoContent.objects.create(
            memo=memo2, project=project, content="JavaScript content"
        )
        MemoSummary.objects.create(
            memo=memo2,
            project=project,
            summary="JavaScript summary",
            embedding=[0.2] * 2048,
        )
        MemoChunk.objects.create(
            memo=memo2,
            project=project,
            chunk_content="JavaScript content",
            chunk_index=0,
            embedding=[0.2] * 2048,
        )

        return {"memo1": memo1, "memo2": memo2}

    @patch("skald.api.chat_api.run_chat_agent")
    @patch("skald.api.chat_api.prepare_context_for_chat_agent")
    def test_native_field_filter_passed_correctly(
        self,
        mock_prepare_context,
        mock_run_agent,
        user_token,
        project,
        setup_diverse_memos,
    ):
        """Test that native field filters are properly parsed and passed."""
        mock_result = MagicMock()
        mock_result.document = "Test"
        mock_prepare_context.return_value = [mock_result]
        mock_run_agent.return_value = {"output": "Response", "intermediate_steps": []}

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("chat")

        data = {
            "query": "test",
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
        filters = mock_prepare_context.call_args[0][2]
        assert len(filters) == 1
        assert filters[0].filter_type == "native_field"
        assert filters[0].field == "source"

    @patch("skald.api.chat_api.run_chat_agent")
    @patch("skald.api.chat_api.prepare_context_for_chat_agent")
    def test_custom_metadata_filter_passed_correctly(
        self,
        mock_prepare_context,
        mock_run_agent,
        user_token,
        project,
        setup_diverse_memos,
    ):
        """Test that custom metadata filters are properly parsed and passed."""
        mock_result = MagicMock()
        mock_result.document = "Test"
        mock_prepare_context.return_value = [mock_result]
        mock_run_agent.return_value = {"output": "Response", "intermediate_steps": []}

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("chat")

        data = {
            "query": "test",
            "project_id": str(project.uuid),
            "filters": [
                {
                    "field": "level",
                    "operator": "eq",
                    "value": "beginner",
                    "filter_type": "custom_metadata",
                }
            ],
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        filters = mock_prepare_context.call_args[0][2]
        assert len(filters) == 1
        assert filters[0].filter_type == "custom_metadata"
        assert filters[0].field == "level"
        assert filters[0].value == "beginner"
