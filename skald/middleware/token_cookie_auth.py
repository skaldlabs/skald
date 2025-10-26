from django.utils.deprecation import MiddlewareMixin
from rest_framework.authtoken.models import Token


class TokenCookieAuthenticationMiddleware(MiddlewareMixin):
    """
    Middleware to read authentication token from httpOnly cookie and inject it
    into the request as an Authorization header.

    This allows the DRF TokenAuthentication to work with httpOnly cookies,
    protecting tokens from XSS attacks.
    """

    def process_request(self, request):
        # Only process if there's no Authorization header already
        if request.META.get("HTTP_AUTHORIZATION"):
            return None

        # Check if the request has an authToken cookie
        token_key = request.COOKIES.get("authToken")
        if token_key:
            try:
                # Verify the token exists in the database
                Token.objects.get(key=token_key)
                # Inject the token as an Authorization header for DRF TokenAuthentication
                request.META["HTTP_AUTHORIZATION"] = f"Token {token_key}"
            except Token.DoesNotExist:
                # Invalid token, don't inject anything
                pass

        return None
