from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthView(APIView):
    permission_classes = [AllowAny]

    def get(self, request) -> Response:
        """
        Health check endpoint to verify the API is running.
        Returns a simple status message.
        """
        return Response(
            {"status": "ok", "message": "API is healthy"},
            status=status.HTTP_200_OK,
        )
