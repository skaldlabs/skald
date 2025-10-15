import { useEffect, useState } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { useMemoStore } from '@/stores/memoStore'
import type { Memo, DetailedMemo, SearchMethod } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Search, Trash2, Eye, RefreshCw } from 'lucide-react'
import { DetailedMemoView } from './DetailedMemoView'

const SEARCH_METHODS: { value: SearchMethod; label: string }[] = [
    { value: 'chunk_vector_search', label: 'Semantic Search (Chunks)' },
    { value: 'summary_vector_search', label: 'Semantic Search (Summary)' },
    { value: 'title_contains', label: 'Title Contains' },
    { value: 'title_startswith', label: 'Title Starts With' },
]

export const MemosDashboard = () => {
    const currentProject = useProjectStore((state) => state.currentProject)

    const memos = useMemoStore((state) => state.memos)
    const loading = useMemoStore((state) => state.loading)
    const searchQuery = useMemoStore((state) => state.searchQuery)
    const searchMethod = useMemoStore((state) => state.searchMethod)
    const totalCount = useMemoStore((state) => state.totalCount)
    const currentPage = useMemoStore((state) => state.currentPage)
    const pageSize = useMemoStore((state) => state.pageSize)
    const fetchMemos = useMemoStore((state) => state.fetchMemos)
    const searchMemos = useMemoStore((state) => state.searchMemos)
    const deleteMemo = useMemoStore((state) => state.deleteMemo)
    const getMemoDetails = useMemoStore((state) => state.getMemoDetails)
    const setSearchQuery = useMemoStore((state) => state.setSearchQuery)
    const setSearchMethod = useMemoStore((state) => state.setSearchMethod)
    const clearSearch = useMemoStore((state) => state.clearSearch)

    const [selectedMemo, setSelectedMemo] = useState<DetailedMemo | null>(null)
    const [memoToDelete, setMemoToDelete] = useState<Memo | null>(null)
    const [deleting, setDeleting] = useState(false)

    // Handle search
    const handleSearch = async () => {
        if (!currentProject) return
        await searchMemos(searchQuery, searchMethod)
    }

    // Handle page change
    const handlePageChange = async (page: number) => {
        await fetchMemos(page, pageSize)
    }

    // Handle delete
    const handleDelete = async () => {
        if (!memoToDelete) return

        setDeleting(true)
        const success = await deleteMemo(memoToDelete.uuid)
        setDeleting(false)

        if (success) {
            setMemoToDelete(null)
        }
    }

    // View memo details
    const handleViewMemo = async (memo: Memo) => {
        const memoDetails = await getMemoDetails(memo.uuid)
        if (memoDetails) {
            setSelectedMemo(memoDetails)
        }
    }

    // Handle clear search
    const handleClearSearch = () => {
        clearSearch()
    }

    // Pagination
    const totalPages = Math.ceil(totalCount / pageSize)

    // Load memos on mount
    useEffect(() => {
        if (currentProject) {
            fetchMemos()
        }
    }, [currentProject, fetchMemos])

    // Handle Enter key for search
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch()
        }
    }

    // Format date
    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    }

    // Truncate text
    const truncate = (text: string, maxLength: number) => {
        if (!text) return ''
        return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
    }

    if (!currentProject) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <p className="text-muted-foreground">Please select a project to view memos</p>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Memos</h1>
                </div>
                <Button onClick={() => fetchMemos()} disabled={loading} variant="outline" size="sm">
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Search Bar */}
            <Card className="p-4">
                <div className="flex gap-3">
                    <div className="flex-1">
                        <Input
                            placeholder="Search memos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="w-full"
                        />
                    </div>
                    <Select value={searchMethod} onValueChange={(value) => setSearchMethod(value as SearchMethod)}>
                        <SelectTrigger className="w-[240px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {SEARCH_METHODS.map((method) => (
                                <SelectItem key={method.value} value={method.value}>
                                    {method.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={handleSearch} disabled={loading || !searchQuery.trim()}>
                        <Search className="h-4 w-4 mr-2" />
                        {loading ? 'Searching...' : 'Search'}
                    </Button>
                    {searchQuery && (
                        <Button onClick={handleClearSearch} variant="outline">
                            Clear
                        </Button>
                    )}
                </div>
            </Card>

            {/* Memos Table */}
            {/* <Card> */}
            {loading ? (
                <div className="p-4 space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                    ))}
                </div>
            ) : memos.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">
                        {searchQuery
                            ? 'No memos found matching your search'
                            : 'No memos yet. Create your first memo to get started.'}
                    </p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-hidden rounded-md border">
                        <Table className="w-full">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[30%]">Title</TableHead>
                                    <TableHead className="w-[40%]">Summary</TableHead>
                                    <TableHead className="w-[10%]">Length</TableHead>
                                    <TableHead className="w-[12%]">Created</TableHead>
                                    <TableHead className="w-[8%] text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {memos.map((memo) => (
                                    <TableRow key={memo.uuid}>
                                        <TableCell className="font-medium">
                                            <div className="max-w-xs">
                                                <p className="truncate" title={memo.title}>
                                                    {memo.title}
                                                </p>
                                                {memo.client_reference_id && (
                                                    <p
                                                        className="text-xs text-muted-foreground truncate"
                                                        title={memo.client_reference_id}
                                                    >
                                                        {memo.client_reference_id}
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <p
                                                className="line-clamp-2 text-sm text-muted-foreground"
                                                title={memo.summary}
                                            >
                                                {truncate(memo.summary, 120)}
                                            </p>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {memo.content_length.toLocaleString()} chars
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {formatDate(memo.created_at)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex gap-2 justify-end">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleViewMemo(memo)}
                                                    title="View details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setMemoToDelete(memo)}
                                                    title="Delete memo"
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-4 border-t">
                            <p className="text-sm text-muted-foreground">
                                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                                {Math.min(currentPage * pageSize, totalCount)} of {totalCount} memos
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1 || loading}
                                >
                                    Previous
                                </Button>
                                <div className="flex items-center gap-1">
                                    {[...Array(totalPages)].map((_, i) => {
                                        const pageNum = i + 1
                                        // Show first page, last page, current page, and pages around current
                                        if (
                                            pageNum === 1 ||
                                            pageNum === totalPages ||
                                            Math.abs(pageNum - currentPage) <= 1
                                        ) {
                                            return (
                                                <Button
                                                    key={pageNum}
                                                    variant={currentPage === pageNum ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => handlePageChange(pageNum)}
                                                    disabled={loading}
                                                    className="w-9"
                                                >
                                                    {pageNum}
                                                </Button>
                                            )
                                        } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                                            return (
                                                <span key={pageNum} className="px-2">
                                                    ...
                                                </span>
                                            )
                                        }
                                        return null
                                    })}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages || loading}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
            {/* </Card> */}

            {/* View Memo Dialog */}
            <Dialog open={!!selectedMemo} onOpenChange={() => setSelectedMemo(null)}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle>Memo Details</DialogTitle>
                        <DialogDescription>Complete information for this memo</DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[70vh] overflow-y-auto pr-4">
                        {selectedMemo && <DetailedMemoView memo={selectedMemo} />}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedMemo(null)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!memoToDelete} onOpenChange={() => setMemoToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Memo</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{memoToDelete?.title}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setMemoToDelete(null)} disabled={deleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                            {deleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
