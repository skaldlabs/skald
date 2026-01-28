import { useState } from 'react'
import { DetailedMemo } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
    Calendar,
    Clock,
    FileText,
    Hash,
    Tag,
    Archive,
    AlertCircle,
    CheckCircle,
    ExternalLink,
    Code,
    Database,
    Shield,
    ChevronDown,
    ChevronRight,
    Pencil,
    X,
    Check,
    Loader2,
    Eye,
    FileCode,
} from 'lucide-react'
import { formatDate } from '@/components/utils/dateUtils'
import { addMonths, isBefore } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useMemoStore } from '@/stores/memoStore'
import { toast } from 'sonner'

interface DetailedMemoViewProps {
    memo: DetailedMemo
    onMemoUpdated?: () => void
}

export const DetailedMemoView = ({ memo, onMemoUpdated }: DetailedMemoViewProps) => {
    const [isEditing, setIsEditing] = useState(false)
    const [editedContent, setEditedContent] = useState(memo.content || '')
    const [isSaving, setIsSaving] = useState(false)
    const [showPreview, setShowPreview] = useState(false)
    const [isSummaryOpen, setIsSummaryOpen] = useState(false)
    const [isMetadataOpen, setIsMetadataOpen] = useState(false)

    const updateMemo = useMemoStore((state) => state.updateMemo)

    const handleStartEdit = () => {
        setEditedContent(memo.content || '')
        setIsEditing(true)
        setShowPreview(false)
    }

    const handleCancelEdit = () => {
        setIsEditing(false)
        setEditedContent(memo.content || '')
        setShowPreview(false)
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const success = await updateMemo(memo.uuid, { content: editedContent })
            if (success) {
                toast.success('Content updated. Memo will be reprocessed.')
                setIsEditing(false)
                onMemoUpdated?.()
            }
        } finally {
            setIsSaving(false)
        }
    }

    const getExpirationStyles = (dateString: string) => {
        const expirationDate = new Date(dateString)
        const now = new Date()
        const oneMonthFromNow = addMonths(now, 1)
        const isExpired = isBefore(expirationDate, now)
        const isExpiringSoon = isBefore(expirationDate, oneMonthFromNow)

        if (isExpired) return 'text-destructive'
        if (isExpiringSoon) return 'text-amber-600'
        return 'text-muted-foreground'
    }

    const getStatusBadge = () => {
        if (memo.archived) {
            return (
                <Badge variant="secondary" className="gap-1">
                    <Archive className="h-3 w-3" />
                    Archived
                </Badge>
            )
        }
        if (memo.processing_status === 'processing') {
            return (
                <Badge variant="outline" className="gap-1 text-amber-600 border-amber-600/30">
                    <Clock className="h-3 w-3 animate-spin" />
                    Processing
                </Badge>
            )
        }
        if (memo.processing_status === 'processed') {
            return (
                <Badge variant="outline" className="gap-1 text-green-600 border-green-600/30">
                    <CheckCircle className="h-3 w-3" />
                    Processed
                </Badge>
            )
        }
        if (memo.processing_status === 'error') {
            return (
                <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Error
                </Badge>
            )
        }
    }

    const getTypeIcon = () => {
        switch (memo.type?.toLowerCase()) {
            case 'code':
                return <Code className="h-5 w-5 text-muted-foreground" />
            case 'document':
                return <FileText className="h-5 w-5 text-muted-foreground" />
            default:
                return <FileCode className="h-5 w-5 text-muted-foreground" />
        }
    }

    const displayContent = memo.content || memo.chunks?.map((c) => c.chunk_content).join('\n\n') || ''
    const canEdit = !!memo.content

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                        <div className="mt-0.5">{getTypeIcon()}</div>
                        <div className="min-w-0">
                            <h1 className="text-lg font-semibold leading-tight truncate">{memo.title}</h1>
                            <div className="flex items-center gap-2 mt-1.5">
                                {getStatusBadge()}
                                {memo.type && (
                                    <Badge variant="secondary" className="text-xs">
                                        {memo.type}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Metadata pills */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(memo.created_at)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(memo.updated_at)}
                    </span>
                    {memo.source && (
                        <span className="inline-flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" />
                            {memo.source}
                        </span>
                    )}
                    {memo.client_reference_id && (
                        <span className="inline-flex items-center gap-1 font-mono">
                            <Hash className="h-3 w-3" />
                            {memo.client_reference_id}
                        </span>
                    )}
                    {memo.expiration_date && (
                        <span className={`inline-flex items-center gap-1 ${getExpirationStyles(memo.expiration_date)}`}>
                            <AlertCircle className="h-3 w-3" />
                            {isBefore(new Date(memo.expiration_date), new Date()) ? 'Expired' : 'Expires'}{' '}
                            {formatDate(memo.expiration_date)}
                        </span>
                    )}
                </div>
            </div>

            {/* Content Section */}
            <div
                className={`rounded-lg border transition-colors ${
                    isEditing ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20' : 'bg-muted/30'
                }`}
            >
                {/* Content Header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b bg-background/50 rounded-t-lg">
                    <span className="text-sm font-medium text-muted-foreground">Content</span>
                    {canEdit && (
                        <div className="flex items-center gap-1">
                            {isEditing ? (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-xs"
                                        onClick={() => setShowPreview(!showPreview)}
                                    >
                                        <Eye className="h-3.5 w-3.5 mr-1" />
                                        {showPreview ? 'Edit' : 'Preview'}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-xs"
                                        onClick={handleCancelEdit}
                                        disabled={isSaving}
                                    >
                                        <X className="h-3.5 w-3.5 mr-1" />
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="h-7 px-3 text-xs"
                                        onClick={handleSave}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                                        ) : (
                                            <Check className="h-3.5 w-3.5 mr-1" />
                                        )}
                                        Save
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                    onClick={handleStartEdit}
                                >
                                    <Pencil className="h-3.5 w-3.5 mr-1" />
                                    Edit
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {/* Content Body */}
                {isEditing && !showPreview ? (
                    <Textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="min-h-[350px] resize-y font-mono text-sm border-0 rounded-t-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                        placeholder="Enter markdown content..."
                    />
                ) : (
                    <div className="min-h-[350px] max-h-[450px] overflow-y-auto p-4">
                        <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-p:text-muted-foreground prose-p:leading-relaxed prose-table:w-full prose-th:border prose-th:border-border prose-th:px-3 prose-th:py-2 prose-th:bg-muted/50 prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {isEditing ? editedContent : displayContent}
                            </ReactMarkdown>
                        </div>
                    </div>
                )}
            </div>

            {/* Tags & Scopes Row */}
            {((memo.tags && memo.tags.length > 0) || (memo.scopes && Object.keys(memo.scopes).length > 0)) && (
                <div className="flex flex-wrap items-center gap-3">
                    {memo.tags && memo.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                            {memo.tags.map((tag) => (
                                <Badge key={tag.uuid} variant="secondary" className="text-xs font-normal">
                                    {tag.tag}
                                </Badge>
                            ))}
                        </div>
                    )}
                    {memo.scopes && Object.keys(memo.scopes).length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                            {Object.entries(memo.scopes).map(([key, value]) => (
                                <Badge key={key} variant="outline" className="text-xs font-normal">
                                    {key}: {value}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Collapsible Sections */}
            <div className="space-y-1">
                {/* Summary */}
                {memo.summary && (
                    <Collapsible open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
                        <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 px-3 rounded-md hover:bg-muted/50 transition-colors text-left">
                            {isSummaryOpen ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Summary</span>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <div className="ml-10 mr-3 mb-2 p-3 rounded-md bg-muted/30 text-sm text-muted-foreground leading-relaxed">
                                {memo.summary}
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                )}

                {/* Metadata */}
                {memo.metadata && Object.keys(memo.metadata).length > 0 && (
                    <Collapsible open={isMetadataOpen} onOpenChange={setIsMetadataOpen}>
                        <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 px-3 rounded-md hover:bg-muted/50 transition-colors text-left">
                            {isMetadataOpen ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <Database className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Metadata</span>
                            <span className="text-xs text-muted-foreground">({Object.keys(memo.metadata).length})</span>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <pre className="ml-10 mr-3 mb-2 p-3 rounded-md bg-muted/50 text-xs font-mono overflow-x-auto max-h-40 overflow-y-auto">
                                {JSON.stringify(memo.metadata, null, 2)}
                            </pre>
                        </CollapsibleContent>
                    </Collapsible>
                )}
            </div>
        </div>
    )
}
