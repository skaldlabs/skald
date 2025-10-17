import pytest

from skald.embeddings.vector_search import memo_chunk_vector_search
from skald.models.memo import Memo, MemoChunk, MemoContent, MemoTag
from skald.utils.filter_utils import MemoFilter


@pytest.mark.django_db
class TestMemoChunkVectorSearchNativeFieldFilters:
    """Test suite for memo_chunk_vector_search with native_field filters."""

    @pytest.fixture
    def setup_memos(self, project):
        """Create test memos with various field values for filtering."""
        # Create memo 1
        memo1 = Memo.objects.create(
            title="Python Tutorial",
            content_length=100,
            project=project,
            source="docs.python.org",
            client_reference_id="REF-001",
            metadata={"language": "python", "level": "beginner"},
            content_hash="hash1",
        )
        MemoContent.objects.create(memo=memo1, project=project, content="Python basics")
        chunk1 = MemoChunk.objects.create(
            memo=memo1,
            project=project,
            chunk_content="Python is a programming language",
            chunk_index=0,
            embedding=[0.1] * 2048,
        )

        # Create memo 2
        memo2 = Memo.objects.create(
            title="JavaScript Guide",
            content_length=150,
            project=project,
            source="developer.mozilla.org",
            client_reference_id="REF-002",
            metadata={"language": "javascript", "level": "intermediate"},
            content_hash="hash2",
        )
        MemoContent.objects.create(memo=memo2, project=project, content="JS basics")
        chunk2 = MemoChunk.objects.create(
            memo=memo2,
            project=project,
            chunk_content="JavaScript is versatile",
            chunk_index=0,
            embedding=[0.2] * 2048,
        )

        # Create memo 3
        memo3 = Memo.objects.create(
            title="Python Advanced",
            content_length=200,
            project=project,
            source="realpython.com",
            client_reference_id="REF-003",
            metadata={"language": "python", "level": "advanced"},
            content_hash="hash3",
        )
        MemoContent.objects.create(
            memo=memo3, project=project, content="Advanced Python"
        )
        chunk3 = MemoChunk.objects.create(
            memo=memo3,
            project=project,
            chunk_content="Python decorators and metaclasses",
            chunk_index=0,
            embedding=[0.15] * 2048,
        )

        return {
            "memo1": memo1,
            "memo2": memo2,
            "memo3": memo3,
            "chunk1": chunk1,
            "chunk2": chunk2,
            "chunk3": chunk3,
        }

    def test_filter_by_title_eq(self, project, setup_memos):
        """Test filtering by exact title match."""
        filters = [
            MemoFilter(
                field="title",
                operator="eq",
                value="Python Tutorial",
                filter_type="native_field",
            )
        ]

        results = memo_chunk_vector_search(
            project=project,
            embedding_vector=[0.1] * 2048,
            top_k=10,
            similarity_threshold=1.0,
            filters=filters,
        )

        assert len(results) == 1
        assert results[0]["chunk"].uuid == setup_memos["chunk1"].uuid

    def test_filter_by_title_neq(self, project, setup_memos):
        """Test filtering by title not equal."""
        filters = [
            MemoFilter(
                field="title",
                operator="neq",
                value="Python Tutorial",
                filter_type="native_field",
            )
        ]

        results = memo_chunk_vector_search(
            project=project,
            embedding_vector=[0.1] * 2048,
            top_k=10,
            similarity_threshold=1.0,
            filters=filters,
        )

        assert len(results) == 2
        chunk_uuids = [r["chunk"].uuid for r in results]
        assert setup_memos["chunk1"].uuid not in chunk_uuids
        assert setup_memos["chunk2"].uuid in chunk_uuids
        assert setup_memos["chunk3"].uuid in chunk_uuids

    def test_filter_by_title_contains(self, project, setup_memos):
        """Test filtering by title contains (case-insensitive)."""
        filters = [
            MemoFilter(
                field="title",
                operator="contains",
                value="python",
                filter_type="native_field",
            )
        ]

        results = memo_chunk_vector_search(
            project=project,
            embedding_vector=[0.1] * 2048,
            top_k=10,
            similarity_threshold=1.0,
            filters=filters,
        )

        assert len(results) == 2
        chunk_uuids = [r["chunk"].uuid for r in results]
        assert setup_memos["chunk1"].uuid in chunk_uuids
        assert setup_memos["chunk3"].uuid in chunk_uuids

    def test_filter_by_title_startswith(self, project, setup_memos):
        """Test filtering by title starts with."""
        filters = [
            MemoFilter(
                field="title",
                operator="startswith",
                value="Python",
                filter_type="native_field",
            )
        ]

        results = memo_chunk_vector_search(
            project=project,
            embedding_vector=[0.1] * 2048,
            top_k=10,
            similarity_threshold=1.0,
            filters=filters,
        )

        assert len(results) == 2
        chunk_uuids = [r["chunk"].uuid for r in results]
        assert setup_memos["chunk1"].uuid in chunk_uuids
        assert setup_memos["chunk3"].uuid in chunk_uuids

    def test_filter_by_title_endswith(self, project, setup_memos):
        """Test filtering by title ends with."""
        filters = [
            MemoFilter(
                field="title",
                operator="endswith",
                value="Guide",
                filter_type="native_field",
            )
        ]

        results = memo_chunk_vector_search(
            project=project,
            embedding_vector=[0.1] * 2048,
            top_k=10,
            similarity_threshold=1.0,
            filters=filters,
        )

        assert len(results) == 1
        assert results[0]["chunk"].uuid == setup_memos["chunk2"].uuid

    def test_filter_by_source_in(self, project, setup_memos):
        """Test filtering by source in list."""
        filters = [
            MemoFilter(
                field="source",
                operator="in",
                value=["docs.python.org", "realpython.com"],
                filter_type="native_field",
            )
        ]

        results = memo_chunk_vector_search(
            project=project,
            embedding_vector=[0.1] * 2048,
            top_k=10,
            similarity_threshold=1.0,
            filters=filters,
        )

        assert len(results) == 2
        chunk_uuids = [r["chunk"].uuid for r in results]
        assert setup_memos["chunk1"].uuid in chunk_uuids
        assert setup_memos["chunk3"].uuid in chunk_uuids

    def test_filter_by_source_not_in(self, project, setup_memos):
        """Test filtering by source not in list."""
        filters = [
            MemoFilter(
                field="source",
                operator="not_in",
                value=["docs.python.org"],
                filter_type="native_field",
            )
        ]

        results = memo_chunk_vector_search(
            project=project,
            embedding_vector=[0.1] * 2048,
            top_k=10,
            similarity_threshold=1.0,
            filters=filters,
        )

        assert len(results) == 2
        chunk_uuids = [r["chunk"].uuid for r in results]
        assert setup_memos["chunk2"].uuid in chunk_uuids
        assert setup_memos["chunk3"].uuid in chunk_uuids

    def test_filter_by_client_reference_id(self, project, setup_memos):
        """Test filtering by client_reference_id."""
        filters = [
            MemoFilter(
                field="client_reference_id",
                operator="eq",
                value="REF-002",
                filter_type="native_field",
            )
        ]

        results = memo_chunk_vector_search(
            project=project,
            embedding_vector=[0.1] * 2048,
            top_k=10,
            similarity_threshold=1.0,
            filters=filters,
        )

        assert len(results) == 1
        assert results[0]["chunk"].uuid == setup_memos["chunk2"].uuid


