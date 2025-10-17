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

    return memo_filter, None


def filter_queryset(queryset: QuerySet, filters: list[MemoFilter]) -> QuerySet:
    for filter in filters:
        if filter.filter_type == "native_field":
            if filter.operator == "eq":
                queryset = queryset.filter(**{filter.field: filter.value})
            elif filter.operator == "neq":
                queryset = queryset.exclude(**{filter.field: filter.value})
            elif filter.operator == "contains":
                queryset = queryset.filter(
                    **{f"{filter.field}__icontains": filter.value}
                )
            elif filter.operator == "startswith":
                queryset = queryset.filter(
                    **{f"{filter.field}__startswith": filter.value}
                )
            elif filter.operator == "endswith":
                queryset = queryset.filter(
                    **{f"{filter.field}__endswith": filter.value}
                )
            elif filter.operator == "in":
                # expecting value to be a list
                queryset = queryset.filter(**{f"{filter.field}__in": filter.value})
            elif filter.operator == "not_in":
                # expecting value to be a list
                queryset = queryset.exclude(**{f"{filter.field}__in": filter.value})
        elif filter.filter_type == "custom_metadata":
            if filter.operator == "eq":
                queryset = queryset.filter(
                    **{f"metadata__{filter.field}": filter.value}
                )
            elif filter.operator == "neq":
                queryset = queryset.exclude(
                    **{f"metadata__{filter.field}": filter.value}
                )
            elif filter.operator == "contains":
                queryset = queryset.filter(
                    **{f"metadata__{filter.field}__icontains": filter.value}
                )
            elif filter.operator == "startswith":
                queryset = queryset.filter(
                    **{f"metadata__{filter.field}__startswith": filter.value}
                )
            elif filter.operator == "endswith":
                queryset = queryset.filter(
                    **{f"metadata__{filter.field}__endswith": filter.value}
                )
            elif filter.operator == "in":
                # expecting value to be a list
                queryset = queryset.filter(
                    **{f"metadata__{filter.field}__in": filter.value}
                )
            elif filter.operator == "not_in":
                # expecting value to be a list
                queryset = queryset.exclude(
                    **{f"metadata__{filter.field}__in": filter.value}
                )

    return queryset
