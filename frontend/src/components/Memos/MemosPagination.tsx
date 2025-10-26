import { Button } from '@/components/ui/button'

interface MemosPaginationProps {
    currentPage: number
    pageSize: number
    totalCount: number
    loading: boolean
    onPageChange: (page: number) => void
}

export const MemosPagination = ({ currentPage, pageSize, totalCount, loading, onPageChange }: MemosPaginationProps) => {
    const totalPages = Math.ceil(totalCount / pageSize)

    return (
        <div className="flex items-center justify-between px-4 py-4 border-t">
            <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of{' '}
                {totalCount} memos
            </p>
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                >
                    Previous
                </Button>
                <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, i) => {
                        const pageNum = i + 1
                        // Show first page, last page, current page, and pages around current
                        if (pageNum === 1 || pageNum === totalPages || Math.abs(pageNum - currentPage) <= 1) {
                            return (
                                <Button
                                    key={pageNum}
                                    variant={currentPage === pageNum ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => onPageChange(pageNum)}
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
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                >
                    Next
                </Button>
            </div>
        </div>
    )
}
