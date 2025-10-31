import { useEffect, useRef } from 'react'
import type { SearchMethod } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Search } from 'lucide-react'

const DEBOUNCE_DELAY_MS = 500

interface MemosSearchBarProps {
    searchQuery: string
    searchMethod: SearchMethod
    loading: boolean
    onSearchQueryChange: (query: string) => void
    onSearch: () => void
    onClear: () => void
}

export const MemosSearchBar = ({
    searchQuery,
    searchMethod,
    loading,
    onSearchQueryChange,
    onSearch,
    onClear,
}: MemosSearchBarProps) => {
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
    const previousSearchMethodRef = useRef<SearchMethod>(searchMethod)
    const isInitialMountRef = useRef(true)
    const onSearchRef = useRef(onSearch)
    const onClearRef = useRef(onClear)
    const previousQueryRef = useRef(searchQuery)

    useEffect(() => {
        onSearchRef.current = onSearch
    }, [onSearch])

    useEffect(() => {
        onClearRef.current = onClear
    }, [onClear])

    useEffect(() => {
        if (isInitialMountRef.current) {
            isInitialMountRef.current = false
            previousQueryRef.current = searchQuery
            return
        }

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current)
        }

        if (!searchQuery.trim() && previousQueryRef.current.trim()) {
            previousQueryRef.current = searchQuery
            onClearRef.current()
            return
        }

        previousQueryRef.current = searchQuery

        if (!searchQuery.trim()) {
            return
        }

        debounceTimerRef.current = setTimeout(() => {
            onSearchRef.current()
        }, DEBOUNCE_DELAY_MS)

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current)
            }
        }
    }, [searchQuery])

    useEffect(() => {
        if (previousSearchMethodRef.current === searchMethod) {
            return
        }

        previousSearchMethodRef.current = searchMethod

        if (searchQuery.trim()) {
            onSearchRef.current()
        }
    }, [searchMethod, searchQuery])

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current)
            }
            onSearchRef.current()
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
                        onKeyUp={handleKeyPress}
                        className="w-full"
                    />
                </div>
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
