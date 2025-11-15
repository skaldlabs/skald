import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus } from 'lucide-react'
import { CreateDatasetDialog } from './CreateDatasetDialog'
import { DatasetDetailView } from './DatasetDetailView'
import { useEvaluateDatasetsStore } from '@/stores/evaluateDatasetsStore'

export const DatasetsTab = () => {
    const { datasets, loading, fetchDatasets } = useEvaluateDatasetsStore()
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [selectedDatasetUuid, setSelectedDatasetUuid] = useState<string | null>(null)

    useEffect(() => {
        fetchDatasets()
    }, [])

    const handleDatasetCreated = () => {
        setIsCreateDialogOpen(false)
        fetchDatasets()
    }

    const handleDatasetClick = (datasetUuid: string) => {
        setSelectedDatasetUuid(datasetUuid)
    }

    const handleBackToList = () => {
        setSelectedDatasetUuid(null)
    }

    // If a dataset is selected, show the detail view
    if (selectedDatasetUuid) {
        return <DatasetDetailView datasetUuid={selectedDatasetUuid} onBack={handleBackToList} />
    }

    return (
        <div className="datasets-tab p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Evaluation Datasets</h2>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Dataset
                </Button>
            </div>

            {loading ? (
                <div className="text-muted-foreground">Loading datasets...</div>
            ) : datasets.length === 0 ? (
                <div className="text-muted-foreground text-center py-8">
                    No datasets yet. Create your first evaluation dataset to get started.
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Created</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {datasets.map((dataset) => (
                            <TableRow
                                key={dataset.uuid}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => handleDatasetClick(dataset.uuid)}
                            >
                                <TableCell className="font-medium">{dataset.name}</TableCell>
                                <TableCell>{dataset.description}</TableCell>
                                <TableCell>{new Date(dataset.created_at).toLocaleDateString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            <CreateDatasetDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                onDatasetCreated={handleDatasetCreated}
            />
        </div>
    )
}
