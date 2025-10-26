from rest_framework import serializers, status, views
from rest_framework.authentication import BasicAuthentication, TokenAuthentication
from rest_framework.response import Response

from skald.api.permissions import (
    IsAuthenticatedOrAuthDisabled,
    ProjectAPIKeyAuthentication,
    get_project_for_request,
)
from skald.embeddings.vector_search import (
    memo_chunk_vector_search,
)
from skald.models.memo import Memo
from skald.models.project import Project
from skald.services.embedding_service import EmbeddingService
from skald.utils.filter_utils import MemoFilter, filter_queryset, parse_filter


class SearchResultSerializer(serializers.Serializer):
    title = serializers.CharField()
    uuid = serializers.CharField()
    content_snippet = serializers.CharField()
    summary = serializers.CharField()
    distance = serializers.FloatField(allow_null=True)


SUPPORTED_SEARCH_METHODS = [
    "title_contains",
    "title_startswith",
    "chunk_vector_search",
]


class SearchView(ProjectAPIKeyAuthentication, views.APIView):
    permission_classes = [IsAuthenticatedOrAuthDisabled]
    authentication_classes = [
        TokenAuthentication,
        BasicAuthentication,
        ProjectAPIKeyAuthentication,
    ]

    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request):
        """
        POST /api/search - Search endpoint
        """
        user = getattr(request, "user", None)

        project, error_response = get_project_for_request(user, request)
        if project is None or error_response:
            return error_response or Response(
                {"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # get the query from the request
        query = request.data.get("query")
        search_method = request.data.get("search_method")
        limit = request.data.get("limit", 10)
        filters = request.data.get("filters", [])

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

        memo_filters = []
        for filter in filters:
            memo_filter, error = parse_filter(filter)
            if memo_filter is not None:
                memo_filters.append(memo_filter)
            else:
                return Response(
                    {"error": f"Invalid filter: {error}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if limit > 50:
            return Response(
                {"error": "Limit must be less than or equal to 50"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        search_method_to_function = {
            "chunk_vector_search": _chunk_vector_search,
            "title_contains": _title_contains_search,
            "title_startswith": _title_startswith_search,
        }

        results = search_method_to_function[search_method](
            project, query, limit, memo_filters
        )
        return Response({"results": results}, status=status.HTTP_200_OK)


def _chunk_vector_search(
    project: Project, query: str, limit: int, filters: list[MemoFilter] = None
):
    embedding_vector = EmbeddingService.generate_embedding(query, usage="search")
    memo_chunk_results = memo_chunk_vector_search(
        project, embedding_vector, limit, filters=filters
    )
    results = []
    memo_uuids = set()
    for res in memo_chunk_results:
        memo_chunk = res["chunk"]
        distance = res["distance"]
        if memo_chunk.memo.uuid in memo_uuids:
            continue
        memo_uuids.add(memo_chunk.memo.uuid)
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


def _title_startswith_search(
    project: Project, query: str, limit: int, filters: list[MemoFilter] = None
):
    memos = Memo.objects.filter(project=project)
    if filters is not None:
        memos = filter_queryset(memos, filters)
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


def _title_contains_search(
    project: Project, query: str, limit: int, filters: list[MemoFilter] = None
):
    memos = Memo.objects.filter(project=project)
    if filters is not None:
        memos = filter_queryset(memos, filters)
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
