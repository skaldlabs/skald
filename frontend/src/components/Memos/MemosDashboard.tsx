import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProjectStore } from '@/stores/projectStore'
import { useMemoStore } from '@/stores/memoStore'
import type { Memo, DetailedMemo } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { RefreshCw, Plus, FileSearch, Scissors, Database, Sparkles, Tags, ChevronDown, ChevronUp } from 'lucide-react'
import { MemosTable } from './MemosTable'
import { MemosPagination } from './MemosPagination'
import { DeleteMemoDialog } from './DeleteMemoDialog'
import { ViewMemoDialog } from './ViewMemoDialog'
import { CreateMemoModal } from './CreateMemoModal'
import { PageHeader } from '@/components/AppLayout/PageHeader'
import { toast } from 'sonner'

const pipelineSteps = [
    {
        icon: FileSearch,
        title: 'Data Type Detection',
        description: 'Automatically identifies document formats and structures',
    },
    {
        icon: Scissors,
        title: 'Smart Chunking',
        description: 'Determines optimal chunk strategy based on content type',
    },
    {
        icon: Database,
        title: 'Vector Embedding',
        description: 'Creates embeddings and stores them in vector database',
    },
    {
        icon: Sparkles,
        title: 'Summary Generation',
        description: 'Generates concise summaries to improve retrieval',
    },
    {
        icon: Tags,
        title: 'Auto-Tagging',
        description: 'Extracts relevant tags automatically to speed up and improve retrieval performance',
    },
]

