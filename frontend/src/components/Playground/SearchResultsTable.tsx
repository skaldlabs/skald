import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SearchResult } from '@/lib/types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { useProjectStore } from '@/stores/projectStore'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Search, Loader2, ExternalLink, FileText } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const formatRelevanceScore = (distance: number | null | undefined): string => {
    if (distance === null || distance === undefined) return 'N/A'
    // Convert distance to similarity percentage
    // With reranking, distance = 1 - relevance_score, so distance ranges from 0 (most relevant) to 1 (least relevant)
    const similarity = Math.max(0, Math.min(100, (1 - distance) * 100))
    return `${similarity.toFixed(1)}%`
}

export const SearchResultsTable = () => {
    const { currentProject } = useProjectStore()
    const [searchQuery, setSearchQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [loading, setLoading] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)
    const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null)

    const handleSearch = async () => {
        if (!searchQuery.trim() || !currentProject) return

        setLoading(true)
        setHasSearched(true)

        try {
            const response = await api.post<{ results: SearchResult[] }>('/v1/search/', {
                query: searchQuery,
                filters: [],
                limit: 25,
                project_id: currentProject.uuid,
            })

            if (response.error || !response.data) {
                throw new Error(response.error || 'Search failed')
            }

            setResults(response.data.results)
        } catch (error) {
            console.error('Search failed:', error)
            setResults([])
        } finally {
            setLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch()
        }
    }

    const truncateText = (text: string, maxLength: number) => {
        if (!text) return 'N/A'
        return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
    }

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search through memo chunks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="pl-10"
                    />
                </div>
                <Button onClick={handleSearch} disabled={loading || !searchQuery.trim()}>
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Searching...
                        </>
                    ) : (
                        'Search'
                    )}
                </Button>
            </div>

            {loading && (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                    ))}
                </div>
            )}

            {!loading && hasSearched && results.length === 0 && (
                <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">No results found</p>
                </div>
            )}

            {!loading && results.length > 0 && (
                <div className="rounded-md border overflow-x-auto">
                    <Table className="w-full">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Relevance</TableHead>
                                <TableHead>Chunk Content</TableHead>
                                <TableHead>Memo Title</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {results.map((result, index) => (
                                <TableRow
                                    key={`${result.chunk_uuid}-${index}`}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => setSelectedResult(result)}
                                >
                                    <TableCell className="text-sm font-medium">
                                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                            {formatRelevanceScore(result.distance)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {truncateText(result.chunk_content, 100)}
                                    </TableCell>
                                    <TableCell className="font-medium">{result.memo_title}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <Dialog open={selectedResult !== null} onOpenChange={(open) => !open && setSelectedResult(null)}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Search Result Details</DialogTitle>
                    </DialogHeader>
                    {selectedResult && (
                        <div className="space-y-6">
                            {/* Source Memo Section */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ExternalLink className="h-5 w-5" />
                                        Source memo
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {currentProject ? (
                                        <Link
                                            to={`/projects/${currentProject.uuid}/memos/${selectedResult.memo_uuid}`}
                                            className="text-primary hover:underline"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {selectedResult.memo_title}
                                        </Link>
                                    ) : (
                                        <span className="text-muted-foreground">{selectedResult.memo_title}</span>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Chunk Content Section */}
                            {selectedResult.chunk_content && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <FileText className="h-5 w-5" />
                                            Content
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-64 w-full overflow-y-auto">
                                            <div className="prose prose-sm max-w-none">
                                                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed react-markdown">
                                                    <ReactMarkdown>{selectedResult.chunk_content}</ReactMarkdown>
                                                </pre>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
