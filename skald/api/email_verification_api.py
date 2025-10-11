import random
from datetime import timedelta

from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from skald.models.user import EmailVerificationCode, User
from skald.utils.email_utils import send_email


def generate_code(user: User) -> EmailVerificationCode:
    code = "".join([str(random.randint(0, 9)) for _ in range(6)])

    # delete any existing codes for this user
    EmailVerificationCode.objects.filter(user=user).delete()

    # create new verification code that expires in 10 minutes
    verification_code = EmailVerificationCode.objects.create(
        user=user, code=code, expires_at=timezone.now() + timedelta(minutes=10)
    )
    return verification_code


def send_verification_email(user: User):
    code = generate_code(user)

    send_email(
        to_email=user.email,
        subject="Your Email Verification Code",
        html=f"""
            <h1>Verify your email address</h1>
            <p>Your verification code is:</p>
            <h2 style="font-size: 24px; letter-spacing: 5px;">{code.code}</h2>
            <p>This code will expire in 10 minutes.</p>
        """,
    )


def verify_code(user: User, code: str) -> tuple[bool, str]:
    try:
        verification = EmailVerificationCode.objects.get(
            user=user, expires_at__gt=timezone.now()
        )

        # TODO: this logic exists here but is currently not properly used in the frontend
        if verification.attempts >= 3:
            verification.delete()
            return False, "Too many failed attempts. Please request a new code."

        verification.attempts += 1
        verification.save()

        if verification.code != code:
            return False, "Invalid code."

        user.email_verified = True
        user.save()

        verification.delete()
        return True, "Email verified successfully!"

    except EmailVerificationCode.DoesNotExist:
        return False, "Code expired or not found."


class VerifyEmailViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["post"])
    def verify(self, request):
        code = request.data.get("code")
        if not code:
            return Response(
                {"success": False, "message": "Verification code is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        success, message = verify_code(request.user, code)

        return Response(
            {"success": success, "message": message},
            status=status.HTTP_200_OK if success else status.HTTP_400_BAD_REQUEST,
        )

    @action(detail=False, methods=["post"])
    def send(self, request):
        if request.user.email_verified:
            return Response(
                {
                    "success": False,
                    "message": "Email already verified.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing_code = EmailVerificationCode.objects.filter(user=request.user).first()
        if (
            existing_code
            and timezone.now() - timedelta(minutes=5) < existing_code.created_at
        ):
            return Response(
                {
                    "success": False,
                    "message": "Please wait 5 minutes before requesting a new verification code.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        send_verification_email(request.user)
        return Response({"success": True, "message": "Verification code sent!"})
