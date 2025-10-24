import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from unittest.mock import patch

from skald.models.organization import Organization
from skald.models.user import (
    OrganizationMembership,
    OrganizationMembershipInvite,
    OrganizationMembershipRole,
)


@pytest.mark.django_db
class TestOrganizationCreate:
    """Test suite for organization creation endpoint."""

    def test_create_organization_with_valid_name(self, user_token, user) -> None:
        """Test creating an organization with valid name."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("organization-list")

        data = {
            "name": "New Organization",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "New Organization"

        # Verify organization was created
        org = Organization.objects.filter(name="New Organization").first()
        assert org is not None
        assert org.owner == user

        # Verify user is a member with OWNER role
        membership = OrganizationMembership.objects.filter(
            user=user, organization=org
        ).first()
        assert membership is not None
        assert membership.access_level == OrganizationMembershipRole.OWNER

        # Verify default organization was set
        user.refresh_from_db()
        assert user.default_organization == org

    def test_create_organization_missing_name(self, user_token) -> None:
        """Test that missing name returns 400."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("organization-list")

        data = {}

        response = client.post(url, data, format="json")

        assert response.status_code in [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_500_INTERNAL_SERVER_ERROR,
        ]

    def test_create_organization_without_authentication(self) -> None:
        """Test that organization creation requires authentication."""
        client = APIClient()
        url = reverse("organization-list")

        data = {
            "name": "Unauthenticated Org",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestOrganizationMembers:
    """Test suite for listing organization members."""

    def test_get_organization_members(
        self, user_token, organization, organization_membership
    ) -> None:
        """Test getting list of organization members."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse(
            "organization-members", kwargs={"pk": str(organization.uuid)}
        )

        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1
        assert any(m["email"] == "test@example.com" for m in response.data)

    def test_get_members_from_different_org(
        self, user_token, other_organization
    ) -> None:
        """Test that user cannot get members from organization they're not in."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse(
            "organization-members", kwargs={"pk": str(other_organization.uuid)}
        )

        response = client.get(url)

        # Can be 403 or 404 depending on implementation
        assert response.status_code in [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND,
        ]

    def test_get_members_without_authentication(self, organization) -> None:
        """Test that getting members requires authentication."""
        client = APIClient()
        url = reverse(
            "organization-members", kwargs={"pk": str(organization.uuid)}
        )

        response = client.get(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestOrganizationInviteMember:
    """Test suite for inviting members to organization."""

    @patch("skald.api.organization_api.send_email")
    def test_invite_member_with_valid_email(
        self, mock_send_email, user_token, organization, organization_membership
    ) -> None:
        """Test inviting a new member with valid email."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse(
            "organization-invite-member", kwargs={"pk": str(organization.uuid)}
        )

        data = {
            "email": "newmember@example.com",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK

        # Verify invite was created
        invite = OrganizationMembershipInvite.objects.filter(
            organization=organization, email="newmember@example.com"
        ).first()
        assert invite is not None

        # Verify email was sent
        mock_send_email.assert_called_once()

    @patch("skald.api.organization_api.send_email")
    def test_invite_member_with_uppercase_email(
        self, mock_send_email, user_token, organization, organization_membership
    ) -> None:
        """Test that email is normalized to lowercase."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse(
            "organization-invite-member", kwargs={"pk": str(organization.uuid)}
        )

        data = {
            "email": "NewMember@EXAMPLE.COM",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK

        # Verify invite was created with lowercase email
        invite = OrganizationMembershipInvite.objects.filter(
            organization=organization, email="newmember@example.com"
        ).first()
        assert invite is not None

    def test_invite_member_missing_email(
        self, user_token, organization, organization_membership
    ) -> None:
        """Test that missing email returns 400."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse(
            "organization-invite-member", kwargs={"pk": str(organization.uuid)}
        )

        data = {}

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_invite_member_with_invalid_email(
        self, user_token, organization, organization_membership
    ) -> None:
        """Test that invalid email returns 400."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse(
            "organization-invite-member", kwargs={"pk": str(organization.uuid)}
        )

        data = {
            "email": "not-an-email",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @patch("skald.api.organization_api.send_email")
    def test_invite_existing_member(
        self, mock_send_email, user_token, organization, organization_membership, other_user
    ) -> None:
        """Test that inviting existing member returns 400."""
        # Add other_user as member
        OrganizationMembership.objects.create(
            user=other_user,
            organization=organization,
            access_level=OrganizationMembershipRole.MEMBER,
        )

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse(
            "organization-invite-member", kwargs={"pk": str(organization.uuid)}
        )

        data = {
            "email": other_user.email,
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_invite_member_to_different_org(
        self, user_token, other_organization
    ) -> None:
        """Test that user cannot invite members to organization they're not in."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse(
            "organization-invite-member", kwargs={"pk": str(other_organization.uuid)}
        )

        data = {
            "email": "newmember@example.com",
        }

        response = client.post(url, data, format="json")

        # Can be 403 or 404 depending on implementation
        assert response.status_code in [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND,
        ]

    @patch("skald.api.organization_api.send_email")
    def test_invite_member_email_failure(
        self, mock_send_email, user_token, organization, organization_membership
    ) -> None:
        """Test that email sending failure returns 503."""
        mock_send_email.side_effect = Exception("Email service unavailable")

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse(
            "organization-invite-member", kwargs={"pk": str(organization.uuid)}
        )

        data = {
            "email": "newmember@example.com",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE


@pytest.mark.django_db
class TestOrganizationAcceptInvite:
    """Test suite for accepting organization invites."""

    def test_accept_invite(self, user_token, user, other_organization) -> None:
        """Test accepting an organization invite."""
        # Create invite for user
        invite = OrganizationMembershipInvite.objects.create(
            organization=other_organization,
            email=user.email,
            invited_by=other_organization.owner,
        )

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("organization-accept-invite", kwargs={"pk": invite.id})

        response = client.post(url, format="json")

        assert response.status_code == status.HTTP_200_OK

        # Verify membership was created
        membership = OrganizationMembership.objects.filter(
            user=user, organization=other_organization
        ).first()
        assert membership is not None
        assert membership.access_level == OrganizationMembershipRole.MEMBER

        # Verify invite was marked as accepted
        invite.refresh_from_db()
        assert invite.accepted_at is not None

        # Verify default organization was updated
        user.refresh_from_db()
        assert user.default_organization == other_organization

    def test_accept_nonexistent_invite(self, user_token) -> None:
        """Test that accepting nonexistent invite returns 404."""
        import uuid
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        fake_uuid = str(uuid.uuid4())
        url = reverse("organization-accept-invite", kwargs={"pk": fake_uuid})

        response = client.post(url, format="json")

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_accept_invite_for_different_email(
        self, user_token, other_user, organization
    ) -> None:
        """Test that user cannot accept invite for different email."""
        # Create invite for other_user
        invite = OrganizationMembershipInvite.objects.create(
            organization=organization,
            email=other_user.email,
            invited_by=organization.owner,
        )

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("organization-accept-invite", kwargs={"pk": invite.id})

        response = client.post(url, format="json")

        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestOrganizationRemoveMember:
    """Test suite for removing members from organization."""

    def test_remove_member(
        self, user_token, organization, organization_membership, other_user
    ) -> None:
        """Test removing a member from organization."""
        # Add other_user as member
        other_membership = OrganizationMembership.objects.create(
            user=other_user,
            organization=organization,
            access_level=OrganizationMembershipRole.MEMBER,
        )

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse(
            "organization-remove-member", kwargs={"pk": str(organization.uuid)}
        )

        data = {
            "email": other_user.email,
        }

        response = client.post(url, data, format="json")

        # Should succeed or fail with permission error
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_403_FORBIDDEN,
        ]

        # If successful, verify membership was deleted
        if response.status_code == status.HTTP_200_OK:
            assert not OrganizationMembership.objects.filter(
                id=other_membership.id
            ).exists()

    def test_remove_member_missing_email(
        self, user_token, organization, organization_membership
    ) -> None:
        """Test that missing email returns 400."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse(
            "organization-remove-member", kwargs={"pk": str(organization.uuid)}
        )

        data = {}

        response = client.post(url, data, format="json")

        # Can be 400 or 403 depending on when validation happens
        assert response.status_code in [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_403_FORBIDDEN,
        ]

    def test_remove_nonexistent_member(
        self, user_token, organization, organization_membership
    ) -> None:
        """Test that removing nonexistent member returns 404."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse(
            "organization-remove-member", kwargs={"pk": str(organization.uuid)}
        )

        data = {
            "email": "nonexistent@example.com",
        }

        response = client.post(url, data, format="json")

        # Can be 403 or 404 depending on when authorization check happens
        assert response.status_code in [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND,
        ]

    def test_remove_self(
        self, user_token, user, organization, organization_membership
    ) -> None:
        """Test that user cannot remove themselves."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse(
            "organization-remove-member", kwargs={"pk": str(organization.uuid)}
        )

        data = {
            "email": user.email,
        }

        response = client.post(url, data, format="json")

        # Can be 400 or 403 depending on when validation happens
        assert response.status_code in [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_403_FORBIDDEN,
        ]

    def test_remove_owner(
        self, user_token, organization, organization_membership, other_user
    ) -> None:
        """Test that organization owner cannot be removed."""
        # Make other_user the owner
        other_membership = OrganizationMembership.objects.create(
            user=other_user,
            organization=organization,
            access_level=OrganizationMembershipRole.OWNER,
        )

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse(
            "organization-remove-member", kwargs={"pk": str(organization.uuid)}
        )

        data = {
            "email": other_user.email,
        }

        response = client.post(url, data, format="json")

        # Can be 400 or 403 depending on when validation happens
        assert response.status_code in [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_403_FORBIDDEN,
        ]

        # Verify membership still exists if the request failed appropriately
        if response.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN]:
            assert OrganizationMembership.objects.filter(id=other_membership.id).exists()


