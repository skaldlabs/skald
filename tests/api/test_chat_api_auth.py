import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient


@pytest.mark.django_db
class TestChatAPIAuthentication:
    """Test suite for chat API authentication and authorization."""

    def test_unauthorized_user_cannot_chat(self) -> None:
        """Test that an unauthorized user cannot access the chat endpoint."""
        client = APIClient()
        url = reverse("chat")

        data = {
            "query": "test query",
            "project_id": "00000000-0000-0000-0000-000000000000",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_user_without_project_access_cannot_chat(
        self, other_user_token, project
    ) -> None:
        """Test that a user without access to the project cannot use chat."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {other_user_token}")
        url = reverse("chat")

        data = {
            "query": "test query",
            "project_id": str(project.uuid),
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "Access denied" in response.data["error"]

    def test_api_key_allows_access_to_project(self, project_api_key, project) -> None:
        """Test that a project API key allows access to chat."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {project_api_key}")
        url = reverse("chat")

        data = {
            "query": "test query",
            "project_id": str(project.uuid),
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK

    def test_authorized_user_can_chat(self, user_token, project) -> None:
        """Test that an authorized user with project access can use chat."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("chat")

        data = {
            "query": "test query",
            "project_id": str(project.uuid),
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK

    def test_api_key_ignores_project_id_in_request(
        self, project_api_key, other_project
    ) -> None:
        """Test that a project API key ignores project_id in request and uses its own project."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {project_api_key}")
        url = reverse("chat")

        # Send a different project_id - it should be ignored
        data = {
            "query": "test query",
            "project_id": str(other_project.uuid),
        }

        response = client.post(url, data, format="json")

        # Should succeed because the API key determines the project, not the request parameter
        assert response.status_code == status.HTTP_200_OK
