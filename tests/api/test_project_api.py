import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from skald.models.project import Project, ProjectApiKey


@pytest.mark.django_db
class TestProjectCreate:
    """Test suite for project creation endpoint."""

    def test_create_project_with_valid_data(
        self, user_token, organization, organization_membership
    ) -> None:
        """Test creating a project with valid data."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse(
            "project-list",
            kwargs={"parent_lookup_organization": str(organization.uuid)},
        )

        data = {
            "name": "New Test Project",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "New Test Project"
        assert "uuid" in response.data

        # Verify project was created
        project = Project.objects.filter(
            organization=organization, name="New Test Project"
        ).first()
        assert project is not None

    def test_create_project_missing_name(
        self, user_token, organization, organization_membership
    ) -> None:
        """Test that missing name returns 400."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse(
            "project-list",
            kwargs={"parent_lookup_organization": str(organization.uuid)},
        )

        data = {}

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_project_empty_name(
        self, user_token, organization, organization_membership
    ) -> None:
        """Test that empty name returns 400."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse(
            "project-list",
            kwargs={"parent_lookup_organization": str(organization.uuid)},
        )

        data = {
            "name": "",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_project_without_membership(self, user_token, other_organization) -> None:
        """Test that user cannot create project in organization they're not a member of."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse(
            "project-list",
            kwargs={"parent_lookup_organization": str(other_organization.uuid)},
        )

        data = {
            "name": "Unauthorized Project",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_create_project_without_authentication(self, organization) -> None:
        """Test that project creation requires authentication."""
        client = APIClient()
        url = reverse(
            "project-list",
            kwargs={"parent_lookup_organization": str(organization.uuid)},
        )

        data = {
            "name": "Unauthenticated Project",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestProjectUpdate:
    """Test suite for project update endpoint."""

    def test_update_project_name(
        self, user_token, project, organization_membership
    ) -> None:
        """Test updating project name."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse(
            "project-detail",
            kwargs={
                "parent_lookup_organization": str(project.organization.uuid),
                "pk": str(project.uuid),
            },
        )

        data = {
            "name": "Updated Project Name",
        }

        response = client.patch(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Updated Project Name"

        # Verify project was updated
        project.refresh_from_db()
        assert project.name == "Updated Project Name"

    def test_update_project_from_different_org(
        self, user_token, other_project
    ) -> None:
        """Test that user cannot update project from different organization."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse(
            "project-detail",
            kwargs={
                "parent_lookup_organization": str(other_project.organization.uuid),
                "pk": str(other_project.uuid),
            },
        )

        data = {
            "name": "Unauthorized Update",
        }

        response = client.patch(url, data, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_update_nonexistent_project(
        self, user_token, organization, organization_membership
    ) -> None:
        """Test that updating nonexistent project returns 404."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse(
            "project-detail",
            kwargs={
                "parent_lookup_organization": str(organization.uuid),
                "pk": "00000000-0000-0000-0000-000000000000",
            },
        )

        data = {
            "name": "Updated Name",
        }

        response = client.patch(url, data, format="json")

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_update_project_without_authentication(self, project) -> None:
        """Test that project update requires authentication."""
        client = APIClient()
        url = reverse(
            "project-detail",
            kwargs={
                "parent_lookup_organization": str(project.organization.uuid),
                "pk": str(project.uuid),
            },
        )

        data = {
            "name": "Unauthorized Update",
        }

        response = client.patch(url, data, format="json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestProjectDestroy:
    """Test suite for project deletion endpoint."""

    def test_delete_project(self, user_token, project, organization_membership) -> None:
        """Test deleting a project."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse(
            "project-detail",
            kwargs={
                "parent_lookup_organization": str(project.organization.uuid),
                "pk": str(project.uuid),
            },
        )

        project_uuid = project.uuid

        response = client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Verify project was deleted
        assert not Project.objects.filter(uuid=project_uuid).exists()

    def test_delete_project_deletes_api_keys(
        self, user_token, project, project_api_key, organization_membership
    ) -> None:
        """Test that deleting project also deletes associated API keys."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse(
            "project-detail",
            kwargs={
                "parent_lookup_organization": str(project.organization.uuid),
                "pk": str(project.uuid),
            },
        )

        # Verify API key exists
        assert ProjectApiKey.objects.filter(project=project).exists()

        response = client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Verify API key was deleted
        assert not ProjectApiKey.objects.filter(project_id=project.uuid).exists()

    def test_delete_project_from_different_org(
        self, user_token, other_project
    ) -> None:
        """Test that user cannot delete project from different organization."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse(
            "project-detail",
            kwargs={
                "parent_lookup_organization": str(other_project.organization.uuid),
                "pk": str(other_project.uuid),
            },
        )

        response = client.delete(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN

        # Verify project was not deleted
        assert Project.objects.filter(uuid=other_project.uuid).exists()

    def test_delete_nonexistent_project(
        self, user_token, organization, organization_membership
    ) -> None:
        """Test that deleting nonexistent project returns 404."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse(
            "project-detail",
            kwargs={
                "parent_lookup_organization": str(organization.uuid),
                "pk": "00000000-0000-0000-0000-000000000000",
            },
        )

        response = client.delete(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_delete_project_without_authentication(self, project) -> None:
        """Test that project deletion requires authentication."""
        client = APIClient()
        url = reverse(
            "project-detail",
            kwargs={
                "parent_lookup_organization": str(project.organization.uuid),
                "pk": str(project.uuid),
            },
        )

        response = client.delete(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestProjectGenerateApiKey:
    """Test suite for project API key generation endpoint."""

    def test_generate_api_key(
        self, user_token, project, organization_membership
    ) -> None:
        """Test generating an API key for a project."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("organization-project-generate-api-key",
            kwargs={
                "parent_lookup_organization": str(project.organization.uuid),
                "pk": str(project.uuid),
            },
        )

        response = client.post(url, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert "api_key" in response.data
        assert response.data["api_key"].startswith("sk_proj")

        # Verify API key was created
        assert ProjectApiKey.objects.filter(project=project).exists()

    def test_generate_api_key_replaces_existing(
        self, user_token, project, project_api_key, organization_membership
    ) -> None:
        """Test that generating new API key replaces existing one."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("organization-project-generate-api-key",
            kwargs={
                "parent_lookup_organization": str(project.organization.uuid),
                "pk": str(project.uuid),
            },
        )

        # Get initial count and key
        initial_count = ProjectApiKey.objects.filter(project=project).count()
        assert initial_count == 1

        response = client.post(url, format="json")

        assert response.status_code == status.HTTP_200_OK

        # Verify only one API key exists (old one was replaced)
        final_count = ProjectApiKey.objects.filter(project=project).count()
        assert final_count == 1

    def test_generate_api_key_for_different_org_project(
        self, user_token, other_project
    ) -> None:
        """Test that user cannot generate API key for project in different organization."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("organization-project-generate-api-key",
            kwargs={
                "parent_lookup_organization": str(other_project.organization.uuid),
                "pk": str(other_project.uuid),
            },
        )

        response = client.post(url, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_generate_api_key_for_nonexistent_project(
        self, user_token, organization, organization_membership
    ) -> None:
        """Test that generating API key for nonexistent project returns 404."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("organization-project-generate-api-key",
            kwargs={
                "parent_lookup_organization": str(organization.uuid),
                "pk": "00000000-0000-0000-0000-000000000000",
            },
        )

        response = client.post(url, format="json")

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_generate_api_key_without_authentication(self, project) -> None:
        """Test that API key generation requires authentication."""
        client = APIClient()
        url = reverse("organization-project-generate-api-key",
            kwargs={
                "parent_lookup_organization": str(project.organization.uuid),
                "pk": str(project.uuid),
            },
        )

        response = client.post(url, format="json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestProjectList:
    """Test suite for listing projects endpoint."""

    def test_list_projects_in_organization(
        self, user_token, organization, project, organization_membership
    ) -> None:
        """Test listing all projects in an organization."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse(
            "project-list",
            kwargs={"parent_lookup_organization": str(organization.uuid)},
        )

        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1
        assert any(p["uuid"] == str(project.uuid) for p in response.data)

    def test_list_projects_only_shows_org_projects(
        self,
        user_token,
        organization,
        project,
        other_project,
        organization_membership,
    ) -> None:
        """Test that listing projects only shows projects from specified organization."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse(
            "project-list",
            kwargs={"parent_lookup_organization": str(organization.uuid)},
        )

        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        project_uuids = [p["uuid"] for p in response.data]
        assert str(project.uuid) in project_uuids
        assert str(other_project.uuid) not in project_uuids

    def test_list_projects_without_membership(
        self, user_token, other_organization
    ) -> None:
        """Test that user cannot list projects from organization they're not a member of."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse(
            "project-list",
            kwargs={"parent_lookup_organization": str(other_organization.uuid)},
        )

        response = client.get(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_list_projects_without_authentication(self, organization) -> None:
        """Test that listing projects requires authentication."""
        client = APIClient()
        url = reverse(
            "project-list",
            kwargs={"parent_lookup_organization": str(organization.uuid)},
        )

        response = client.get(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
