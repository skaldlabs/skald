import type { SearchMethod } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Search, X } from 'lucide-react'

const getSearchMethodLabel = (method: SearchMethod): string => {
    const labels: Record<SearchMethod, string> = {
        chunk_vector_search: 'Semantic Search',
        title_contains: 'Title Contains',
        title_startswith: 'Title Starts With',
    }
    return labels[method] || method
}

interface MemosSearchResultsBannerProps {
    searchQuery: string
    searchMethod: SearchMethod
    totalCount: number
    onClear: () => void
}

export const MemosSearchResultsBanner = ({
    searchQuery,
    searchMethod,
    totalCount,
    onClear,
}: MemosSearchResultsBannerProps) => {
    if (!searchQuery.trim()) {
        return null
    }

    return (
        <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 flex items-center py-3">
            <Search className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <AlertDescription className="flex items-center justify-between flex-1 m-0 py-0">
                <div className="flex items-center gap-2 flex-1 flex-wrap">
                    <span className="text-blue-900 dark:text-blue-100 font-medium">
                        Showing {totalCount.toLocaleString()} search {totalCount === 1 ? 'result' : 'results'}
                    </span>
                    <span className="text-blue-700 dark:text-blue-300">for</span>
                    <span className="text-blue-900 dark:text-blue-100 font-semibold">"{searchQuery}"</span>
                    <span className="text-blue-600 dark:text-blue-400 text-xs">
                        ({getSearchMethodLabel(searchMethod)})
                    </span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClear}
                    className="h-7 text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30 flex-shrink-0 ml-2"
                >
                    <X className="h-4 w-4 mr-1" />
                    Clear search
                </Button>
            </AlertDescription>
        </Alert>
    )
}
