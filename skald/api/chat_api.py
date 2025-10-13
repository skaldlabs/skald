import json

from django.http import StreamingHttpResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status, views
from rest_framework.authentication import BasicAuthentication, TokenAuthentication
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from skald.agents.chat_agent.chat_agent import run_chat_agent, stream_chat_agent
from skald.agents.chat_agent.preprocessing import prepare_context_for_chat_agent
from skald.api.permissions import ProjectApiKeyPermissionMixin


@method_decorator(csrf_exempt, name="dispatch")
class ChatView(ProjectApiKeyPermissionMixin, views.APIView):
    authentication_classes = [TokenAuthentication, BasicAuthentication]
    permission_classes = [AllowAny]
    authentication_classes = [ProjectApiKeyPermissionMixin]

    def options(self, request, *args, **kwargs):
        """Handle CORS preflight requests."""
        response = Response(status=status.HTTP_200_OK)
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type"
        return response

    def post(self, request):
        # Get the project from the API key
        project = self.get_project()

        query = request.data.get("query")
        stream = request.data.get("stream", False)

        if not query:
            return Response(
                {"error": "Query is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        reranked_results = prepare_context_for_chat_agent(query, project)
        context_str = ""
        for i, result in enumerate(reranked_results):
            context_str += f"Result {i+1}: {result.document}\n\n"

        print("context_str", context_str)
        try:
            # Check if streaming is requested
            if stream:

                def event_stream():
                    """Generator function for Server-Sent Events."""
                    # Send initial ping to establish connection
                    yield f": ping\n\n"

                    try:
                        for chunk in stream_chat_agent(query, context_str):
                            # Format as Server-Sent Event
                            data = json.dumps(chunk)
                            yield f"data: {data}\n\n"
                    except Exception as e:
                        import traceback

                        error_msg = f"{str(e)}\n{traceback.format_exc()}"
                        error_data = json.dumps({"type": "error", "content": error_msg})
                        yield f"data: {error_data}\n\n"
                    finally:
                        # Send a done event
                        yield f"data: {json.dumps({'type': 'done'})}\n\n"

                response = StreamingHttpResponse(
                    event_stream(), content_type="text/event-stream"
                )
                response["Cache-Control"] = "no-cache"
                response["X-Accel-Buffering"] = "no"
                # Add CORS headers explicitly for streaming response
                response["Access-Control-Allow-Origin"] = "*"
                response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
                response["Access-Control-Allow-Headers"] = "Content-Type"
                return response
            else:
                # Non-streaming response
                result = run_chat_agent(query, context_str)

                return Response(
                    {
                        "ok": True,
                        "response": result.get("output"),
                        "intermediate_steps": result.get("intermediate_steps", []),
                    },
                    status=status.HTTP_200_OK,
                )

        except Exception as e:
            return Response(
                {"error": f"Agent error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