@pytest.mark.django_db
class TestMemoChunkVectorSearchCustomMetadataFilters:
    """Test suite for memo_chunk_vector_search with custom_metadata filters."""

    @pytest.fixture
    def setup_memos(self, project):
        """Create test memos with various metadata for filtering."""
        # Memo with metadata
        memo1 = Memo.objects.create(
            title="Memo 1",
            content_length=100,
            project=project,
            metadata={"language": "python", "version": "3.9", "category": "tutorial"},
            content_hash="hash1",
        )
        MemoContent.objects.create(memo=memo1, project=project, content="Content 1")
        chunk1 = MemoChunk.objects.create(
            memo=memo1,
            project=project,
            chunk_content="Chunk 1",
            chunk_index=0,
            embedding=[0.1] * 2048,
        )

        memo2 = Memo.objects.create(
            title="Memo 2",
            content_length=150,
            project=project,
            metadata={
                "language": "javascript",
                "version": "ES2020",
                "category": "guide",
            },
            content_hash="hash2",
        )
        MemoContent.objects.create(memo=memo2, project=project, content="Content 2")
        chunk2 = MemoChunk.objects.create(
            memo=memo2,
            project=project,
            chunk_content="Chunk 2",
            chunk_index=0,
            embedding=[0.2] * 2048,
        )

        memo3 = Memo.objects.create(
            title="Memo 3",
            content_length=200,
            project=project,
            metadata={"language": "python", "version": "3.11", "category": "reference"},
            content_hash="hash3",
        )
        MemoContent.objects.create(memo=memo3, project=project, content="Content 3")
        chunk3 = MemoChunk.objects.create(
            memo=memo3,
            project=project,
            chunk_content="Chunk 3",
            chunk_index=0,
            embedding=[0.15] * 2048,
        )

        return {
            "chunk1": chunk1,
            "chunk2": chunk2,
            "chunk3": chunk3,
        }

    def test_filter_by_metadata_eq(self, project, setup_memos):
        """Test filtering by exact metadata value."""
        filters = [
            MemoFilter(
                field="language",
                operator="eq",
                value="python",
                filter_type="custom_metadata",
            )
        ]

        results = memo_chunk_vector_search(
            project=project,
            embedding_vector=[0.1] * 2048,
            top_k=10,
            similarity_threshold=1.0,
            filters=filters,
        )

        assert len(results) == 2
        chunk_uuids = [r["chunk"].uuid for r in results]
        assert setup_memos["chunk1"].uuid in chunk_uuids
        assert setup_memos["chunk3"].uuid in chunk_uuids

    def test_filter_by_metadata_neq(self, project, setup_memos):
        """Test filtering by metadata not equal."""
        filters = [
            MemoFilter(
                field="language",
                operator="neq",
                value="python",
                filter_type="custom_metadata",
            )
        ]

        results = memo_chunk_vector_search(
            project=project,
            embedding_vector=[0.1] * 2048,
            top_k=10,
            similarity_threshold=1.0,
            filters=filters,
        )

        assert len(results) == 1
        assert results[0]["chunk"].uuid == setup_memos["chunk2"].uuid

    def test_filter_by_metadata_contains(self, project, setup_memos):
        """Test filtering by metadata contains (case-insensitive)."""
        filters = [
            MemoFilter(
                field="category",
                operator="contains",
                value="tut",
                filter_type="custom_metadata",
            )
        ]

        results = memo_chunk_vector_search(
            project=project,
            embedding_vector=[0.1] * 2048,
            top_k=10,
            similarity_threshold=1.0,
            filters=filters,
        )

        assert len(results) == 1
        assert results[0]["chunk"].uuid == setup_memos["chunk1"].uuid

    def test_filter_by_metadata_startswith(self, project, setup_memos):
        """Test filtering by metadata starts with."""
        filters = [
            MemoFilter(
                field="version",
                operator="startswith",
                value="3.",
                filter_type="custom_metadata",
            )
        ]

        results = memo_chunk_vector_search(
            project=project,
            embedding_vector=[0.1] * 2048,
            top_k=10,
            similarity_threshold=1.0,
            filters=filters,
        )

        assert len(results) == 2
        chunk_uuids = [r["chunk"].uuid for r in results]
        assert setup_memos["chunk1"].uuid in chunk_uuids
        assert setup_memos["chunk3"].uuid in chunk_uuids

    def test_filter_by_metadata_endswith(self, project, setup_memos):
        """Test filtering by metadata ends with."""
        filters = [
            MemoFilter(
                field="category",
                operator="endswith",
                value="ence",
                filter_type="custom_metadata",
            )
        ]

        results = memo_chunk_vector_search(
            project=project,
            embedding_vector=[0.1] * 2048,
            top_k=10,
            similarity_threshold=1.0,
            filters=filters,
        )

        assert len(results) == 1
        assert results[0]["chunk"].uuid == setup_memos["chunk3"].uuid

    def test_filter_by_metadata_in(self, project, setup_memos):
        """Test filtering by metadata in list."""
        filters = [
            MemoFilter(
                field="category",
                operator="in",
                value=["tutorial", "guide"],
                filter_type="custom_metadata",
            )
        ]

        results = memo_chunk_vector_search(
            project=project,
            embedding_vector=[0.1] * 2048,
            top_k=10,
            similarity_threshold=1.0,
            filters=filters,
        )

        assert len(results) == 2
        chunk_uuids = [r["chunk"].uuid for r in results]
        assert setup_memos["chunk1"].uuid in chunk_uuids
        assert setup_memos["chunk2"].uuid in chunk_uuids

    def test_filter_by_metadata_not_in(self, project, setup_memos):
        """Test filtering by metadata not in list."""
        filters = [
            MemoFilter(
                field="category",
                operator="not_in",
                value=["tutorial", "guide"],
                filter_type="custom_metadata",
            )
        ]

        results = memo_chunk_vector_search(
            project=project,
            embedding_vector=[0.1] * 2048,
            top_k=10,
            similarity_threshold=1.0,
            filters=filters,
        )

        assert len(results) == 1
        assert results[0]["chunk"].uuid == setup_memos["chunk3"].uuid