export const MemosDashboard = () => {
    const { uuid: projectUuid, memoUuid } = useParams<{ uuid: string; memoUuid?: string }>()
    const navigate = useNavigate()
    const currentProject = useProjectStore((state) => state.currentProject)
    const [showPipelineInfo, setShowPipelineInfo] = useState(false)
    const [hasInitializedPipelineInfo, setHasInitializedPipelineInfo] = useState(false)

    const memos = useMemoStore((state) => state.memos)
    const loading = useMemoStore((state) => state.loading)
    const totalCount = useMemoStore((state) => state.totalCount)
    const currentPage = useMemoStore((state) => state.currentPage)
    const pageSize = useMemoStore((state) => state.pageSize)
    const fetchMemos = useMemoStore((state) => state.fetchMemos)
    const deleteMemo = useMemoStore((state) => state.deleteMemo)
    const getMemoDetails = useMemoStore((state) => state.getMemoDetails)
    const startPollingProcessingMemos = useMemoStore((state) => state.startPollingProcessingMemos)
    const stopAllPolling = useMemoStore((state) => state.stopAllPolling)

    const [selectedMemo, setSelectedMemo] = useState<DetailedMemo | null>(null)
    const [memoToDelete, setMemoToDelete] = useState<Memo | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [createModalOpen, setCreateModalOpen] = useState(false)

    const copyMemoLinkToClipboard = async (memoUuid: string) => {
        if (!projectUuid) {
            toast.error('Project not found for memo share link')
            return
        }

        const memoUrl = `${window.location.origin}/projects/${projectUuid}/memos/${memoUuid}`

        try {
            await navigator.clipboard.writeText(memoUrl)
            toast.success('Memo link copied to clipboard!')
        } catch {
            toast.error('Failed to copy link to clipboard')
        }
    }

    const handlePageChange = async (page: number) => {
        await fetchMemos(page, pageSize)
    }

    const handleDelete = async () => {
        if (!memoToDelete) return

        setDeleting(true)
        const success = await deleteMemo(memoToDelete.uuid)
        setDeleting(false)

        if (success) {
            setMemoToDelete(null)
        }
    }

    const handleViewMemo = async (memo: Memo) => {
        const memoDetails = await getMemoDetails(memo.uuid)
        if (memoDetails) {
            setSelectedMemo(memoDetails)
            if (projectUuid) {
                navigate(`/projects/${projectUuid}/memos/${memo.uuid}`, { replace: true })
            }
        }
    }

    const handleCloseMemo = () => {
        setSelectedMemo(null)
        if (projectUuid) {
            navigate(`/projects/${projectUuid}/memos`, { replace: true })
        }
    }

    const handleShareDetailedMemo = async (memo: DetailedMemo) => {
        await copyMemoLinkToClipboard(memo.uuid)
    }

    const handleDeleteFromDetail = (memo: DetailedMemo) => {
        setMemoToDelete({
            uuid: memo.uuid,
            created_at: memo.created_at,
            updated_at: memo.updated_at,
            title: memo.title,
            summary: memo.summary ?? '',
            metadata: memo.metadata,
            client_reference_id: memo.client_reference_id,
            processing_status: memo.processing_status,
        })
        handleCloseMemo()
    }

    const handleMemoUpdated = async () => {
        if (selectedMemo) {
            const updatedMemo = await getMemoDetails(selectedMemo.uuid)
            if (updatedMemo) {
                setSelectedMemo(updatedMemo)
            }
        }
        fetchMemos(currentPage, pageSize)
    }

    const handleRefresh = () => {
        fetchMemos()
    }

    useEffect(() => {
        if (currentProject) {
            fetchMemos()
        }
    }, [currentProject, fetchMemos])

    // Auto-expand pipeline info if no memos exist
    useEffect(() => {
        if (!loading && !hasInitializedPipelineInfo && memos.length === 0) {
            setShowPipelineInfo(true)
            setHasInitializedPipelineInfo(true)
        }
    }, [loading, memos.length, hasInitializedPipelineInfo])

    useEffect(() => {
        const loadMemoFromUrl = async () => {
            if (memoUuid && currentProject) {
                const memoDetails = await getMemoDetails(memoUuid)
                if (memoDetails) {
                    setSelectedMemo(memoDetails)
                } else {
                    toast.error('Memo not found or failed to load')
                }
            } else if (!memoUuid) {
                setSelectedMemo(null)
            }
        }

        loadMemoFromUrl()
    }, [memoUuid, currentProject, getMemoDetails])

    // Start polling for processing memos
    useEffect(() => {
        startPollingProcessingMemos()
    }, [memos, startPollingProcessingMemos])

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            stopAllPolling()
        }
    }, [stopAllPolling])

    if (!currentProject) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <p className="text-muted-foreground">Please select a project to view memos</p>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <PageHeader title="Ingestion">
                <div className="flex gap-2">
                    <Button onClick={() => setCreateModalOpen(true)} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Memo
                    </Button>
                    <Button onClick={handleRefresh} disabled={loading} variant="outline" size="sm">
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </PageHeader>

            {/* Pipeline Explanation Section */}
            <div className="rounded-lg border bg-card p-4">
                <button
                    onClick={() => setShowPipelineInfo(!showPipelineInfo)}
                    className="w-full flex items-center justify-between text-left"
                >
                    <div>
                        <h3 className="text-sm font-medium text-foreground">What's a memo?</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            <span className="font-medium text-foreground">Memos</span> are the unit of knowledge in
                            Skald. They can be anything from a document, an email, a note, some code, or any other piece
                            of information.
                        </p>
                    </div>
                    {showPipelineInfo ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-4" />
                    ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-4" />
                    )}
                </button>

                {showPipelineInfo && (
                    <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground mt-1">
                            Our pipeline does extensive pre-processing of memos, preparing them for intelligent
                            retrieval.
                        </p>
                        <br />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                            {pipelineSteps.map((step, index) => (
                                <div
                                    key={step.title}
                                    className="relative flex flex-col items-center text-center p-3 rounded-md bg-muted/50"
                                >
                                    {index < pipelineSteps.length - 1 && (
                                        <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 w-3 h-0.5 bg-border" />
                                    )}
                                    <div className="p-2 rounded-full bg-primary/10 text-primary mb-2">
                                        <step.icon className="h-4 w-4" />
                                    </div>
                                    <h4 className="text-xs font-medium text-foreground">{step.title}</h4>
                                    <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <MemosTable
                memos={memos}
                loading={loading}
                searchQuery=""
                searchMethod="chunk_vector_search"
                onViewMemo={handleViewMemo}
                onDeleteMemo={setMemoToDelete}
                onCreateMemo={() => setCreateModalOpen(true)}
            />

            <MemosPagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalCount={totalCount}
                loading={loading}
                onPageChange={handlePageChange}
            />

            <CreateMemoModal open={createModalOpen} onOpenChange={setCreateModalOpen} />

            <ViewMemoDialog
                memo={selectedMemo}
                onClose={handleCloseMemo}
                onShareMemo={handleShareDetailedMemo}
                onDeleteMemo={handleDeleteFromDetail}
                onMemoUpdated={handleMemoUpdated}
            />

            <DeleteMemoDialog
                memo={memoToDelete}
                deleting={deleting}
                onConfirm={handleDelete}
                onCancel={() => setMemoToDelete(null)}
            />
        </div>
    )
}
