import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChevronLeft } from 'lucide-react'
import { api, getProjectPath } from '@/lib/api'

interface ExperimentDetail {
    uuid: string
    title: string
    description: string
    properties: Record<string, any>
    evaluation_dataset_uuid: string
    evaluation_dataset_name: string
    created_at: string
}

interface ExperimentDetailViewProps {
    experimentUuid: string
    onBack: () => void
}

export const ExperimentDetailView = ({ experimentUuid, onBack }: ExperimentDetailViewProps) => {
    const [experiment, setExperiment] = useState<ExperimentDetail | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchExperiment = async () => {
            setIsLoading(true)
            setError(null)

            try {
                const projectPath = getProjectPath()
                const response = await api.get<ExperimentDetail>(
                    `${projectPath}/experiments/${experimentUuid}`
                )
                if (response.data) {
                    console.log('Experiment data:', response.data)
                    setExperiment(response.data)
                }
            } catch (err) {
                console.error('Failed to fetch experiment:', err)
                setError('Failed to load experiment')
            } finally {
                setIsLoading(false)
            }
        }

        fetchExperiment()
    }, [experimentUuid])

    if (isLoading) {
        return (
            <div className="p-4">
                <div className="text-muted-foreground">Loading experiment...</div>
            </div>
        )
    }

    if (error || !experiment) {
        return (
            <div className="p-4">
                <Button variant="ghost" onClick={onBack} className="mb-4">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back to Experiments
                </Button>
                <div className="text-red-500">{error || 'Experiment not found'}</div>
            </div>
        )
    }

    return (
        <div className="p-4">
            <Button variant="ghost" onClick={onBack} className="mb-4">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Experiments
            </Button>

            <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">{experiment.title}</h2>
                <p className="text-muted-foreground mb-2">{experiment.description}</p>
                <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>Created: {new Date(experiment.created_at).toLocaleDateString()}</span>
                    {experiment.evaluation_dataset_name && (
                        <>
                            <span>•</span>
                            <span>Dataset: {experiment.evaluation_dataset_name}</span>
                        </>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-semibold mb-3">Properties</h3>
                    {(() => {
                        // Handle properties whether they're an object or a JSON string
                        let props: Record<string, any>
                        try {
                            props = typeof experiment.properties === 'string'
                                ? JSON.parse(experiment.properties)
                                : experiment.properties
                        } catch {
                            return <p className="text-sm text-red-500">Invalid properties format</p>
                        }

                        if (!props || Object.keys(props).length === 0) {
                            return <p className="text-sm text-muted-foreground">No properties defined</p>
                        }

                        return (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Property</TableHead>
                                        <TableHead>Value</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Object.entries(props).map(([key, value]) => (
                                        <TableRow key={key}>
                                            <TableCell className="font-medium">{key}</TableCell>
                                            <TableCell>
                                                {typeof value === 'object'
                                                    ? JSON.stringify(value, null, 2)
                                                    : String(value)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )
                    })()}
                </div>
            </div>
        </div>
    )
}