@pytest.mark.django_db
class TestMemoChunkVectorSearchTagFilters:
    """Test suite for memo_chunk_vector_search with tag filters."""

    @pytest.fixture
    def setup_memos(self, project):
        """Create test memos with various tags."""
        memo1 = Memo.objects.create(
            title="Memo 1",
            content_length=100,
            project=project,
            content_hash="hash1",
        )
        MemoContent.objects.create(memo=memo1, project=project, content="Content 1")
        chunk1 = MemoChunk.objects.create(
            memo=memo1,
            project=project,
            chunk_content="Chunk 1",
            chunk_index=0,
            embedding=[0.1] * 2048,
        )
        MemoTag.objects.create(memo=memo1, project=project, tag="python")
        MemoTag.objects.create(memo=memo1, project=project, tag="tutorial")

        memo2 = Memo.objects.create(
            title="Memo 2",
            content_length=150,
            project=project,
            content_hash="hash2",
        )
        MemoContent.objects.create(memo=memo2, project=project, content="Content 2")
        chunk2 = MemoChunk.objects.create(
            memo=memo2,
            project=project,
            chunk_content="Chunk 2",
            chunk_index=0,
            embedding=[0.2] * 2048,
        )
        MemoTag.objects.create(memo=memo2, project=project, tag="javascript")
        MemoTag.objects.create(memo=memo2, project=project, tag="guide")

        memo3 = Memo.objects.create(
            title="Memo 3",
            content_length=200,
            project=project,
            content_hash="hash3",
        )
        MemoContent.objects.create(memo=memo3, project=project, content="Content 3")
        chunk3 = MemoChunk.objects.create(
            memo=memo3,
            project=project,
            chunk_content="Chunk 3",
            chunk_index=0,
            embedding=[0.15] * 2048,
        )
        MemoTag.objects.create(memo=memo3, project=project, tag="python")
        MemoTag.objects.create(memo=memo3, project=project, tag="advanced")

        return {
            "chunk1": chunk1,
            "chunk2": chunk2,
            "chunk3": chunk3,
        }

    def test_filter_by_tags_in(self, project, setup_memos):
        """Test filtering by tags in list."""
        filters = [
            MemoFilter(
                field="tags",
                operator="in",
                value=["python"],
                filter_type="native_field",
            )
        ]

        results = memo_chunk_vector_search(
            project=project,
            embedding_vector=[0.1] * 2048,
            top_k=10,
            similarity_threshold=1.0,
            filters=filters,
        )

        assert len(results) == 2
        chunk_uuids = [r["chunk"].uuid for r in results]
        assert setup_memos["chunk1"].uuid in chunk_uuids
        assert setup_memos["chunk3"].uuid in chunk_uuids

    def test_filter_by_tags_multiple_values(self, project, setup_memos):
        """Test filtering by multiple tags (OR logic)."""
        filters = [
            MemoFilter(
                field="tags",
                operator="in",
                value=["python", "javascript"],
                filter_type="native_field",
            )
        ]

        results = memo_chunk_vector_search(
            project=project,
            embedding_vector=[0.1] * 2048,
            top_k=10,
            similarity_threshold=1.0,
            filters=filters,
        )

        assert len(results) == 3
        chunk_uuids = [r["chunk"].uuid for r in results]
        assert setup_memos["chunk1"].uuid in chunk_uuids
        assert setup_memos["chunk2"].uuid in chunk_uuids
        assert setup_memos["chunk3"].uuid in chunk_uuids


