from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import serializers, status, views
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from skald.api.permissions import ProjectApiKeyPermissionMixin
from skald.embeddings.generate_embedding import generate_vector_embedding_for_search
from skald.embeddings.vector_search import (
    memo_chunk_vector_search,
    memo_summary_vector_search,
)
from skald.models.memo import Memo


class SearchResultSerializer(serializers.Serializer):
    title = serializers.CharField()
    uuid = serializers.CharField()
    content_snippet = serializers.CharField()
    summary = serializers.CharField()
    distance = serializers.FloatField(allow_null=True)


SUPPORTED_SEARCH_METHODS = [
    "title_contains",
    "title_startswith",
    "summary_vector_search",
    "chunk_vector_search",
]


class SearchView(ProjectApiKeyPermissionMixin, views.APIView):
    permission_classes = [AllowAny]
    authentication_classes = [ProjectApiKeyPermissionMixin]

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request):
        """
        POST /api/search - Search endpoint
        """

        # Get the project from the API key
        project = self.get_project()

        # get the query from the request
        query = request.data.get("query")
        search_method = request.data.get("search_method")
        limit = request.data.get("limit", 10)
        tags = request.data.get("tags", None)

        if not query:
            return Response(
                {"error": "Query is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        if not search_method or search_method not in SUPPORTED_SEARCH_METHODS:
            return Response(
                {
                    "error": f"Search method is required and must be one of: {', '.join(SUPPORTED_SEARCH_METHODS)}"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if limit > 50:
            return Response(
                {"error": "Limit must be less than or equal to 50"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        search_method_to_function = {
            "summary_vector_search": _summary_vector_search,
            "chunk_vector_search": _chunk_vector_search,
            "title_contains": _title_contains_search,
            "title_startswith": _title_startswith_search,
        }

        results = search_method_to_function[search_method](query, limit, project, tags)
        return Response({"results": results}, status=status.HTTP_200_OK)


def _summary_vector_search(query: str, limit: int, project, tags: list[str] = None):
    embedding_vector = generate_vector_embedding_for_search(query)
    memo_summary_results = memo_summary_vector_search(
        embedding_vector, limit, project=project, tags=tags
    )
    results = []
    for res in memo_summary_results:
        memo_summary = res["summary"]
        distance = res["distance"]
        serializer = SearchResultSerializer(
            {
                "title": memo_summary.memo.title,
                "uuid": memo_summary.memo.uuid,
                "content_snippet": memo_summary.memo.content[:100],
                "summary": memo_summary.summary,
                "distance": distance,
            }
        )
        results.append(serializer.data)
    return results


def _chunk_vector_search(query: str, limit: int, project, tags: list[str] = None):
    embedding_vector = generate_vector_embedding_for_search(query)
    memo_chunk_results = memo_chunk_vector_search(
        embedding_vector, limit, project=project, tags=tags
    )
    results = []
    for res in memo_chunk_results:
        memo_chunk = res["chunk"]
        distance = res["distance"]
        serializer = SearchResultSerializer(
            {
                "title": memo_chunk.memo.title,
                "uuid": memo_chunk.memo.uuid,
                "content_snippet": memo_chunk.memo.content[:100],
                "summary": memo_chunk.memo.summary,
                "distance": distance,
            }
        )
        results.append(serializer.data)
    return results


def _title_startswith_search(query: str, limit: int, project, tags: list[str] = None):
    memos = Memo.objects.filter(project=project)
    if tags is not None:
        memos = memos.filter(memotag__tag__in=tags)
    memos = memos.filter(title__istartswith=query)[:limit]
    results = []
    for memo in memos:
        serializer = SearchResultSerializer(
            {
                "title": memo.title,
                "uuid": memo.uuid,
                "content_snippet": memo.content[:100],
                "summary": memo.summary,
                "distance": None,
            }
        )
        results.append(serializer.data)
    return results


def _title_contains_search(query: str, limit: int, project, tags: list[str] = None):
    memos = Memo.objects.filter(project=project)
    if tags is not None:
        memos = memos.filter(memotag__tag__in=tags)
    memos = memos.filter(title__icontains=query.lower())[:limit]
    results = []
    for memo in memos:
        serializer = SearchResultSerializer(
            {
                "title": memo.title,
                "uuid": memo.uuid,
                "content_snippet": memo.content[:100],
                "summary": memo.summary,
                "distance": None,
            }
        )
        results.append(serializer.data)
    return results
