import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProjectStore } from '@/stores/projectStore'
import { useMemoStore } from '@/stores/memoStore'
import type { Memo, DetailedMemo } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { RefreshCw, Plus } from 'lucide-react'
import { MemosSearchBar } from './MemosSearchBar'
import { MemosSearchResultsBanner } from './MemosSearchResultsBanner'
import { MemosTable } from './MemosTable'
import { MemosPagination } from './MemosPagination'
import { DeleteMemoDialog } from './DeleteMemoDialog'
import { ViewMemoDialog } from './ViewMemoDialog'
import { CreateMemoModal } from './CreateMemoModal'
import { PageHeader } from '@/components/AppLayout/PageHeader'
import { toast } from 'sonner'

export const MemosDashboard = () => {
    const { uuid: projectUuid, memoUuid } = useParams<{ uuid: string; memoUuid?: string }>()
    const navigate = useNavigate()
    const currentProject = useProjectStore((state) => state.currentProject)

    const memos = useMemoStore((state) => state.memos)
    const loading = useMemoStore((state) => state.loading)
    const searchQuery = useMemoStore((state) => state.searchQuery)
    const searchMethod = useMemoStore((state) => state.searchMethod)
    const totalCount = useMemoStore((state) => state.totalCount)
    const currentPage = useMemoStore((state) => state.currentPage)
    const pageSize = useMemoStore((state) => state.pageSize)
    const fetchMemos = useMemoStore((state) => state.fetchMemos)
    const searchMemos = useMemoStore((state) => state.searchMemos)
    const deleteMemo = useMemoStore((state) => state.deleteMemo)
    const getMemoDetails = useMemoStore((state) => state.getMemoDetails)
    const setSearchQuery = useMemoStore((state) => state.setSearchQuery)
    const clearSearch = useMemoStore((state) => state.clearSearch)
    const isSearchMode = useMemoStore((state) => state.isSearchMode)
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

    const handleSearch = async () => {
        if (!currentProject) return
        await searchMemos(searchQuery, searchMethod)
    }

    const handlePageChange = async (page: number) => {
        if (!isSearchMode) {
            await fetchMemos(page, pageSize)
        }
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

    const handleClearSearch = () => {
        clearSearch()
    }

    const handleRefresh = () => {
        fetchMemos()
    }

    useEffect(() => {
        if (currentProject) {
            fetchMemos()
        }
    }, [currentProject, fetchMemos])

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
            <PageHeader title="Memos">
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
            <MemosSearchBar
                searchQuery={searchQuery}
                searchMethod={searchMethod}
                loading={loading}
                onSearchQueryChange={setSearchQuery}
                onSearch={handleSearch}
                onClear={handleClearSearch}
            />

            <MemosSearchResultsBanner
                searchQuery={searchQuery}
                searchMethod={searchMethod}
                totalCount={totalCount}
                onClear={handleClearSearch}
            />

            <MemosTable
                memos={memos}
                loading={loading}
                searchQuery={searchQuery}
                searchMethod={searchMethod}
                onViewMemo={handleViewMemo}
                onDeleteMemo={setMemoToDelete}
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