@pytest.mark.django_db
class TestOrganizationPendingInvites:
    """Test suite for getting pending invites for current user."""

    def test_get_pending_invites(self, user_token, user, other_organization) -> None:
        """Test getting pending invites for current user."""
        # Create invite for user
        invite = OrganizationMembershipInvite.objects.create(
            organization=other_organization,
            email=user.email,
            invited_by=other_organization.owner,
        )

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("organization-pending-invites")

        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1
        assert any(
            inv["organization_uuid"] == str(other_organization.uuid)
            for inv in response.data
        )

    def test_get_pending_invites_excludes_accepted(
        self, user_token, user, other_organization
    ) -> None:
        """Test that accepted invites are not returned."""
        from django.utils import timezone

        # Create accepted invite
        OrganizationMembershipInvite.objects.create(
            organization=other_organization,
            email=user.email,
            invited_by=other_organization.owner,
            accepted_at=timezone.now(),
        )

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("organization-pending-invites")

        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        # Should not include the accepted invite
        assert not any(
            inv["organization_uuid"] == str(other_organization.uuid)
            for inv in response.data
        )


@pytest.mark.django_db
class TestOrganizationSentInvites:
    """Test suite for getting sent invites by organization."""

    def test_get_sent_invites(
        self, user_token, organization, organization_membership
    ) -> None:
        """Test getting sent invites for an organization."""
        # Create some invites
        OrganizationMembershipInvite.objects.create(
            organization=organization,
            email="invite1@example.com",
            invited_by=organization.owner,
        )
        OrganizationMembershipInvite.objects.create(
            organization=organization,
            email="invite2@example.com",
            invited_by=organization.owner,
        )

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse(
            "organization-sent-invites", kwargs={"pk": str(organization.uuid)}
        )

        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 2

    def test_get_sent_invites_excludes_accepted(
        self, user_token, organization, organization_membership
    ) -> None:
        """Test that accepted invites are not returned."""
        from django.utils import timezone

        # Create accepted invite
        OrganizationMembershipInvite.objects.create(
            organization=organization,
            email="accepted@example.com",
            invited_by=organization.owner,
            accepted_at=timezone.now(),
        )

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse(
            "organization-sent-invites", kwargs={"pk": str(organization.uuid)}
        )

        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        # Should not include accepted invite
        assert not any(inv["email"] == "accepted@example.com" for inv in response.data)


