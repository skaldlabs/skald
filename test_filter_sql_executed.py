#!/usr/bin/env python
"""
Test script to view EXECUTED SQL queries with actual parameters

This script executes the queries and shows the real SQL with parameters filled in.

Run with: python test_filter_sql_executed.py
"""
import os

import django

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "skald.settings")
django.setup()

from django.conf import settings
from django.db import connection, reset_queries

from skald.models.memo import Memo
from skald.utils.filter_utils import filter_queryset, parse_filter

# Enable query logging
settings.DEBUG = True


def print_executed_queries(description):
    """Print all queries that were executed"""
    print(f"\n{'='*80}")
    print(f"{description}")
    print(f"{'='*80}")
    queries = connection.queries
    if not queries:
        print("No queries executed")
        return

    for i, query in enumerate(queries, 1):
        print(f"\nQuery {i}:")
        sql = query["sql"]
        # Pretty print
        sql = sql.replace(" WHERE ", "\nWHERE ")
        sql = sql.replace(" AND ", "\n  AND ")
        sql = sql.replace(" OR ", "\n  OR ")
        sql = sql.replace(" FROM ", "\nFROM ")
        print(sql)
        print(f"\nExecution time: {query['time']}s")


def test_filter(description, filters):
    """Execute a filter and show the SQL"""
    reset_queries()

    queryset = Memo.objects.all()
    filtered_qs = filter_queryset(queryset, filters)

    # Execute the query
    try:
        list(filtered_qs)  # Force evaluation
    except Exception as e:
        print(f"Error executing query: {e}")

    print_executed_queries(description)


def main():
    memo_filter, error = parse_filter(
        {
            "field": "title",
            "operator": "eqee",
            "value": "Test",
            "filter_type": "native_field",
        }
    )

    print(memo_filter)
    print(error)
    # print("\n" + "="*80)
    # print("EXECUTED SQL QUERIES WITH ACTUAL PARAMETERS")
    # print("="*80)

    # # Native field tests
    # print("\n\n" + "#"*80)
    # print("# NATIVE FIELD FILTERS")
    # print("#"*80)

    # test_filter(
    #     "Native: eq",
    #     [{"field": "title", "operator": "eq", "value": "Test", "filter_type": "native_field"}]
    # )

    # test_filter(
    #     "Native: contains",
    #     [{"field": "title", "operator": "contains", "value": "test", "filter_type": "native_field"}]
    # )

    # test_filter(
    #     "Native: in",
    #     [{"field": "source", "operator": "in", "value": ["web", "api"], "filter_type": "native_field"}]
    # )

    # # Custom metadata tests
    # print("\n\n" + "#"*80)
    # print("# CUSTOM METADATA FILTERS (PostgreSQL ->> operator)")
    # print("#"*80)

    # test_filter(
    #     "Metadata: eq (metadata ->> 'category' = 'docs')",
    #     [{"field": "category", "operator": "eq", "value": "docs", "filter_type": "custom_metadata"}]
    # )

    # test_filter(
    #     "Metadata: contains (metadata ->> 'category' ILIKE '%doc%')",
    #     [{"field": "category", "operator": "contains", "value": "doc", "filter_type": "custom_metadata"}]
    # )

    # test_filter(
    #     "Metadata: in (metadata ->> 'status' = ANY(ARRAY[...]))",
    #     [{"field": "status", "operator": "in", "value": ["active", "draft"], "filter_type": "custom_metadata"}]
    # )

    # # Combined filters
    # print("\n\n" + "#"*80)
    # print("# COMBINED FILTERS")
    # print("#"*80)

    # test_filter(
    #     "Combined: Native + Metadata filters",
    #     [
    #         {"field": "title", "operator": "contains", "value": "test", "filter_type": "native_field"},
    #         {"field": "category", "operator": "eq", "value": "docs", "filter_type": "custom_metadata"}
    #     ]
    # )

    # print("\n" + "="*80)
    # print("DONE!")
    # print("="*80)
    # print("\nNote: Look for the ->> operator in metadata queries!")
    # print("That's PostgreSQL's JSON extraction operator.")
    # print("="*80 + "\n")


if __name__ == "__main__":
    main()
