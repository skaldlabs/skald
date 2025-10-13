import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient


@pytest.mark.django_db
class TestMemoAPIAuthentication:
    """Test suite for memo API authentication and authorization."""

    def test_unauthorized_user_cannot_create_memo(self) -> None:
        """Test that an unauthorized user cannot access the create memo endpoint."""
        client = APIClient()
        url = reverse("memo-list")

        data = {
            "title": "Test Memo",
            "content": "Test content",
            "project_id": "00000000-0000-0000-0000-000000000000",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_user_without_project_access_cannot_create_memo(
        self, other_user_token, project
    ) -> None:
        """Test that a user without access to the project cannot create a memo."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {other_user_token}")
        url = reverse("memo-list")

        data = {
            "title": "Test Memo",
            "content": "Test content",
            "project_id": str(project.uuid),
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "Access denied" in response.data["error"]

    def test_api_key_allows_access_to_project(self, project_api_key, project) -> None:
        """Test that a project API key allows access to create memos."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {project_api_key}")
        url = reverse("memo-list")

        data = {
            "title": "Test Memo",
            "content": "Test content",
            "project_id": str(project.uuid),
            "metadata": {},
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED

    def test_authorized_user_can_create_memo(self, user_token, project) -> None:
        """Test that an authorized user with project access can create a memo."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("memo-list")

        data = {
            "title": "Test Memo",
            "content": "Test content",
            "project_id": str(project.uuid),
            "metadata": {},
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED

    def test_api_key_cannot_access_different_project(
        self, project_api_key, other_project
    ) -> None:
        """Test that a project API key cannot access a different project."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {project_api_key}")
        url = reverse("memo-list")

        # Try to create a memo in a different project
        data = {
            "title": "Test Memo",
            "content": "Test content",
            "project_id": str(other_project.uuid),
            "metadata": {},
        }

        response = client.post(url, data, format="json")

        # Should fail because the API key is for a different project
        assert response.status_code == status.HTTP_403_FORBIDDEN
