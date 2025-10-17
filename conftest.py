from unittest.mock import patch

import pytest
from rest_framework.authtoken.models import Token

from skald.models.organization import Organization
from skald.models.project import Project, ProjectApiKey
from skald.models.user import OrganizationMembership, User
from skald.utils.api_key_utils import generate_api_key, hash_api_key


@pytest.fixture(autouse=True)
def disable_ssl_redirects(settings):
    """Disable SSL redirects for all tests."""
    settings.SECURE_SSL_REDIRECT = False


@pytest.fixture(autouse=True)
def mock_async_processing():
    """Mock async processing (Redis/SQS) for all tests."""
    with patch("skald.flows.process_memo.process_memo.send_memo_for_async_processing"):
        yield


@pytest.fixture(autouse=True)
def mock_voyage_embeddings():
    """Mock Voyage AI embedding generation for all tests."""
    with patch("skald.embeddings.generate_embedding._get_voyage_client"):
        yield


@pytest.fixture
def user(db):
    """Create a test user."""
    return User.objects.create_user(
        email="test@example.com",
        password="testpass123",
        email_verified=True,
    )


@pytest.fixture
def other_user(db):
    """Create another test user without access to the main project."""
    return User.objects.create_user(
        email="other@example.com",
        password="testpass123",
        email_verified=True,
    )


@pytest.fixture
def organization(db, user):
    """Create a test organization."""
    return Organization.objects.create(
        name="Test Organization",
        owner=user,
    )


@pytest.fixture
def other_organization(db, other_user):
    """Create another test organization."""
    return Organization.objects.create(
        name="Other Organization",
        owner=other_user,
    )


@pytest.fixture
def organization_membership(db, user, organization):
    """Create organization membership for user."""
    return OrganizationMembership.objects.create(
        user=user,
        organization=organization,
    )


@pytest.fixture
def other_organization_membership(db, other_user, other_organization):
    """Create organization membership for other_user."""
    return OrganizationMembership.objects.create(
        user=other_user,
        organization=other_organization,
    )


@pytest.fixture
def project(db, organization, user, organization_membership):
    """Create a test project."""
    return Project.objects.create(
        name="Test Project",
        organization=organization,
        owner=user,
    )


@pytest.fixture
def other_project(db, other_organization, other_user, other_organization_membership):
    """Create another test project in a different organization."""
    return Project.objects.create(
        name="Other Project",
        organization=other_organization,
        owner=other_user,
    )


@pytest.fixture
def project_api_key(db, project):
    """Create a project API key and return both the key and the hash."""
    api_key = generate_api_key("sk_proj")
    api_key_hash = hash_api_key(api_key)
    ProjectApiKey.objects.create(
        api_key_hash=api_key_hash,
        project=project,
        first_12_digits=api_key[:12],
    )
    # Return the plain API key for testing
    return api_key


@pytest.fixture
def user_token(db, user):
    """Create an auth token for the user."""
    token, _ = Token.objects.get_or_create(user=user)
    return token.key


@pytest.fixture
def other_user_token(db, other_user):
    """Create an auth token for the other user."""
    token, _ = Token.objects.get_or_create(user=other_user)
    return token.key
