import type { Memo, SearchMethod } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Trash2, Share, CheckCircle, AlertCircle, Loader2, FileUp } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'

interface MemosTableProps {
    memos: Memo[]
    loading: boolean
    searchQuery: string
    searchMethod: SearchMethod
    onViewMemo: (memo: Memo) => void
    onDeleteMemo: (memo: Memo) => void
    onCreateMemo?: () => void
}

export const MemosTable = ({
    memos,
    loading,
    searchQuery,
    searchMethod,
    onViewMemo,
    onDeleteMemo,
    onCreateMemo,
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

    const getStatusBadge = (status: 'processing' | 'processed' | 'error') => {
        if (status === 'processing') {
            return (
                <Badge variant="outline" className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Processing
                </Badge>
            )
        }
        if (status === 'processed') {
            return (
                <Badge variant="default" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Processed
                </Badge>
            )
        }
        if (status === 'error') {
            return (
                <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Error
                </Badge>
            )
        }
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
        if (searchQuery) {
            return (
                <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">No memos found matching your search</p>
                </div>
            )
        }

        return (
            <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                    <div className="relative p-6 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                        <FileUp className="h-12 w-12 text-primary" />
                    </div>
                </div>

                <h3 className="text-xl font-semibold text-foreground mb-2">Create your first Memo</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                    Memos are the foundation of your knowledge base. Upload documents, paste text, or add content to
                    start building your intelligent retrieval system.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                    <Button onClick={onCreateMemo} size="lg" className="gap-2">
                        <FileUp className="h-4 w-4" />
                        Create Memo
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="rounded-md border overflow-x-auto">
            <Table className="w-full table-fixed">
                <TableHeader>
                    <TableRow>
                        {showRelevanceColumn && <TableHead>Relevance</TableHead>}
                        <TableHead className="w-[20%]">Title</TableHead>
                        <TableHead className="w-[40%]">Summary</TableHead>
                        <TableHead className="w-[10%]">Status</TableHead>
                        <TableHead className="w-[10%]">Created</TableHead>
                        <TableHead className="w-[10%]"></TableHead>
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
                            <TableCell>{getStatusBadge(memo.processing_status)}</TableCell>
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
