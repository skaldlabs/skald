from django.utils.deprecation import MiddlewareMixin


class ConditionalCsrfMiddleware(MiddlewareMixin):
    """
    CSRF middleware that exempts requests authenticated via API key.
    """

    def process_request(self, request):
        # Check if the request has been authenticated via API key
        # This flag is set by ProjectAPIKeyAuthentication.authenticate()
        if getattr(request, "_api_key_authenticated", False):
            # Bypass CSRF validation for API key requests
            setattr(request, "_dont_enforce_csrf_checks", True)
        return None
