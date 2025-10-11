#!/usr/bin/env python3
"""
Script to push mock Odin documentation to the Skald memo API.
Reads all markdown files from mock_data/odin-docs and creates memos.
"""

import os
import requests
from pathlib import Path
from typing import Optional
import sys


def read_markdown_file(file_path: Path) -> tuple[str, str]:
    """
    Read markdown file and extract title and content.

    Returns:
        tuple of (title, content)
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Try to extract title from first H1 heading
    lines = content.split('\n')
    title = None
    for line in lines:
        if line.startswith('# '):
            title = line[2:].strip()
            break

    # If no H1 found, use filename as title
    if not title:
        title = file_path.stem.replace('-', ' ').replace('_', ' ').title()

    return title, content


def create_memo(
    base_url: str,
    title: str,
    content: str,
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


def push_all_docs(base_url: str = "http://localhost:8000", docs_dir: str = "mock_data/odin-docs"):
    """
    Push all markdown files from the docs directory to the memo API.
    """
    docs_path = Path(docs_dir)

    if not docs_path.exists():
        print(f"Error: Directory {docs_dir} does not exist")
        sys.exit(1)

    # Find all markdown files
    md_files = list(docs_path.rglob("*.md"))

    if not md_files:
        print(f"No markdown files found in {docs_dir}")
        sys.exit(1)

    print(f"Found {len(md_files)} markdown files")
    print(f"Pushing to {base_url}/api/v1/memo/\n")

    success_count = 0
    fail_count = 0

    for md_file in sorted(md_files):
        # Read file
        title, content = read_markdown_file(md_file)

        # Extract metadata
        category = get_category_from_path(md_file, docs_path)
        relative_path = str(md_file.relative_to(docs_path))

        metadata = {
            "file_path": relative_path,
            "category": category,
        }

        tags = [category, "odin-docs"]

        # Create memo
        success = create_memo(
            base_url=base_url,
            title=title,
            content=content,
            metadata=metadata,
            reference_id=relative_path,
            tags=tags,
            source="odin-docs-import",
        )

        if success:
            success_count += 1
        else:
            fail_count += 1

    print(f"\n{'='*50}")
    print(f"Results: {success_count} successful, {fail_count} failed")
    print(f"{'='*50}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Push mock Odin documentation to Skald memo API"
    )
    parser.add_argument(
        "--url",
        default="http://localhost:8000",
        help="Base URL of the Skald API (default: http://localhost:8000)",
    )
    parser.add_argument(
        "--docs-dir",
        default="mock_data/odin-docs",
        help="Directory containing markdown files (default: mock_data/odin-docs)",
    )

    args = parser.parse_args()

    push_all_docs(base_url=args.url, docs_dir=args.docs_dir)
