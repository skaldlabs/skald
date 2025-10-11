from typing import Any, Dict, Union

from rest_framework import status
from rest_framework.response import Response


def format_validation_error(errors: Union[str, Dict[str, Any]]) -> Response:
    """
    Format validation errors into a consistent error response format.

    Args:
        errors: Either a string error message or a dictionary of field errors

    Returns:
        Response: A Response object with the formatted error
    """
    if isinstance(errors, str):
        return Response({"error": errors}, status=status.HTTP_400_BAD_REQUEST)

    # if it's a dictionary, take the first error message - users can fix them one by one
    first_error = next(iter(errors.values()))
    if isinstance(first_error, list):
        error_message = first_error[0]
    else:
        error_message = str(first_error)

    return Response({"error": error_message}, status=status.HTTP_400_BAD_REQUEST)
