#!/usr/bin/env python3
"""
Script to push mock documentation to the Skald memo API.
Reads all markdown files from mock_data/odin-docs and/or mock_data/wikipedia and creates memos.
"""

import os
import sys
import time
from pathlib import Path
from typing import Optional

import requests


def read_markdown_file(file_path: Path) -> tuple[str, str]:
    """
    Read markdown file and extract title and content.

    Returns:
        tuple of (title, content)
    """
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Try to extract title from first H1 heading
    lines = content.split("\n")
    title = None
    for line in lines:
        if line.startswith("# "):
            title = line[2:].strip()
            break

    # If no H1 found, use filename as title
    if not title:
        title = file_path.stem.replace("-", " ").replace("_", " ").title()

    return title, content


def create_memo(
    base_url: str,
    title: str,
    content: str,
    project_id: str,
    metadata: Optional[dict] = None,
    reference_id: Optional[str] = None,
    tags: Optional[list[str]] = None,
    source: Optional[str] = None,
) -> bool:
    """
    Create a memo via the API.

    Returns:
        True if successful, False otherwise
    """
    endpoint = f"{base_url}/api/v1/memo/"

    payload = {
        "title": title,
        "content": content,
        "project_id": project_id,
    }

    if metadata:
        payload["metadata"] = metadata
    if reference_id:
        payload["reference_id"] = reference_id
    if tags:
        payload["tags"] = tags
    if source:
        payload["source"] = source

    try:
        response = requests.post(endpoint, json=payload)
        response.raise_for_status()
        print(f"✓ Created memo: {title}")
        return True
    except requests.exceptions.RequestException as e:
        print(f"✗ Failed to create memo '{title}': {e}")
        return False


def get_category_from_path(file_path: Path, base_dir: Path) -> str:
    """
    Extract category from file path relative to base directory.
    e.g., mock_data/odin-docs/api/getting-started.md -> "api"
    """
    relative_path = file_path.relative_to(base_dir)
    if len(relative_path.parts) > 1:
        return relative_path.parts[0]
    return "general"


def get_source_and_tags_from_path(
    file_path: Path, base_dir: Path
) -> tuple[str, list[str]]:
    """
    Determine source and tags based on the directory structure.
    """
    relative_path = file_path.relative_to(base_dir)

    # Check if it's from odin-docs or wikipedia
    if "odin-docs" in str(file_path):
        source = "odin-docs-import"
        tags = ["odin-docs"]
        if len(relative_path.parts) > 1:
            tags.append(relative_path.parts[0])  # Add category as tag
    elif "wikipedia" in str(file_path):
        source = "wikipedia-import"
        tags = ["wikipedia", "encyclopedia"]
    else:
        source = "unknown-import"
        tags = ["imported"]

    return source, tags


def push_docs_from_directory(
    base_url: str, docs_dir: str, project_id: str, sleep_delay: float = 0.0
) -> tuple[int, int]:
    """
    Push all markdown files from a specific directory to the memo API.

    Args:
        base_url: Base URL of the API
        docs_dir: Directory containing markdown files
        project_id: Project ID to associate memos with
        sleep_delay: Delay in seconds between requests to prevent rate limiting

    Returns:
        tuple of (success_count, fail_count)
    """
    docs_path = Path(docs_dir)

    if not docs_path.exists():
        print(f"Warning: Directory {docs_dir} does not exist, skipping...")
        return 0, 0

    # Find all markdown files
    md_files = list(docs_path.rglob("*.md"))

    if not md_files:
        print(f"No markdown files found in {docs_dir}")
        return 0, 0

    print(f"Found {len(md_files)} markdown files in {docs_dir}")
    print(f"Pushing to {base_url}/api/v1/memo/\n")

    success_count = 0
    fail_count = 0

    for md_file in sorted(md_files):
        # Read file
        title, content = read_markdown_file(md_file)

        # Extract metadata
        category = get_category_from_path(md_file, docs_path)
        relative_path = str(md_file.relative_to(docs_path))

        # Get source and tags based on path
        source, tags = get_source_and_tags_from_path(md_file, docs_path)

        metadata = {
            "file_path": relative_path,
            "category": category,
        }

        # Create memo
        success = create_memo(
            base_url=base_url,
            title=title,
            content=content,
            project_id=project_id,
            metadata=metadata,
            reference_id=relative_path,
            tags=tags,
            source=source,
        )

        if success:
            success_count += 1
        else:
            fail_count += 1

        # Add delay between requests to prevent rate limiting
        if sleep_delay > 0:
            time.sleep(sleep_delay)

    return success_count, fail_count


def push_all_docs(
    base_url: str = "http://localhost:8000",
    project_id: str = None,
    include_odin: bool = True,
    include_wikipedia: bool = True,
    sleep_delay: float = 0.0,
):
    """
    Push all markdown files from the specified directories to the memo API.
    """
    if not project_id:
        print("Error: project_id is required")
        return

    total_success = 0
    total_fail = 0

    print(f"Pushing documentation to {base_url}/api/v1/memo/")
    print(f"Project ID: {project_id}")
    print("=" * 60)

    if include_odin:
        print("\n📚 Processing Odin Documentation...")
        success, fail = push_docs_from_directory(
            base_url, "mock_data/odin-docs", project_id, sleep_delay
        )
        total_success += success
        total_fail += fail
        print(f"Odin docs: {success} successful, {fail} failed")

    if include_wikipedia:
        print("\n🌍 Processing Wikipedia Articles...")
        success, fail = push_docs_from_directory(
            base_url, "mock_data/wikipedia", project_id, sleep_delay
        )
        total_success += success
        total_fail += fail
        print(f"Wikipedia: {success} successful, {fail} failed")

    print(f"\n{'='*60}")
    print(f"TOTAL RESULTS: {total_success} successful, {total_fail} failed")
    print(f"{'='*60}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Push mock documentation to Skald memo API"
    )
    parser.add_argument(
        "--url",
        default="http://localhost:8000",
        help="Base URL of the Skald API (default: http://localhost:8000)",
    )
    parser.add_argument(
        "--odin",
        action="store_true",
        help="Include Odin documentation (mock_data/odin-docs)",
    )
    parser.add_argument(
        "--wikipedia",
        action="store_true",
        help="Include Wikipedia articles (mock_data/wikipedia)",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Include both Odin docs and Wikipedia articles (default if no specific options)",
    )
    parser.add_argument(
        "--sleep",
        type=float,
        default=0.0,
        help="Delay in seconds between requests to prevent rate limiting (default: 0.0)",
    )
    parser.add_argument(
        "--project-id",
        required=True,
        help="Project ID to associate memos with (required)",
    )

    args = parser.parse_args()

    # Determine what to include
    include_odin = (
        args.odin or args.all or (not args.odin and not args.wikipedia and not args.all)
    )
    include_wikipedia = (
        args.wikipedia
        or args.all
        or (not args.odin and not args.wikipedia and not args.all)
    )

    # If specific options were provided, only include those
    if args.odin or args.wikipedia:
        include_odin = args.odin
        include_wikipedia = args.wikipedia

    push_all_docs(
        base_url=args.url,
        project_id=args.project_id,
        include_odin=include_odin,
        include_wikipedia=include_wikipedia,
        sleep_delay=args.sleep,
    )
