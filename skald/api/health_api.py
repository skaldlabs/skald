from django.db import connection
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthView(APIView):
    permission_classes = [AllowAny]

    def get(self, request) -> Response:
        """
        Health check endpoint to verify the API is running and dependencies are accessible.
        Checks database connectivity with a lightweight query.
        """
        checks = {"database": False}
        errors = []

        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            checks["database"] = True
        except Exception as e:
            errors.append(f"Database connection failed: {str(e)}")

        all_healthy = all(checks.values())

        response_data = {
            "status": "ok" if all_healthy else "unhealthy",
            "checks": checks,
        }

        if errors:
            response_data["errors"] = errors

        return Response(
            response_data,
            status=(
                status.HTTP_200_OK
                if all_healthy
                else status.HTTP_503_SERVICE_UNAVAILABLE
            ),
        )
