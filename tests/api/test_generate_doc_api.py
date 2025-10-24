import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from unittest.mock import patch, MagicMock


@pytest.mark.django_db
class TestGenerateDocAPI:
    """Test suite for document generation API."""

    @patch("skald.api.generate_doc_api.run_generate_doc_agent")
    @patch("skald.api.generate_doc_api.prepare_context_for_chat_agent")
    def test_generate_doc_with_valid_prompt(
        self,
        mock_prepare_context,
        mock_generate_doc,
        user_token,
        project,
        organization_membership,
    ) -> None:
        """Test generating document with valid prompt."""
        # Mock the context preparation
        mock_prepare_context.return_value = []

        # Mock the document generation
        mock_generate_doc.return_value = {
            "output": "Generated document content",
            "intermediate_steps": [],
        }

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("generate_doc")

        data = {
            "prompt": "Generate a summary document",
            "project_id": str(project.uuid),
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["ok"] is True
        assert "response" in response.data
        assert response.data["response"] == "Generated document content"

    @patch("skald.api.generate_doc_api.run_generate_doc_agent")
    @patch("skald.api.generate_doc_api.prepare_context_for_chat_agent")
    def test_generate_doc_with_rules(
        self,
        mock_prepare_context,
        mock_generate_doc,
        user_token,
        project,
        organization_membership,
    ) -> None:
        """Test generating document with custom rules."""
        mock_prepare_context.return_value = []
        mock_generate_doc.return_value = {
            "output": "Generated document with rules",
            "intermediate_steps": [],
        }

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("generate_doc")

        data = {
            "prompt": "Generate a summary document",
            "rules": "Use formal tone and include citations",
            "project_id": str(project.uuid),
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["ok"] is True

    @patch("skald.api.generate_doc_api.prepare_context_for_chat_agent")
    def test_generate_doc_with_filters(
        self,
        mock_prepare_context,
        user_token,
        project,
        organization_membership,
    ) -> None:
        """Test generating document with memo filters."""
        mock_prepare_context.return_value = []

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("generate_doc")

        data = {
            "prompt": "Generate a summary document",
            "project_id": str(project.uuid),
            "filters": [
                {"field": "tags", "operator": "contains", "value": "important"}
            ],
        }

        response = client.post(url, data, format="json")

        # Should not return 500 even with filters
        assert response.status_code != status.HTTP_500_INTERNAL_SERVER_ERROR

    def test_generate_doc_missing_prompt(
        self, user_token, project, organization_membership
    ) -> None:
        """Test that missing prompt returns 400."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("generate_doc")

        data = {
            "project_id": str(project.uuid),
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "error" in response.data

    def test_generate_doc_empty_prompt(
        self, user_token, project, organization_membership
    ) -> None:
        """Test that empty prompt returns 400."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("generate_doc")

        data = {
            "prompt": "",
            "project_id": str(project.uuid),
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_generate_doc_missing_project_id(self, user_token) -> None:
        """Test that missing project_id returns 404."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("generate_doc")

        data = {
            "prompt": "Generate a document",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_generate_doc_invalid_project_id(self, user_token) -> None:
        """Test that invalid project_id returns 404."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("generate_doc")

        data = {
            "prompt": "Generate a document",
            "project_id": "00000000-0000-0000-0000-000000000000",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_generate_doc_with_other_users_project(
        self, user_token, other_project
    ) -> None:
        """Test that user cannot generate doc for other user's project."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("generate_doc")

        data = {
            "prompt": "Generate a document",
            "project_id": str(other_project.uuid),
        }

        response = client.post(url, data, format="json")

        assert response.status_code in [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND,
        ]

    def test_generate_doc_without_authentication(self, project) -> None:
        """Test that document generation requires authentication."""
        client = APIClient()
        url = reverse("generate_doc")

        data = {
            "prompt": "Generate a document",
            "project_id": str(project.uuid),
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_generate_doc_with_invalid_filter(
        self, user_token, project, organization_membership
    ) -> None:
        """Test that invalid filter format returns 400, not 500."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("generate_doc")

        data = {
            "prompt": "Generate a document",
            "project_id": str(project.uuid),
            "filters": [
                {"field": "invalid_field", "operator": "invalid_op", "value": "test"}
            ],
        }

        response = client.post(url, data, format="json")

        # Should return 400 for invalid filter, not 500
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "error" in response.data

    @patch("skald.api.generate_doc_api.run_generate_doc_agent")
    @patch("skald.api.generate_doc_api.prepare_context_for_chat_agent")
    def test_generate_doc_with_long_prompt(
        self,
        mock_prepare_context,
        mock_generate_doc,
        user_token,
        project,
        organization_membership,
    ) -> None:
        """Test generating document with very long prompt."""
        mock_prepare_context.return_value = []
        mock_generate_doc.return_value = {
            "output": "Generated document",
            "intermediate_steps": [],
        }

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("generate_doc")

        long_prompt = "A" * 10000
        data = {
            "prompt": long_prompt,
            "project_id": str(project.uuid),
        }

        response = client.post(url, data, format="json")

        # Should not return 500
        assert response.status_code != status.HTTP_500_INTERNAL_SERVER_ERROR

    def test_generate_doc_options_request(self, project) -> None:
        """Test CORS preflight OPTIONS request."""
        client = APIClient()
        url = reverse("generate_doc")

        response = client.options(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.has_header("Access-Control-Allow-Origin")
        assert response.has_header("Access-Control-Allow-Methods")


@pytest.mark.django_db
class TestGenerateDocAPIWithProjectKey:
    """Test suite for document generation API using project API key."""

    @patch("skald.api.generate_doc_api.run_generate_doc_agent")
    @patch("skald.api.generate_doc_api.prepare_context_for_chat_agent")
    def test_generate_doc_with_project_api_key(
        self,
        mock_prepare_context,
        mock_generate_doc,
        project,
        project_api_key,
    ) -> None:
        """Test generating document using project API key."""
        mock_prepare_context.return_value = []
        mock_generate_doc.return_value = {
            "output": "Generated document",
            "intermediate_steps": [],
        }

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {project_api_key}")
        url = reverse("generate_doc")

        data = {
            "prompt": "Generate a document",
            "project_id": str(project.uuid),
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK

    def test_generate_doc_with_invalid_api_key(self, project) -> None:
        """Test that invalid API key returns 401."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION="Bearer invalid_key")
        url = reverse("generate_doc")

        data = {
            "prompt": "Generate a document",
            "project_id": str(project.uuid),
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
