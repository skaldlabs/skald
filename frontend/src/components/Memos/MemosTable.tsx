import type { Memo } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Trash2, Eye } from 'lucide-react'

interface MemosTableProps {
    memos: Memo[]
    loading: boolean
    searchQuery: string
    onViewMemo: (memo: Memo) => void
    onDeleteMemo: (memo: Memo) => void
}

export const MemosTable = ({ memos, loading, searchQuery, onViewMemo, onDeleteMemo }: MemosTableProps) => {
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
        <div className="overflow-x-hidden rounded-md border">
            <Table className="w-full">
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[30%]">Title</TableHead>
                        <TableHead className="w-[35%]">Summary</TableHead>
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
                                <p className="line-clamp-2 text-sm text-muted-foreground" title={memo.summary}>
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
                                        onClick={() => onViewMemo(memo)}
                                        title="View details"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onDeleteMemo(memo)}
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
