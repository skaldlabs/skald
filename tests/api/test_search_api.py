from unittest.mock import MagicMock, patch

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from skald.models.memo import Memo, MemoChunk, MemoContent, MemoSummary, MemoTag
from skald.models.organization import Organization
from skald.models.project import Project, ProjectApiKey
from skald.models.user import OrganizationMembership, OrganizationMembershipRole
from skald.utils.api_key_utils import generate_api_key, hash_api_key

User = get_user_model()


@pytest.fixture
def user() -> User:
    """Create a test user."""
    return User.objects.create_user(
        email="test@example.com",
        password="testpass123",
    )


@pytest.fixture
def other_user() -> User:
    """Create another test user without access."""
    return User.objects.create_user(
        email="other@example.com",
        password="testpass123",
    )


@pytest.fixture
def organization(user: User) -> Organization:
    """Create a test organization."""
    return Organization.objects.create(
        name="Test Organization",
        owner=user,
    )


@pytest.fixture
def other_organization(other_user: User) -> Organization:
    """Create another organization."""
    return Organization.objects.create(
        name="Other Organization",
        owner=other_user,
    )


@pytest.fixture
def organization_membership(user: User, organization: Organization):
    """Create organization membership for user."""
    return OrganizationMembership.objects.create(
        user=user,
        organization=organization,
        access_level=OrganizationMembershipRole.MEMBER,
    )


@pytest.fixture
def project(organization: Organization, user: User) -> Project:
    """Create a test project."""
    return Project.objects.create(
        name="Test Project",
        organization=organization,
        owner=user,
    )


@pytest.fixture
def other_project(other_organization: Organization, other_user: User) -> Project:
    """Create a project the main user doesn't have access to."""
    return Project.objects.create(
        name="Other Project",
        organization=other_organization,
        owner=other_user,
    )


@pytest.fixture
def api_key_and_hash(project: Project) -> tuple[str, str]:
    """Generate an API key and create a ProjectApiKey record."""
    api_key = generate_api_key("sk_proj")
    api_key_hash = hash_api_key(api_key)
    ProjectApiKey.objects.create(
        api_key_hash=api_key_hash,
        project=project,
        first_12_digits=api_key[:12],
    )
    return api_key, api_key_hash


@pytest.fixture
def memo(project: Project) -> Memo:
    """Create a test memo."""
    memo = Memo.objects.create(
        title="Test Memo Title",
        content_length=100,
        content_hash="test_hash",
        project=project,
        pending=False,
    )
    MemoContent.objects.create(
        memo=memo,
        content="This is test content for the memo. It contains searchable text.",
    )
    MemoSummary.objects.create(
        memo=memo,
        summary="Test summary",
        embedding=[0.1] * 2048,
    )
    return memo


@pytest.fixture
def memo_with_chunk(project: Project) -> Memo:
    """Create a test memo with chunk."""
    memo = Memo.objects.create(
        title="Another Test Memo",
        content_length=100,
        content_hash="test_hash_2",
        project=project,
        pending=False,
    )
    MemoContent.objects.create(
        memo=memo,
        content="This is another test content for the memo.",
    )
    MemoSummary.objects.create(
        memo=memo,
        summary="Another test summary",
        embedding=[0.2] * 2048,
    )
    MemoChunk.objects.create(
        memo=memo,
        chunk_content="Chunk content",
        chunk_index=0,
        embedding=[0.3] * 2048,
    )
    return memo


@pytest.fixture
def memo_with_tag(project: Project) -> Memo:
    """Create a test memo with a tag."""
    memo = Memo.objects.create(
        title="Tagged Memo",
        content_length=50,
        content_hash="test_hash_3",
        project=project,
        pending=False,
    )
    MemoContent.objects.create(
        memo=memo,
        content="Tagged content",
    )
    MemoSummary.objects.create(
        memo=memo,
        summary="Tagged summary",
        embedding=[0.4] * 2048,
    )
    MemoTag.objects.create(
        memo=memo,
        tag="important",
    )
    return memo