@pytest.mark.django_db
class TestMemoChunkVectorSearchMultipleFilters:
    """Test suite for memo_chunk_vector_search with multiple filters combined."""

    @pytest.fixture
    def setup_memos(self, project):
        """Create test memos for complex filtering scenarios."""
        memo1 = Memo.objects.create(
            title="Python Basics",
            content_length=100,
            project=project,
            source="docs.python.org",
            metadata={"language": "python", "level": "beginner"},
            content_hash="hash1",
        )
        MemoContent.objects.create(memo=memo1, project=project, content="Content 1")
        chunk1 = MemoChunk.objects.create(
            memo=memo1,
            project=project,
            chunk_content="Chunk 1",
            chunk_index=0,
            embedding=[0.1] * 2048,
        )
        MemoTag.objects.create(memo=memo1, project=project, tag="python")
        MemoTag.objects.create(memo=memo1, project=project, tag="tutorial")

        memo2 = Memo.objects.create(
            title="Python Advanced",
            content_length=150,
            project=project,
            source="realpython.com",
            metadata={"language": "python", "level": "advanced"},
            content_hash="hash2",
        )
        MemoContent.objects.create(memo=memo2, project=project, content="Content 2")
        chunk2 = MemoChunk.objects.create(
            memo=memo2,
            project=project,
            chunk_content="Chunk 2",
            chunk_index=0,
            embedding=[0.2] * 2048,
        )
        MemoTag.objects.create(memo=memo2, project=project, tag="python")
        MemoTag.objects.create(memo=memo2, project=project, tag="advanced")

        memo3 = Memo.objects.create(
            title="JavaScript Guide",
            content_length=200,
            project=project,
            source="developer.mozilla.org",
            metadata={"language": "javascript", "level": "beginner"},
            content_hash="hash3",
        )
        MemoContent.objects.create(memo=memo3, project=project, content="Content 3")
        chunk3 = MemoChunk.objects.create(
            memo=memo3,
            project=project,
            chunk_content="Chunk 3",
            chunk_index=0,
            embedding=[0.15] * 2048,
        )
        MemoTag.objects.create(memo=memo3, project=project, tag="javascript")

        return {
            "chunk1": chunk1,
            "chunk2": chunk2,
            "chunk3": chunk3,
        }

    def test_filter_native_and_metadata(self, project, setup_memos):
        """Test combining native field and metadata filters."""
        filters = [
            MemoFilter(
                field="title",
                operator="contains",
                value="Python",
                filter_type="native_field",
            ),
            MemoFilter(
                field="level",
                operator="eq",
                value="beginner",
                filter_type="custom_metadata",
            ),
        ]

        results = memo_chunk_vector_search(
            project=project,
            embedding_vector=[0.1] * 2048,
            top_k=10,
            similarity_threshold=1.0,
            filters=filters,
        )

        assert len(results) == 1
        assert results[0]["chunk"].uuid == setup_memos["chunk1"].uuid

    def test_filter_native_and_tags(self, project, setup_memos):
        """Test combining native field and tag filters."""
        filters = [
            MemoFilter(
                field="source",
                operator="contains",
                value="python",
                filter_type="native_field",
            ),
            MemoFilter(
                field="tags",
                operator="in",
                value=["tutorial"],
                filter_type="native_field",
            ),
        ]

        results = memo_chunk_vector_search(
            project=project,
            embedding_vector=[0.1] * 2048,
            top_k=10,
            similarity_threshold=1.0,
            filters=filters,
        )

        assert len(results) == 1
        assert results[0]["chunk"].uuid == setup_memos["chunk1"].uuid

    def test_filter_metadata_and_tags(self, project, setup_memos):
        """Test combining metadata and tag filters."""
        filters = [
            MemoFilter(
                field="language",
                operator="eq",
                value="python",
                filter_type="custom_metadata",
            ),
            MemoFilter(
                field="tags",
                operator="in",
                value=["advanced"],
                filter_type="native_field",
            ),
        ]

        results = memo_chunk_vector_search(
            project=project,
            embedding_vector=[0.1] * 2048,
            top_k=10,
            similarity_threshold=1.0,
            filters=filters,
        )

        assert len(results) == 1
        assert results[0]["chunk"].uuid == setup_memos["chunk2"].uuid

    def test_filter_all_three_types(self, project, setup_memos):
        """Test combining native field, metadata, and tag filters."""
        filters = [
            MemoFilter(
                field="title",
                operator="contains",
                value="Python",
                filter_type="native_field",
            ),
            MemoFilter(
                field="level",
                operator="eq",
                value="advanced",
                filter_type="custom_metadata",
            ),
            MemoFilter(
                field="tags",
                operator="in",
                value=["python"],
                filter_type="native_field",
            ),
        ]

        results = memo_chunk_vector_search(
            project=project,
            embedding_vector=[0.1] * 2048,
            top_k=10,
            similarity_threshold=1.0,
            filters=filters,
        )

        assert len(results) == 1
        assert results[0]["chunk"].uuid == setup_memos["chunk2"].uuid

    def test_filter_no_results(self, project, setup_memos):
        """Test filters that match no memos."""
        filters = [
            MemoFilter(
                field="title",
                operator="contains",
                value="Rust",
                filter_type="native_field",
            ),
        ]

        results = memo_chunk_vector_search(
            project=project,
            embedding_vector=[0.1] * 2048,
            top_k=10,
            similarity_threshold=1.0,
            filters=filters,
        )

        assert len(results) == 0


