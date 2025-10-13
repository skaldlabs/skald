import pytest


@pytest.fixture(autouse=True)
def disable_ssl_redirects(settings):
    """Disable SSL redirects for all tests."""
    settings.SECURE_SSL_REDIRECT = False
