import hashlib
import secrets


def hash_api_key(token: str) -> str:
    """Hash a token using SHA3-256."""
    return hashlib.sha3_256(token.encode("utf-8")).hexdigest()


# we use prefix:
# sk_proj --> for project api keys
def generate_api_key(prefix: str) -> str:
    """Generate a new token with the given prefix."""
    return f"{prefix}_{secrets.token_hex(20)}"
