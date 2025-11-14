import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus } from 'lucide-react'
import { CreateDatasetDialog } from './CreateDatasetDialog'
import { DatasetDetailView } from './DatasetDetailView'
import { api, getProjectPath } from '@/lib/api'

interface EvaluationDataset {
    uuid: string
    name: string
    description: string
    created_at: string
}

export const DatasetsTab = () => {
    const [datasets, setDatasets] = useState<EvaluationDataset[]>([])
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [selectedDatasetUuid, setSelectedDatasetUuid] = useState<string | null>(null)

    const fetchDatasets = async () => {
        setIsLoading(true)
        try {
            const projectPath = getProjectPath()
            const response = await api.get<EvaluationDataset[]>(`${projectPath}/evaluation-datasets`)
            if (response.data) {
                setDatasets(response.data)
            }
        } catch (error) {
            console.error('Failed to fetch datasets:', error)
        } finally {
            setIsLoading(false)
        }
    }

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

            {isLoading ? (
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