@pytest.mark.django_db
class TestSearchAPIKeyAuthentication:
    """Test suite for API key-based authentication."""

    def test_search_with_valid_api_key_succeeds(
        self, api_key_and_hash: tuple[str, str], memo: Memo
    ) -> None:
        """Test that accessing the search API with a valid API key succeeds."""
        api_key, _ = api_key_and_hash
        client = APIClient()
        url = reverse("search")
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {api_key}")
        response = client.post(
            url,
            {"query": "test", "search_method": "title_contains"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK

    def test_search_with_invalid_api_key_returns_403(self) -> None:
        """Test that accessing the search API with an invalid API key returns 403."""
        client = APIClient()
        url = reverse("search")
        client.credentials(HTTP_AUTHORIZATION="Bearer invalid_key")
        response = client.post(
            url,
            {"query": "test", "search_method": "title_contains"},
            format="json",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "detail" in response.data
        assert "Invalid API key" in response.data["detail"]

    def test_api_key_auth_returns_correct_project_memos(
        self, api_key_and_hash: tuple[str, str], memo: Memo, other_project: Project
    ) -> None:
        """Test that API key auth only returns memos from the correct project."""
        # Create a memo in another project
        other_memo = Memo.objects.create(
            title="Other Project Memo",
            content_length=50,
            content_hash="other_hash",
            project=other_project,
            pending=False,
        )
        MemoContent.objects.create(memo=other_memo, content="Other content")
        MemoSummary.objects.create(
            memo=other_memo, summary="Other summary", embedding=[0.5] * 2048
        )

        api_key, _ = api_key_and_hash
        client = APIClient()
        url = reverse("search")
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {api_key}")
        response = client.post(
            url,
            {"query": "memo", "search_method": "title_contains"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        # Should only return memos from the authenticated project
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["title"] == "Test Memo Title"


@pytest.mark.django_db
class TestSearchSessionAuthentication:
    """Test suite for session-based authentication."""

    def test_search_with_session_auth_and_project_id_succeeds(
        self, user: User, organization_membership, project: Project, memo: Memo
    ) -> None:
        """Test that session auth with project_id works."""
        client = APIClient()
        client.force_authenticate(user=user, token=project)
        url = reverse("search")
        response = client.post(
            url,
            {
                "query": "test",
                "search_method": "title_contains",
                "project_id": str(project.uuid),
            },
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1

    def test_search_with_session_auth_without_project_id_returns_403(
        self, user: User, organization_membership, project: Project
    ) -> None:
        """Test that session auth without project_id returns 403."""
        client = APIClient()
        client.force_authenticate(user=user, token=None)
        url = reverse("search")
        response = client.post(
            url,
            {"query": "test", "search_method": "title_contains"},
            format="json",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "detail" in response.data

    def test_search_with_session_auth_invalid_project_id_returns_403(
        self, user: User, organization_membership
    ) -> None:
        """Test that session auth with invalid project_id returns 403."""
        client = APIClient()
        client.force_authenticate(user=user, token=None)
        url = reverse("search")
        response = client.post(
            url,
            {
                "query": "test",
                "search_method": "title_contains",
                "project_id": "00000000-0000-0000-0000-000000000000",
            },
            format="json",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "detail" in response.data

    def test_search_session_auth_without_org_access_returns_403(
        self, user: User, other_project: Project
    ) -> None:
        """Test that user without org access cannot search project."""
        client = APIClient()
        client.force_authenticate(user=user, token=None)
        url = reverse("search")
        response = client.post(
            url,
            {
                "query": "test",
                "search_method": "title_contains",
                "project_id": str(other_project.uuid),
            },
            format="json",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "detail" in response.data

    def test_session_auth_returns_correct_project_memos(
        self,
        user: User,
        organization_membership,
        project: Project,
        memo: Memo,
        other_project: Project,
    ) -> None:
        """Test that session auth only returns memos from the specified project."""
        # Create a memo in another project
        other_memo = Memo.objects.create(
            title="Other Project Memo",
            content_length=50,
            content_hash="other_hash",
            project=other_project,
            pending=False,
        )
        MemoContent.objects.create(memo=other_memo, content="Other content")
        MemoSummary.objects.create(
            memo=other_memo, summary="Other summary", embedding=[0.5] * 2048
        )

        client = APIClient()
        client.force_authenticate(user=user, token=project)
        url = reverse("search")
        response = client.post(
            url,
            {
                "query": "memo",
                "search_method": "title_contains",
                "project_id": str(project.uuid),
            },
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        # Should only return memos from the specified project
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["title"] == "Test Memo Title"


@pytest.mark.django_db
class TestSearchNoAuthentication:
    """Test suite for requests without authentication."""

    def test_search_without_any_auth_returns_403(self) -> None:
        """Test that accessing search without any authentication returns 403."""
        client = APIClient()
        url = reverse("search")
        response = client.post(
            url,
            {"query": "test", "search_method": "title_contains"},
            format="json",
        )

        # Without authentication, get_project() raises PermissionDenied
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "detail" in response.data


@pytest.mark.django_db
class TestSearchAPIValidation:
    """Test suite for search API input validation."""

    def test_search_without_query_returns_400(
        self, api_key_and_hash: tuple[str, str]
    ) -> None:
        """Test that searching without a query returns 400."""
        api_key, _ = api_key_and_hash
        client = APIClient()
        url = reverse("search")
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {api_key}")
        response = client.post(
            url,
            {"search_method": "title_contains"},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "error" in response.data
        assert "Query is required" in response.data["error"]

    def test_search_without_search_method_returns_400(
        self, api_key_and_hash: tuple[str, str]
    ) -> None:
        """Test that searching without a search method returns 400."""
        api_key, _ = api_key_and_hash
        client = APIClient()
        url = reverse("search")
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {api_key}")
        response = client.post(
            url,
            {"query": "test"},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "error" in response.data
        assert "Search method is required" in response.data["error"]

    def test_search_with_invalid_search_method_returns_400(
        self, api_key_and_hash: tuple[str, str]
    ) -> None:
        """Test that searching with an invalid search method returns 400."""
        api_key, _ = api_key_and_hash
        client = APIClient()
        url = reverse("search")
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {api_key}")
        response = client.post(
            url,
            {"query": "test", "search_method": "invalid_method"},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "error" in response.data
        assert "must be one of" in response.data["error"]

    def test_search_with_limit_over_50_returns_400(
        self, api_key_and_hash: tuple[str, str]
    ) -> None:
        """Test that searching with limit > 50 returns 400."""
        api_key, _ = api_key_and_hash
        client = APIClient()
        url = reverse("search")
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {api_key}")
        response = client.post(
            url,
            {"query": "test", "search_method": "title_contains", "limit": 51},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "error" in response.data
        assert "Limit must be less than or equal to 50" in response.data["error"]


@pytest.mark.django_db
class TestSearchAPITitleContains:
    """Test suite for title_contains search method."""

    def test_title_contains_search_finds_matching_memo(
        self, api_key_and_hash: tuple[str, str], memo: Memo
    ) -> None:
        """Test that title_contains finds memos with matching titles."""
        api_key, _ = api_key_and_hash
        client = APIClient()
        url = reverse("search")
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {api_key}")
        response = client.post(
            url,
            {"query": "test", "search_method": "title_contains"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.data
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["title"] == "Test Memo Title"
        assert response.data["results"][0]["uuid"] == str(memo.uuid)

    def test_title_contains_search_is_case_insensitive(
        self, api_key_and_hash: tuple[str, str], memo: Memo
    ) -> None:
        """Test that title_contains search is case insensitive."""
        api_key, _ = api_key_and_hash
        client = APIClient()
        url = reverse("search")
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {api_key}")
        response = client.post(
            url,
            {"query": "TEST", "search_method": "title_contains"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1

    def test_title_contains_returns_empty_for_no_matches(
        self, api_key_and_hash: tuple[str, str], memo: Memo
    ) -> None:
        """Test that title_contains returns empty results when no matches found."""
        api_key, _ = api_key_and_hash
        client = APIClient()
        url = reverse("search")
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {api_key}")
        response = client.post(
            url,
            {"query": "nonexistent", "search_method": "title_contains"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 0

    def test_title_contains_respects_limit(
        self, api_key_and_hash: tuple[str, str], memo: Memo, memo_with_chunk: Memo
    ) -> None:
        """Test that title_contains respects the limit parameter."""
        api_key, _ = api_key_and_hash
        client = APIClient()
        url = reverse("search")
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {api_key}")
        response = client.post(
            url,
            {"query": "test", "search_method": "title_contains", "limit": 1},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1


@pytest.mark.django_db
class TestSearchAPITitleStartsWith:
    """Test suite for title_startswith search method."""

    def test_title_startswith_finds_matching_memo(
        self, api_key_and_hash: tuple[str, str], memo: Memo
    ) -> None:
        """Test that title_startswith finds memos with matching title prefix."""
        api_key, _ = api_key_and_hash
        client = APIClient()
        url = reverse("search")
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {api_key}")
        response = client.post(
            url,
            {"query": "Test", "search_method": "title_startswith"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["title"] == "Test Memo Title"

    def test_title_startswith_does_not_match_middle_word(
        self, api_key_and_hash: tuple[str, str], memo: Memo
    ) -> None:
        """Test that title_startswith does not match words in the middle."""
        api_key, _ = api_key_and_hash
        client = APIClient()
        url = reverse("search")
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {api_key}")
        response = client.post(
            url,
            {"query": "Memo", "search_method": "title_startswith"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 0


@pytest.mark.django_db
class TestSearchAPIVectorSearch:
    """Test suite for vector search methods."""

    @patch("skald.api.search_api.generate_vector_embedding_for_search")
    @patch("skald.api.search_api.memo_summary_vector_search")
    def test_summary_vector_search_calls_embedding_function(
        self,
        mock_vector_search: MagicMock,
        mock_generate_embedding: MagicMock,
        api_key_and_hash: tuple[str, str],
        memo: Memo,
    ) -> None:
        """Test that summary_vector_search calls the embedding generation function."""
        api_key, _ = api_key_and_hash
        mock_embedding = [0.5] * 2048
        mock_generate_embedding.return_value = mock_embedding
        mock_vector_search.return_value = []

        client = APIClient()
        url = reverse("search")
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {api_key}")
        response = client.post(
            url,
            {"query": "test query", "search_method": "summary_vector_search"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        mock_generate_embedding.assert_called_once_with("test query")
        mock_vector_search.assert_called_once()

    @patch("skald.api.search_api.generate_vector_embedding_for_search")
    @patch("skald.api.search_api.memo_summary_vector_search")
    def test_summary_vector_search_returns_results(
        self,
        mock_vector_search: MagicMock,
        mock_generate_embedding: MagicMock,
        api_key_and_hash: tuple[str, str],
        memo: Memo,
    ) -> None:
        """Test that summary_vector_search returns properly formatted results."""
        api_key, _ = api_key_and_hash
        mock_embedding = [0.5] * 2048
        mock_generate_embedding.return_value = mock_embedding

        memo_summary = memo.memosummary_set.first()
        mock_vector_search.return_value = [{"summary": memo_summary, "distance": 0.15}]

        client = APIClient()
        url = reverse("search")
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {api_key}")
        response = client.post(
            url,
            {"query": "test query", "search_method": "summary_vector_search"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1
        result = response.data["results"][0]
        assert result["title"] == memo.title
        assert result["uuid"] == str(memo.uuid)
        assert result["summary"] == memo_summary.summary
        assert result["distance"] == 0.15

    @patch("skald.api.search_api.generate_vector_embedding_for_search")
    @patch("skald.api.search_api.memo_chunk_vector_search")
    def test_chunk_vector_search_calls_embedding_function(
        self,
        mock_vector_search: MagicMock,
        mock_generate_embedding: MagicMock,
        api_key_and_hash: tuple[str, str],
        memo_with_chunk: Memo,
    ) -> None:
        """Test that chunk_vector_search calls the embedding generation function."""
        api_key, _ = api_key_and_hash
        mock_embedding = [0.5] * 2048
        mock_generate_embedding.return_value = mock_embedding
        mock_vector_search.return_value = []

        client = APIClient()
        url = reverse("search")
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {api_key}")
        response = client.post(
            url,
            {"query": "test query", "search_method": "chunk_vector_search"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        mock_generate_embedding.assert_called_once_with("test query")
        mock_vector_search.assert_called_once()

    @patch("skald.api.search_api.generate_vector_embedding_for_search")
    @patch("skald.api.search_api.memo_chunk_vector_search")
    def test_chunk_vector_search_returns_results(
        self,
        mock_vector_search: MagicMock,
        mock_generate_embedding: MagicMock,
        api_key_and_hash: tuple[str, str],
        memo_with_chunk: Memo,
    ) -> None:
        """Test that chunk_vector_search returns properly formatted results."""
        api_key, _ = api_key_and_hash
        mock_embedding = [0.5] * 2048
        mock_generate_embedding.return_value = mock_embedding

        memo_chunk = memo_with_chunk.memochunk_set.first()
        mock_vector_search.return_value = [{"chunk": memo_chunk, "distance": 0.25}]

        client = APIClient()
        url = reverse("search")
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {api_key}")
        response = client.post(
            url,
            {"query": "test query", "search_method": "chunk_vector_search"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1
        result = response.data["results"][0]
        assert result["title"] == memo_with_chunk.title
        assert result["uuid"] == str(memo_with_chunk.uuid)
        assert result["distance"] == 0.25


@pytest.mark.django_db
class TestSearchAPITagFiltering:
    """Test suite for tag filtering in search."""

    def test_title_contains_with_tag_filter(
        self,
        api_key_and_hash: tuple[str, str],
        memo: Memo,
        memo_with_tag: Memo,
    ) -> None:
        """Test that title_contains respects tag filtering."""
        api_key, _ = api_key_and_hash
        client = APIClient()
        url = reverse("search")
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {api_key}")
        response = client.post(
            url,
            {
                "query": "memo",
                "search_method": "title_contains",
                "tags": ["important"],
            },
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["title"] == "Tagged Memo"

    @patch("skald.api.search_api.generate_vector_embedding_for_search")
    @patch("skald.api.search_api.memo_summary_vector_search")
    def test_vector_search_passes_tags_to_search_function(
        self,
        mock_vector_search: MagicMock,
        mock_generate_embedding: MagicMock,
        api_key_and_hash: tuple[str, str],
        memo_with_tag: Memo,
    ) -> None:
        """Test that vector search passes tags parameter to search function."""
        api_key, _ = api_key_and_hash
        mock_embedding = [0.5] * 2048
        mock_generate_embedding.return_value = mock_embedding
        mock_vector_search.return_value = []

        client = APIClient()
        url = reverse("search")
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {api_key}")
        response = client.post(
            url,
            {
                "query": "test",
                "search_method": "summary_vector_search",
                "tags": ["important"],
            },
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        # Verify that tags were passed to the search function
        call_args = mock_vector_search.call_args
        assert call_args.kwargs["tags"] == ["important"]


@pytest.mark.django_db
class TestSearchAPIResponseStructure:
    """Test suite for search API response structure."""

    def test_search_response_has_correct_structure(
        self, api_key_and_hash: tuple[str, str], memo: Memo
    ) -> None:
        """Test that search responses have the correct structure."""
        api_key, _ = api_key_and_hash
        client = APIClient()
        url = reverse("search")
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {api_key}")
        response = client.post(
            url,
            {"query": "test", "search_method": "title_contains"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.data
        assert isinstance(response.data["results"], list)

        if len(response.data["results"]) > 0:
            result = response.data["results"][0]
            assert "title" in result
            assert "uuid" in result
            assert "content_snippet" in result
            assert "summary" in result
            assert "distance" in result

    def test_search_result_content_snippet_is_truncated(
        self, api_key_and_hash: tuple[str, str], memo: Memo
    ) -> None:
        """Test that content snippets are truncated to 100 characters."""
        api_key, _ = api_key_and_hash
        client = APIClient()
        url = reverse("search")
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {api_key}")
        response = client.post(
            url,
            {"query": "test", "search_method": "title_contains"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        result = response.data["results"][0]
        assert len(result["content_snippet"]) <= 100

    def test_non_vector_search_has_null_distance(
        self, api_key_and_hash: tuple[str, str], memo: Memo
    ) -> None:
        """Test that non-vector search methods return null distance."""
        api_key, _ = api_key_and_hash
        client = APIClient()
        url = reverse("search")
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {api_key}")
        response = client.post(
            url,
            {"query": "test", "search_method": "title_contains"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        result = response.data["results"][0]
        assert result["distance"] is None