@pytest.mark.django_db
class TestMemoChunkVectorSearchEdgeCases:
    """Test suite for edge cases in memo_chunk_vector_search."""

    def test_no_filters(self, project):
        """Test vector search with no filters."""
        memo = Memo.objects.create(
            title="Test",
            content_length=100,
            project=project,
            content_hash="hash1",
        )
        MemoContent.objects.create(memo=memo, project=project, content="Content")
        chunk = MemoChunk.objects.create(
            memo=memo,
            project=project,
            chunk_content="Chunk",
            chunk_index=0,
            embedding=[0.1] * 2048,
        )

        results = memo_chunk_vector_search(
            project=project,
            embedding_vector=[0.1] * 2048,
            top_k=10,
            similarity_threshold=1.0,
            filters=None,
        )

        assert len(results) == 1
        assert results[0]["chunk"].uuid == chunk.uuid

    def test_empty_filters_list(self, project):
        """Test vector search with empty filters list."""
        memo = Memo.objects.create(
            title="Test",
            content_length=100,
            project=project,
            content_hash="hash1",
        )
        MemoContent.objects.create(memo=memo, project=project, content="Content")
        chunk = MemoChunk.objects.create(
            memo=memo,
            project=project,
            chunk_content="Chunk",
            chunk_index=0,
            embedding=[0.1] * 2048,
        )

        results = memo_chunk_vector_search(
            project=project,
            embedding_vector=[0.1] * 2048,
            top_k=10,
            similarity_threshold=1.0,
            filters=[],
        )

        assert len(results) == 1
        assert results[0]["chunk"].uuid == chunk.uuid

    def test_similarity_threshold_filtering(self, project):
        """Test that filters work together with similarity threshold."""
        memo1 = Memo.objects.create(
            title="Test 1",
            content_length=100,
            project=project,
            source="test.com",
            content_hash="hash1",
        )
        MemoContent.objects.create(memo=memo1, project=project, content="Content 1")
        MemoChunk.objects.create(
            memo=memo1,
            project=project,
            chunk_content="Chunk 1",
            chunk_index=0,
            embedding=[0.1] * 2048,
        )

        memo2 = Memo.objects.create(
            title="Test 2",
            content_length=100,
            project=project,
            source="other.com",  # Different source
            content_hash="hash2",
        )
        MemoContent.objects.create(memo=memo2, project=project, content="Content 2")
        MemoChunk.objects.create(
            memo=memo2,
            project=project,
            chunk_content="Chunk 2",
            chunk_index=0,
            embedding=[0.1] * 2048,
        )

        filters = [
            MemoFilter(
                field="source",
                operator="eq",
                value="test.com",
                filter_type="native_field",
            )
        ]

        # Should only find the chunk with matching source filter
        results = memo_chunk_vector_search(
            project=project,
            embedding_vector=[0.1] * 2048,
            top_k=10,
            similarity_threshold=1.0,
            filters=filters,
        )

        assert len(results) == 1
        assert results[0]["chunk"].memo.source == "test.com"

    def test_top_k_limit_with_filters(self, project):
        """Test that top_k limit is respected with filters."""
        for i in range(5):
            memo = Memo.objects.create(
                title=f"Test {i}",
                content_length=100,
                project=project,
                source="test.com",
                content_hash=f"hash{i}",
            )
            MemoContent.objects.create(
                memo=memo, project=project, content=f"Content {i}"
            )
            MemoChunk.objects.create(
                memo=memo,
                project=project,
                chunk_content=f"Chunk {i}",
                chunk_index=0,
                embedding=[0.1 + i * 0.01] * 2048,
            )

        filters = [
            MemoFilter(
                field="source",
                operator="eq",
                value="test.com",
                filter_type="native_field",
            )
        ]

        results = memo_chunk_vector_search(
            project=project,
            embedding_vector=[0.1] * 2048,
            top_k=3,
            similarity_threshold=1.0,
            filters=filters,
        )

        assert len(results) == 3
        # Results should be ordered by distance (closest first)
        assert results[0]["distance"] <= results[1]["distance"]
        assert results[1]["distance"] <= results[2]["distance"]
