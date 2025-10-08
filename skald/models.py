from django.contrib.auth.models import AbstractUser
from django.db import models


class EmailVerificationStatus:
    NotVerified = 0
    VerifyEmailSent = 1
    Verified = 2


class User(AbstractUser):
    # somehow email isn't unique by default in django's user model?
    email = models.EmailField(unique=True)
