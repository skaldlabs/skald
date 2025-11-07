import type { Memo, SearchMethod } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Trash2, Share } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'

interface MemosTableProps {
    memos: Memo[]
    loading: boolean
    searchQuery: string
    searchMethod: SearchMethod
    onViewMemo: (memo: Memo) => void
    onDeleteMemo: (memo: Memo) => void
}

export const MemosTable = ({
    memos,
    loading,
    searchQuery,
    searchMethod,
    onViewMemo,
    onDeleteMemo,
}: MemosTableProps) => {
    const { uuid: projectUuid } = useParams<{ uuid: string }>()

    const handleShareMemo = async (memo: Memo) => {
        if (!projectUuid) return

        const memoUrl = `${window.location.origin}/projects/${projectUuid}/memos/${memo.uuid}`

        try {
            await navigator.clipboard.writeText(memoUrl)
            toast.success('Memo link copied to clipboard!')
        } catch {
            toast.error('Failed to copy link to clipboard')
        }
    }

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    }

    const truncate = (text: string, maxLength: number) => {
        if (!text) return ''
        return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
    }

    const formatRelevanceScore = (distance: number | null | undefined): string => {
        if (distance === null || distance === undefined) return 'N/A'
        // Convert cosine distance to similarity percentage
        // Distance ranges from 0 (identical) to 2 (opposite)
        // We want to show similarity as a percentage
        const similarity = Math.max(0, Math.min(100, (1 - distance / 2) * 100))
        return `${similarity.toFixed(1)}%`
    }

    const showRelevanceColumn = searchQuery && searchMethod === 'chunk_vector_search'

    if (loading) {
        return (
            <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
        )
    }

    if (memos.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">
                    {searchQuery
                        ? 'No memos found matching your search'
                        : 'No memos yet. Create your first memo to get started.'}
                </p>
            </div>
        )
    }

    return (
        <div className="rounded-md border overflow-x-auto">
            <Table className="w-full table-fixed">
                <TableHeader>
                    <TableRow>
                        {showRelevanceColumn && <TableHead className="w-[12%]">Relevance</TableHead>}
                        <TableHead className={showRelevanceColumn ? 'w-[20%]' : 'w-[25%]'}>Title</TableHead>
                        <TableHead className={showRelevanceColumn ? 'w-[32%]' : 'w-[38%]'}>Summary</TableHead>
                        <TableHead className="w-[12%]">Length</TableHead>
                        <TableHead className="w-[14%]">Created</TableHead>
                        <TableHead className="w-[10%] text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {memos.map((memo) => (
                        <TableRow
                            key={memo.uuid}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => onViewMemo(memo)}
                        >
                            {showRelevanceColumn && (
                                <TableCell className="text-sm font-medium">
                                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                        {formatRelevanceScore(memo.distance)}
                                    </span>
                                </TableCell>
                            )}
                            <TableCell className="font-medium">
                                <div className="min-w-0">
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
                            <TableCell className="min-w-0">
                                <p
                                    className="line-clamp-2 text-sm text-muted-foreground break-words"
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
                                <div className="flex gap-1 justify-end">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleShareMemo(memo)
                                        }}
                                        title="Share memo"
                                    >
                                        <Share className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onDeleteMemo(memo)
                                        }}
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
    )
}
