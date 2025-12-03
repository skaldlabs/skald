import { useProjectStore } from '@/stores/projectStore'
import { Info } from 'lucide-react'
import { PageHeader } from '@/components/AppLayout/PageHeader'
import { SearchResultsTable } from './SearchResultsTable'
import { RetrievalInfo } from './RetrievalInfo'
import './Playground.scss'

export const SearchDashboard = () => {
    const { currentProject } = useProjectStore()

    if (!currentProject) {
        return (
            <div className="playground-dashboard">
                <div className="no-project-alert">
                    <Info className="h-4 w-4" />
                    <p>Please select a project to start searching your data.</p>
                </div>
            </div>
        )
    }

    return (
        <div
            className="playground-dashboard"
            style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}
        >
            <PageHeader title="Search" />

            <RetrievalInfo variant="search" />

            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                <SearchResultsTable />
            </div>
        </div>
    )
}
