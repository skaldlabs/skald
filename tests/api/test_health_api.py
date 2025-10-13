import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient


@pytest.mark.django_db
class TestHealthAPI:
    """Test suite for the health check API endpoint."""

    def test_health_endpoint_returns_200(self) -> None:
        """Test that the health endpoint returns a 200 status code."""
        client = APIClient()
        url = reverse("health")
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK

    def test_health_endpoint_returns_correct_structure(self) -> None:
        """Test that the health endpoint returns the expected JSON structure."""
        client = APIClient()
        url = reverse("health")
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert "status" in response.data
        assert "message" in response.data
        assert response.data["status"] == "ok"
        assert response.data["message"] == "API is healthy"

    def test_health_endpoint_with_trailing_slash(self) -> None:
        """Test that the health endpoint works with trailing slash."""
        client = APIClient()
        url = reverse("health-slash")
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "ok"

    def test_health_endpoint_allows_unauthenticated_access(self) -> None:
        """Test that the health endpoint is accessible without authentication."""
        client = APIClient()
        # Explicitly ensure no authentication credentials are set
        client.credentials()
        url = reverse("health")
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
