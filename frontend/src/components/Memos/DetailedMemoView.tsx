import { DetailedMemo } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
    Calendar,
    Clock,
    FileText,
    Hash,
    Tag,
    Layers,
    Archive,
    AlertCircle,
    CheckCircle,
    ExternalLink,
    Code,
    Database,
} from 'lucide-react'

interface DetailedMemoViewProps {
    memo: DetailedMemo
}

export const DetailedMemoView = ({ memo }: DetailedMemoViewProps) => {
    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const formatDateShort = (dateString: string) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    }

    const getStatusBadge = () => {
        if (memo.archived) {
            return (
                <Badge variant="secondary" className="flex items-center gap-1">
                    <Archive className="h-3 w-3" />
                    Archived
                </Badge>
            )
        }
        if (memo.pending) {
            return (
                <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Pending
                </Badge>
            )
        }
        return (
            <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Processed
            </Badge>
        )
    }

    const getTypeIcon = () => {
        switch (memo.type?.toLowerCase()) {
            case 'code':
                return <Code className="h-4 w-4" />
            case 'document':
                return <FileText className="h-4 w-4" />
            default:
                return <Database className="h-4 w-4" />
        }
    }

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="space-y-4">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            {getTypeIcon()}
                            <h1 className="text-2xl font-bold">{memo.title}</h1>
                        </div>
                        {memo.source && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <ExternalLink className="h-4 w-4" />
                                <span>Source: {memo.source}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {getStatusBadge()}
                        {memo.type && (
                            <Badge variant="outline" className="flex items-center gap-1">
                                {getTypeIcon()}
                                {memo.type}
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Metadata Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <div className="font-medium">Created</div>
                            <div className="text-muted-foreground">{formatDate(memo.created_at)}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <div className="font-medium">Updated</div>
                            <div className="text-muted-foreground">{formatDate(memo.updated_at)}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <div className="font-medium">Content Length</div>
                            <div className="text-muted-foreground">
                                {memo.content_length.toLocaleString()} characters
                            </div>
                        </div>
                    </div>
                </div>

                {memo.client_reference_id && (
                    <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Reference ID:</span>
                        <code className="bg-muted px-2 py-1 rounded text-xs">{memo.client_reference_id}</code>
                    </div>
                )}

                {memo.expiration_date && (
                    <div className="flex items-center gap-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        <span className="font-medium">Expires:</span>
                        <span className="text-amber-600">{formatDate(memo.expiration_date)}</span>
                    </div>
                )}
            </div>

            <Separator />

            {/* Content Section */}
            {memo.content && (
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
                                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                                    {memo.content}
                                </pre>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Summary Section */}
            {memo.summary && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm leading-relaxed">{memo.summary}</p>
                    </CardContent>
                </Card>
            )}

            {/* Tags Section */}
            {memo.tags && memo.tags.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Tag className="h-5 w-5" />
                            Tags ({memo.tags.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {memo.tags.map((tag) => (
                                <Badge key={tag.uuid} variant="secondary" className="flex items-center gap-1">
                                    <Tag className="h-3 w-3" />
                                    {tag.tag}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Chunks Section */}
            {memo.chunks && memo.chunks.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Layers className="h-5 w-5" />
                            Chunks ({memo.chunks.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {memo.chunks
                                .sort((a, b) => a.chunk_index - b.chunk_index)
                                .map((chunk) => (
                                    <div key={chunk.uuid} className="border rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <Badge variant="outline" className="text-xs">
                                                Chunk {chunk.chunk_index}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {chunk.chunk_content.length} characters
                                            </span>
                                        </div>
                                        <div className="h-32 w-full overflow-y-auto">
                                            <p className="text-sm leading-relaxed">{chunk.chunk_content}</p>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Metadata Section */}
            {memo.metadata && Object.keys(memo.metadata).length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            Metadata
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-48 w-full overflow-y-auto">
                            <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto">
                                {JSON.stringify(memo.metadata, null, 2)}
                            </pre>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
