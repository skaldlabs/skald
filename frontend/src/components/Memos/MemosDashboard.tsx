import { useEffect, useState } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { useMemoStore } from '@/stores/memoStore'
import type { Memo, DetailedMemo, SearchMethod } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { MemosSearchBar } from './MemosSearchBar'
import { MemosTable } from './MemosTable'
import { MemosPagination } from './MemosPagination'
import { DeleteMemoDialog } from './DeleteMemoDialog'
import { ViewMemoDialog } from './ViewMemoDialog'
import { PageHeader } from '@/components/AppLayout/PageHeader'

export const MemosDashboard = () => {
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
    const setSearchMethod = useMemoStore((state) => state.setSearchMethod)
    const clearSearch = useMemoStore((state) => state.clearSearch)

    const [selectedMemo, setSelectedMemo] = useState<DetailedMemo | null>(null)
    const [memoToDelete, setMemoToDelete] = useState<Memo | null>(null)
    const [deleting, setDeleting] = useState(false)

    const handleSearch = async () => {
        if (!currentProject) return
        await searchMemos(searchQuery, searchMethod)
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
        }
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
                <Button onClick={handleRefresh} disabled={loading} variant="outline" size="sm">
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </PageHeader>

            <MemosSearchBar
                searchQuery={searchQuery}
                searchMethod={searchMethod}
                loading={loading}
                onSearchQueryChange={setSearchQuery}
                onSearchMethodChange={(method: SearchMethod) => setSearchMethod(method)}
                onSearch={handleSearch}
                onClear={handleClearSearch}
            />

            <MemosTable
                memos={memos}
                loading={loading}
                searchQuery={searchQuery}
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

            <ViewMemoDialog memo={selectedMemo} onClose={() => setSelectedMemo(null)} />

            <DeleteMemoDialog
                memo={memoToDelete}
                deleting={deleting}
                onConfirm={handleDelete}
                onCancel={() => setMemoToDelete(null)}
            />
        </div>
    )
}
