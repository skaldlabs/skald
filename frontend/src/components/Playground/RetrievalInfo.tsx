import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useProjectStore } from '@/stores/projectStore'
import { useMemoStore } from '@/stores/memoStore'
import {
    Info,
    Search,
    Brain,
    ChevronDown,
    ChevronUp,
    PenLine,
    ArrowUpDown,
    Layers,
    History,
    Quote,
    FileUp,
} from 'lucide-react'

const allSteps = [
    {
        icon: PenLine,
        title: 'Query Rewriting',
        description: 'Optimizes your question for better retrieval',
    },
    {
        icon: Search,
        title: 'Vector Search',
        description: 'Finds relevant chunks using semantic similarity',
    },
    {
        icon: ArrowUpDown,
        title: 'Re-ranking',
        description: 'Reorders results by relevance to your query',
    },
    {
        icon: Layers,
        title: 'Context Assembly',
        description: 'Compose coherent context using summaries, tags, chunks, and metadata',
    },
    {
        icon: Brain,
        title: 'LLM Generation',
        description: 'Generates response using assembled context with support for various frontier models',
    },
    {
        icon: History,
        title: 'Chat Memory',
        description: 'Maintains conversation history for continuity',
    },
    {
        icon: Quote,
        title: 'Source Citations',
        description: 'References original documents in responses',
    },
]

interface RetrievalInfoProps {
    variant: 'chat' | 'search'
}

export const RetrievalInfo = ({ variant }: RetrievalInfoProps) => {
    const { currentProject } = useProjectStore()
    const { memos, fetchMemos, loading: memosLoading } = useMemoStore()
    const [showRetrievalInfo, setShowRetrievalInfo] = useState(false)
    const [hasInitializedRetrievalInfo, setHasInitializedRetrievalInfo] = useState(false)

    const isChat = variant === 'chat'
    const steps = isChat ? allSteps : allSteps.slice(0, 3)
    const gridCols = isChat ? 'lg:grid-cols-7' : 'lg:grid-cols-3'

    useEffect(() => {
        if (currentProject) {
            fetchMemos()
        }
    }, [currentProject, fetchMemos])

    // Auto-expand retrieval info if no memos exist
    useEffect(() => {
        if (!memosLoading && !hasInitializedRetrievalInfo && memos.length === 0) {
            setShowRetrievalInfo(true)
            setHasInitializedRetrievalInfo(true)
        }
    }, [memosLoading, memos.length, hasInitializedRetrievalInfo])

    if (!currentProject) {
        return (
            <div className="no-project-alert">
                <Info className="h-4 w-4" />
                <p>Please select a project to start {isChat ? 'chatting with' : 'searching'} your data.</p>
            </div>
        )
    }

    return (
        <>
            {/* Retrieval Explanation Section */}
            <div className="rounded-lg border bg-card p-4 mb-4" style={{ flexShrink: 0 }}>
                <button
                    onClick={() => setShowRetrievalInfo(!showRetrievalInfo)}
                    className="w-full flex items-center justify-between text-left"
                >
                    <div>
                        <h3 className="text-sm font-medium text-foreground">
                            About Skald's {isChat ? 'Chat' : 'Search'} API
                        </h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {isChat ? (
                                <>
                                    This UI sandbox let's you ask questions from your memos to simulate using our Chat
                                    API. Click <b>Configure</b> to customize the retrieval pipeline to your exact needs.
                                </>
                            ) : (
                                <>This UI sandbox let's you search your memos to simulate using our Search API.</>
                            )}
                        </p>
                    </div>
                    {showRetrievalInfo ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-4" />
                    ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-4" />
                    )}
                </button>

                {showRetrievalInfo && (
                    <div className="mt-4 pt-4 border-t">
                        <p className="text-xs text-muted-foreground mb-3">
                            {isChat
                                ? 'We handle the complete RAG pipeline for you:'
                                : 'We handle the search pipeline for you:'}
                        </p>
                        <div className={`grid grid-cols-2 sm:grid-cols-3 ${gridCols} gap-2`}>
                            {steps.map((step, index) => (
                                <div
                                    key={step.title}
                                    className="relative flex flex-col items-center text-center p-3 rounded-md bg-muted/50 hover:bg-muted/80 transition-colors"
                                >
                                    <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-semibold flex items-center justify-center">
                                        {index + 1}
                                    </div>
                                    <div className="p-2 rounded-full bg-primary/10 text-primary mb-2">
                                        <step.icon className="h-4 w-4" />
                                    </div>
                                    <h4 className="text-xs font-medium text-foreground leading-tight">{step.title}</h4>
                                    <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
                                        {step.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* No memos alert */}
            {!memosLoading && memos.length === 0 && (
                <div
                    className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 mb-4"
                    style={{ flexShrink: 0 }}
                >
                    <div className="flex items-start gap-3">
                        <FileUp className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-medium text-foreground">No data ingested yet</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                                To start using {isChat ? 'Chat' : 'Search'}, you need to ingest some data first. Head
                                over to the{' '}
                                <Link
                                    to={`/projects/${currentProject.uuid}/memos`}
                                    className="font-medium text-primary hover:underline"
                                >
                                    Ingestion page
                                </Link>{' '}
                                to create your first memo.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
