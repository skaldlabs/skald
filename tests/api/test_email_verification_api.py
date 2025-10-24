import pytest
from datetime import timedelta
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from unittest.mock import patch

from skald.models.user import EmailVerificationCode


@pytest.mark.django_db
class TestSendVerificationCode:
    """Test suite for sending email verification code."""

    @patch("skald.api.email_verification_api.send_email")
    def test_send_verification_code(self, mock_send_email, user_token, user) -> None:
        """Test sending verification code to unverified user."""
        # Ensure user is not verified
        user.email_verified = False
        user.save()

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("verifyemail-send")

        response = client.post(url, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["success"] is True

        # Verify code was created
        code = EmailVerificationCode.objects.filter(user=user).first()
        assert code is not None
        assert len(code.code) == 6

        # Verify email was sent
        mock_send_email.assert_called_once()

    @patch("skald.api.email_verification_api.send_email")
    def test_send_verification_code_to_verified_user(
        self, mock_send_email, user_token, user
    ) -> None:
        """Test that verified users cannot request verification code."""
        # Ensure user is verified
        user.email_verified = True
        user.save()

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("verifyemail-send")

        response = client.post(url, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["success"] is False

        # Verify email was not sent
        mock_send_email.assert_not_called()

    @patch("skald.api.email_verification_api.send_email")
    def test_send_verification_code_rate_limiting(
        self, mock_send_email, user_token, user
    ) -> None:
        """Test that users must wait 5 minutes between code requests."""
        # Ensure user is not verified
        user.email_verified = False
        user.save()

        # Create recent verification code
        EmailVerificationCode.objects.create(
            user=user,
            code="123456",
            expires_at=timezone.now() + timedelta(minutes=10),
        )

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("verifyemail-send")

        response = client.post(url, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["success"] is False
        assert "wait 5 minutes" in response.data["message"].lower()

    @patch("skald.api.email_verification_api.send_email")
    def test_send_verification_code_after_waiting_period(
        self, mock_send_email, user_token, user
    ) -> None:
        """Test that users can request new code after 5 minutes."""
        # Ensure user is not verified
        user.email_verified = False
        user.save()

        # Create old verification code (> 5 minutes ago)
        old_code = EmailVerificationCode.objects.create(
            user=user,
            code="123456",
            expires_at=timezone.now() + timedelta(minutes=10),
        )
        # Manually set created_at to 6 minutes ago
        old_code.created_at = timezone.now() - timedelta(minutes=6)
        old_code.save()

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("verifyemail-send")

        response = client.post(url, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["success"] is True

    def test_send_verification_code_without_authentication(self) -> None:
        """Test that sending verification code requires authentication."""
        client = APIClient()
        url = reverse("verifyemail-send")

        response = client.post(url, format="json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestVerifyCode:
    """Test suite for verifying email verification code."""

    def test_verify_with_valid_code(self, user_token, user) -> None:
        """Test verifying email with valid code."""
        # Ensure user is not verified
        user.email_verified = False
        user.save()

        # Create verification code
        code = EmailVerificationCode.objects.create(
            user=user,
            code="123456",
            expires_at=timezone.now() + timedelta(minutes=10),
        )

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("verifyemail-verify")

        data = {
            "code": "123456",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["success"] is True

        # Verify user is now verified
        user.refresh_from_db()
        assert user.email_verified is True

        # Verify code was deleted
        assert not EmailVerificationCode.objects.filter(id=code.id).exists()

    def test_verify_with_invalid_code(self, user_token, user) -> None:
        """Test that invalid code returns 400."""
        # Ensure user is not verified
        user.email_verified = False
        user.save()

        # Create verification code
        EmailVerificationCode.objects.create(
            user=user,
            code="123456",
            expires_at=timezone.now() + timedelta(minutes=10),
        )

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("verifyemail-verify")

        data = {
            "code": "wrong",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["success"] is False

        # Verify user is still not verified
        user.refresh_from_db()
        assert user.email_verified is False

    def test_verify_with_expired_code(self, user_token, user) -> None:
        """Test that expired code returns 400."""
        # Ensure user is not verified
        user.email_verified = False
        user.save()

        # Create expired verification code
        EmailVerificationCode.objects.create(
            user=user,
            code="123456",
            expires_at=timezone.now() - timedelta(minutes=1),
        )

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("verifyemail-verify")

        data = {
            "code": "123456",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["success"] is False

        # Verify user is still not verified
        user.refresh_from_db()
        assert user.email_verified is False

    def test_verify_missing_code(self, user_token) -> None:
        """Test that missing code returns 400."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("verifyemail-verify")

        data = {}

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_verify_empty_code(self, user_token) -> None:
        """Test that empty code returns 400."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("verifyemail-verify")

        data = {
            "code": "",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_verify_with_too_many_attempts(self, user_token, user) -> None:
        """Test that too many failed attempts invalidate the code."""
        # Ensure user is not verified
        user.email_verified = False
        user.save()

        # Create verification code with 3 attempts already
        code = EmailVerificationCode.objects.create(
            user=user,
            code="123456",
            expires_at=timezone.now() + timedelta(minutes=10),
            attempts=3,
        )

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("verifyemail-verify")

        data = {
            "code": "123456",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["success"] is False
        assert "too many" in response.data["message"].lower()

        # Verify code was deleted
        assert not EmailVerificationCode.objects.filter(id=code.id).exists()

    def test_verify_without_authentication(self) -> None:
        """Test that verifying code requires authentication."""
        client = APIClient()
        url = reverse("verifyemail-verify")

        data = {
            "code": "123456",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
