from dataclasses import dataclass
from typing import List, Literal

from django.db.models import QuerySet
from rest_framework import serializers

SUPPORTED_OPERATORS = [
    "eq",
    "neq",
    "contains",
    "startswith",
    "endswith",
    "in",
    "not_in",
]


@dataclass
class MemoFilter:
    """Structured filter data with dot notation access"""

    field: str
    operator: Literal["eq", "neq", "contains", "startswith", "endswith", "in", "not_in"]
    value: any
    filter_type: Literal["native_field", "custom_metadata"]


# TODO: support gt, lt, gte, lte operators, especially for dates
def parse_filter(filter_dict: dict) -> MemoFilter | None:
    """Parse and validate a filter dictionary, returning a tuple with:
    - MemoFilter object if parsing was successful or None if it was not
    - The first error encountered if parsing was not successful or None if it was successful
    """

    try:
        memo_filter = MemoFilter(**filter_dict)
    except Exception as e:
        return None, str(e).replace("MemoFilter.__init__()", "Filter")

    if memo_filter.operator in ["in", "not_in"]:
        if not isinstance(memo_filter.value, list):
            return None, "Value must be a list for in or not_in operators"

    if memo_filter.operator not in SUPPORTED_OPERATORS:
        return (
            None,
            f"Invalid operator. Must be one of: {', '.join(SUPPORTED_OPERATORS)}",
        )

    if memo_filter.filter_type not in ["native_field", "custom_metadata"]:
        return (
            None,
            "Invalid filter type. Must be one of: native_field, custom_metadata",
        )

    if memo_filter.filter_type == "native_field":
        if memo_filter.field not in ["title", "source", "client_reference_id", "tags"]:
            return (
                None,
                "Invalid field for native_field filter. Must be one of: title, source, client_reference_id",
            )
        if memo_filter.field == "tags":
            if not isinstance(memo_filter.value, list):
                return None, "Value must be a list for tags filter"
            if not all(isinstance(tag, str) for tag in memo_filter.value):
                return None, "Value must be a list of strings for tags filter"
            if memo_filter.operator not in ["in", "not_in"]:
                return None, "Operator must be in or not_in for tags filter"

    return memo_filter, None


def filter_queryset(queryset: QuerySet, filters: list[MemoFilter]) -> QuerySet:
    # detect if we're filtering on MemoChunk or MemoSummary (which need memo__ prefix)
    # vs filtering directly on Memo model (which doesn't need prefix)
    model = queryset.model
    model_name = model.__name__

    # if we're filtering MemoChunk or MemoSummary, we need to prefix memo fields with "memo__"
    needs_memo_prefix = model_name in ["MemoChunk", "MemoSummary"]

    for filter in filters:
        if filter.filter_type == "native_field" and filter.field == "tags":
            # tags are in a separate MemoTag model, not on the Memo model, so we handle them separately
            tag_path = (
                "memo__memotag__tag__in" if needs_memo_prefix else "memotag__tag__in"
            )
            queryset = queryset.filter(**{tag_path: filter.value})
        elif filter.filter_type == "native_field":
            # native fields like title, source, client_reference_id are on Memo model
            field_prefix = "memo__" if needs_memo_prefix else ""
            field_path = f"{field_prefix}{filter.field}"

            if filter.operator == "eq":
                queryset = queryset.filter(**{field_path: filter.value})
            elif filter.operator == "neq":
                queryset = queryset.exclude(**{field_path: filter.value})
            elif filter.operator == "contains":
                queryset = queryset.filter(**{f"{field_path}__icontains": filter.value})
            elif filter.operator == "startswith":
                queryset = queryset.filter(
                    **{f"{field_path}__startswith": filter.value}
                )
            elif filter.operator == "endswith":
                queryset = queryset.filter(**{f"{field_path}__endswith": filter.value})
            elif filter.operator == "in":
                queryset = queryset.filter(**{f"{field_path}__in": filter.value})
            elif filter.operator == "not_in":
                queryset = queryset.exclude(**{f"{field_path}__in": filter.value})
        elif filter.filter_type == "custom_metadata":
            metadata_prefix = "memo__metadata" if needs_memo_prefix else "metadata"
            metadata_path = f"{metadata_prefix}__{filter.field}"

            if filter.operator == "eq":
                queryset = queryset.filter(**{metadata_path: filter.value})
            elif filter.operator == "neq":
                queryset = queryset.exclude(**{metadata_path: filter.value})
            elif filter.operator == "contains":
                queryset = queryset.filter(
                    **{f"{metadata_path}__icontains": filter.value}
                )
            elif filter.operator == "startswith":
                queryset = queryset.filter(
                    **{f"{metadata_path}__startswith": filter.value}
                )
            elif filter.operator == "endswith":
                queryset = queryset.filter(
                    **{f"{metadata_path}__endswith": filter.value}
                )
            elif filter.operator == "in":
                queryset = queryset.filter(**{f"{metadata_path}__in": filter.value})
            elif filter.operator == "not_in":
                queryset = queryset.exclude(**{f"{metadata_path}__in": filter.value})

    return queryset
