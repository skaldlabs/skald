import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token

from skald.models.user import User


@pytest.mark.django_db
class TestUserSignup:
    """Test suite for user signup endpoint."""

    def test_signup_with_valid_email_password(self) -> None:
        """Test creating a user with valid email and password."""
        client = APIClient()
        url = reverse("user-list")

        data = {
            "email": "newuser@example.com",
            "password": "SecurePass123!",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        # Token should no longer be in response body (security improvement)
        assert "token" not in response.data
        assert "user" in response.data
        assert response.data["user"]["email"] == "newuser@example.com"
        assert response.data["user"]["email_verified"] is False

        # Verify httpOnly cookie was set
        assert "authToken" in response.cookies
        cookie = response.cookies["authToken"]
        assert cookie["httponly"] is True
        assert cookie["samesite"] == "Lax"

        # Verify user was created
        user = User.objects.filter(email="newuser@example.com").first()
        assert user is not None
        assert user.check_password("SecurePass123!")

    def test_signup_with_uppercase_email(self) -> None:
        """Test that email is normalized to lowercase."""
        client = APIClient()
        url = reverse("user-list")

        data = {
            "email": "NewUser@EXAMPLE.COM",
            "password": "SecurePass123!",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["user"]["email"] == "newuser@example.com"

        user = User.objects.filter(email="newuser@example.com").first()
        assert user is not None

    def test_signup_with_whitespace_in_email(self) -> None:
        """Test that email whitespace is stripped."""
        client = APIClient()
        url = reverse("user-list")

        data = {
            "email": "  user@example.com  ",
            "password": "SecurePass123!",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["user"]["email"] == "user@example.com"

    def test_signup_with_duplicate_email(self) -> None:
        """Test that duplicate email returns 400, not 500."""
        User.objects.create_user(
            email="existing@example.com", password="password123"
        )

        client = APIClient()
        url = reverse("user-list")

        data = {
            "email": "existing@example.com",
            "password": "SecurePass123!",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_signup_missing_email(self) -> None:
        """Test that missing email returns 400."""
        client = APIClient()
        url = reverse("user-list")

        data = {
            "password": "SecurePass123!",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_signup_missing_password(self) -> None:
        """Test that missing password returns 400."""
        client = APIClient()
        url = reverse("user-list")

        data = {
            "email": "user@example.com",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_signup_with_empty_email(self) -> None:
        """Test that empty email returns 400."""
        client = APIClient()
        url = reverse("user-list")

        data = {
            "email": "",
            "password": "SecurePass123!",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_signup_with_empty_password(self) -> None:
        """Test that empty password returns 400."""
        client = APIClient()
        url = reverse("user-list")

        data = {
            "email": "user@example.com",
            "password": "",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestUserLogin:
    """Test suite for user login endpoint."""

    def test_login_with_valid_credentials(self, user) -> None:
        """Test login with correct email and password."""
        client = APIClient()
        url = reverse("user-login")

        data = {
            "email": "test@example.com",
            "password": "testpass123",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        # Token should no longer be in response body (security improvement)
        assert "token" not in response.data
        assert "user" in response.data
        assert response.data["user"]["email"] == "test@example.com"

        # Verify httpOnly cookie was set
        assert "authToken" in response.cookies
        cookie = response.cookies["authToken"]
        assert cookie["httponly"] is True
        assert cookie["samesite"] == "Lax"

    def test_login_with_uppercase_email(self, user) -> None:
        """Test that login works with uppercase email."""
        client = APIClient()
        url = reverse("user-login")

        data = {
            "email": "TEST@EXAMPLE.COM",
            "password": "testpass123",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["user"]["email"] == "test@example.com"

    def test_login_with_whitespace_in_email(self, user) -> None:
        """Test that login works with whitespace in email."""
        client = APIClient()
        url = reverse("user-login")

        data = {
            "email": "  test@example.com  ",
            "password": "testpass123",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK

    def test_login_with_wrong_password(self, user) -> None:
        """Test that wrong password returns 400, not 500."""
        client = APIClient()
        url = reverse("user-login")

        data = {
            "email": "test@example.com",
            "password": "wrongpassword",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "error" in response.data
        assert response.data["error"] == "Invalid Credentials"

    def test_login_with_nonexistent_user(self) -> None:
        """Test that nonexistent user returns 400."""
        client = APIClient()
        url = reverse("user-login")

        data = {
            "email": "nonexistent@example.com",
            "password": "password123",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["error"] == "Invalid Credentials"

    def test_login_missing_email(self) -> None:
        """Test that missing email returns 400."""
        client = APIClient()
        url = reverse("user-login")

        data = {
            "password": "password123",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_missing_password(self, user) -> None:
        """Test that missing password returns 400."""
        client = APIClient()
        url = reverse("user-login")

        data = {
            "email": "test@example.com",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_with_empty_credentials(self) -> None:
        """Test that empty credentials return 400."""
        client = APIClient()
        url = reverse("user-login")

        data = {
            "email": "",
            "password": "",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestUserLogout:
    """Test suite for user logout endpoint."""

    def test_logout_with_valid_token(self, user_token, user) -> None:
        """Test logout deletes the auth token."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("user-logout")

        response = client.post(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Verify httpOnly cookie was deleted
        assert "authToken" in response.cookies
        assert response.cookies["authToken"].value == ""

        # Verify token was deleted
        assert not Token.objects.filter(user=user).exists()

    def test_logout_without_authentication(self) -> None:
        """Test that logout requires authentication."""
        client = APIClient()
        url = reverse("user-logout")

        response = client.post(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestCookieBasedAuthentication:
    """Test suite for cookie-based authentication via middleware."""

    def test_authentication_via_cookie(self, user, user_token) -> None:
        """Test that authentication works via httpOnly cookie."""
        client = APIClient()
        # Set the cookie instead of using Authorization header
        client.cookies["authToken"] = user_token
        url = reverse("user-details")

        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["email"] == "test@example.com"

    def test_authentication_via_cookie_with_invalid_token(self) -> None:
        """Test that invalid cookie token returns 401."""
        client = APIClient()
        # Set an invalid cookie
        client.cookies["authToken"] = "invalid-token-12345"
        url = reverse("user-details")

        response = client.get(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_authentication_header_takes_precedence(self, user, user_token) -> None:
        """Test that Authorization header takes precedence over cookie."""
        client = APIClient()
        # Set both cookie and header - header should win
        client.cookies["authToken"] = "invalid-token-12345"
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("user-details")

        response = client.get(url)

        # Should succeed because header is valid
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestUserDetails:
    """Test suite for user details endpoint."""

    def test_get_user_details(self, user_token) -> None:
        """Test getting authenticated user details."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("user-details")

        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["email"] == "test@example.com"
        assert "password" not in response.data

    def test_get_user_details_without_authentication(self) -> None:
        """Test that user details requires authentication."""
        client = APIClient()
        url = reverse("user-details")

        response = client.get(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestChangePassword:
    """Test suite for change password endpoint."""

    def test_change_password_with_valid_credentials(self, user_token, user) -> None:
        """Test changing password with correct old password."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("user-change-password")

        data = {
            "old_password": "testpass123",
            "new_password": "NewSecurePass456!",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK

        # Verify password was changed
        user.refresh_from_db()
        assert user.check_password("NewSecurePass456!")
        assert not user.check_password("testpass123")

    def test_change_password_with_wrong_old_password(self, user_token) -> None:
        """Test that wrong old password returns 400."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("user-change-password")

        data = {
            "old_password": "wrongpassword",
            "new_password": "NewSecurePass456!",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "old_password" in response.data

    def test_change_password_missing_old_password(self, user_token) -> None:
        """Test that missing old_password returns 400."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("user-change-password")

        data = {
            "new_password": "NewSecurePass456!",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_change_password_missing_new_password(self, user_token) -> None:
        """Test that missing new_password returns 400."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("user-change-password")

        data = {
            "old_password": "testpass123",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_change_password_without_authentication(self) -> None:
        """Test that change password requires authentication."""
        client = APIClient()
        url = reverse("user-change-password")

        data = {
            "old_password": "testpass123",
            "new_password": "NewSecurePass456!",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestSetCurrentProject:
    """Test suite for set current project endpoint."""

    def test_set_current_project_valid(
        self, user_token, user, project, organization_membership
    ) -> None:
        """Test setting current project to a valid project."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("user-set-current-project")

        data = {
            "project_uuid": str(project.uuid),
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["current_project"] == str(project.uuid)

        # Verify user's current project was updated
        user.refresh_from_db()
        assert user.current_project == project

    def test_set_current_project_missing_uuid(self, user_token) -> None:
        """Test that missing project_uuid returns 400."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("user-set-current-project")

        data = {}

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "error" in response.data

    def test_set_current_project_nonexistent(self, user_token) -> None:
        """Test that nonexistent project returns 404."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("user-set-current-project")

        data = {
            "project_uuid": "00000000-0000-0000-0000-000000000000",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_set_current_project_from_different_org(
        self, user_token, other_project, organization_membership
    ) -> None:
        """Test that user cannot set project from different organization."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("user-set-current-project")

        data = {
            "project_uuid": str(other_project.uuid),
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "error" in response.data

    def test_set_current_project_without_authentication(self) -> None:
        """Test that set current project requires authentication."""
        client = APIClient()
        url = reverse("user-set-current-project")

        data = {
            "project_uuid": "00000000-0000-0000-0000-000000000000",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