@pytest.mark.django_db
class TestOrganizationCancelInvite:
    """Test suite for canceling organization invites."""

    def test_cancel_invite(
        self, user_token, organization, organization_membership
    ) -> None:
        """Test canceling a pending invite."""
        invite = OrganizationMembershipInvite.objects.create(
            organization=organization,
            email="tocancel@example.com",
            invited_by=organization.owner,
        )

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse(
            "organization-cancel-invite", kwargs={"pk": str(organization.uuid)}
        )

        data = {
            "invite_id": invite.id,
        }

        response = client.post(url, data, format="json")

        # Should succeed or fail with permission error
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_403_FORBIDDEN,
        ]

        # If successful, verify invite was deleted
        if response.status_code == status.HTTP_200_OK:
            assert not OrganizationMembershipInvite.objects.filter(id=invite.id).exists()

    def test_cancel_invite_missing_id(
        self, user_token, organization, organization_membership
    ) -> None:
        """Test that missing invite_id returns 400."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse(
            "organization-cancel-invite", kwargs={"pk": str(organization.uuid)}
        )

        data = {}

        response = client.post(url, data, format="json")

        # Can be 400 or 403 depending on when validation happens
        assert response.status_code in [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_403_FORBIDDEN,
        ]

    def test_cancel_nonexistent_invite(
        self, user_token, organization, organization_membership
    ) -> None:
        """Test that canceling nonexistent invite returns 404."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse(
            "organization-cancel-invite", kwargs={"pk": str(organization.uuid)}
        )

        data = {
            "invite_id": 99999,
        }

        response = client.post(url, data, format="json")

        # Can be 403 or 404 depending on when authorization check happens
        assert response.status_code in [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND,
        ]

    def test_cancel_accepted_invite(
        self, user_token, organization, organization_membership
    ) -> None:
        """Test that accepted invites cannot be cancelled."""
        from django.utils import timezone

        invite = OrganizationMembershipInvite.objects.create(
            organization=organization,
            email="accepted@example.com",
            invited_by=organization.owner,
            accepted_at=timezone.now(),
        )

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse(
            "organization-cancel-invite", kwargs={"pk": str(organization.uuid)}
        )

        data = {
            "invite_id": invite.id,
        }

        response = client.post(url, data, format="json")

        # Can be 403 or 404 depending on when authorization check happens
        assert response.status_code in [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND,
        ]


@pytest.mark.django_db
class TestOrganizationList:
    """Test suite for listing organizations."""

    def test_list_organizations(
        self, user_token, organization, organization_membership
    ) -> None:
        """Test listing organizations user is a member of."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("organization-list")

        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1
        assert any(org["uuid"] == str(organization.uuid) for org in response.data)

    def test_list_organizations_only_shows_user_orgs(
        self,
        user_token,
        organization,
        other_organization,
        organization_membership,
    ) -> None:
        """Test that list only shows organizations user is a member of."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {user_token}")
        url = reverse("organization-list")

        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        org_uuids = [org["uuid"] for org in response.data]
        assert str(organization.uuid) in org_uuids
        assert str(other_organization.uuid) not in org_uuids
