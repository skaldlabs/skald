import type { SearchMethod } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Search } from 'lucide-react'

const SEARCH_METHODS: { value: SearchMethod; label: string }[] = [
    { value: 'chunk_vector_search', label: 'Semantic Search (Chunks)' },
    { value: 'summary_vector_search', label: 'Semantic Search (Summary)' },
    { value: 'title_contains', label: 'Title Contains' },
    { value: 'title_startswith', label: 'Title Starts With' },
]

interface MemosSearchBarProps {
    searchQuery: string
    searchMethod: SearchMethod
    loading: boolean
    onSearchQueryChange: (query: string) => void
    onSearchMethodChange: (method: SearchMethod) => void
    onSearch: () => void
    onClear: () => void
}

export const MemosSearchBar = ({
    searchQuery,
    searchMethod,
    loading,
    onSearchQueryChange,
    onSearchMethodChange,
    onSearch,
    onClear,
}: MemosSearchBarProps) => {
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onSearch()
        }
    }

    return (
        <Card className="p-4">
            <div className="flex gap-3">
                <div className="flex-1">
                    <Input
                        placeholder="Search memos..."
                        value={searchQuery}
                        onChange={(e) => onSearchQueryChange(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="w-full"
                    />
                </div>
                <Select value={searchMethod} onValueChange={(value) => onSearchMethodChange(value as SearchMethod)}>
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
                <Button onClick={onSearch} disabled={loading || !searchQuery.trim()}>
                    <Search className="h-4 w-4 mr-2" />
                    {loading ? 'Searching...' : 'Search'}
                </Button>
                {searchQuery && (
                    <Button onClick={onClear} variant="outline">
                        Clear
                    </Button>
                )}
            </div>
        </Card>
    )
}
