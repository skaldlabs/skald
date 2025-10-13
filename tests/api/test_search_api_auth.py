import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient


@pytest.mark.django_db
class TestSearchAPIAuthentication:
    """Test suite for search API authentication and authorization."""

    def test_unauthorized_user_cannot_search(self) -> None:
        """Test that an unauthorized user cannot access the search endpoint."""
        client = APIClient()
        url = reverse("search")

        data = {
            "query": "test query",
            "search_method": "title_contains",
            "project_id": "00000000-0000-0000-0000-000000000000",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_user_without_project_access_cannot_search(
        self, other_user_token, project
    ) -> None:
        """Test that a user without access to the project cannot search."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {other_user_token}")
        url = reverse("search")

        data = {
            "query": "test query",
            "search_method": "title_contains",
            "project_id": str(project.uuid),
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "Access denied" in response.data["error"]

    def test_api_key_allows_access_to_project(self, project_api_key, project) -> None:
        """Test that a project API key allows access to search."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {project_api_key}")
        url = reverse("search")

        data = {
            "query": "test query",
            "search_method": "title_contains",
            "project_id": str(project.uuid),
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK

    def test_authorized_user_can_search(self, user_token, project) -> None:
        """Test that an authorized user with project access can search."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("search")

        data = {
            "query": "test query",
            "search_method": "title_contains",
            "project_id": str(project.uuid),
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK

    def test_api_key_cannot_access_different_project(
        self, project_api_key, other_project
    ) -> None:
        """Test that a project API key cannot search a different project."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {project_api_key}")
        url = reverse("search")

        # Try to search in a different project
        data = {
            "query": "test query",
            "search_method": "title_contains",
            "project_id": str(other_project.uuid),
        }

        response = client.post(url, data, format="json")

        # Should fail because the API key is for a different project
        assert response.status_code == status.HTTP_403_FORBIDDEN
