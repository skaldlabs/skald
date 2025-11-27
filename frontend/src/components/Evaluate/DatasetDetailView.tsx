import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { ChevronLeft, Download, Edit2, Plus, Save, Trash2, X } from 'lucide-react'
import { api, getProjectPath } from '@/lib/api'
import { toast } from 'sonner'

interface Question {
    uuid: string
    question: string
    answer: string
    created_at: string
}

interface DatasetDetail {
    uuid: string
    name: string
    description: string
    created_at: string
    questions: Question[]
}

interface DatasetDetailViewProps {
    datasetUuid: string
    onBack: () => void
}

export const DatasetDetailView = ({ datasetUuid, onBack }: DatasetDetailViewProps) => {
    const [dataset, setDataset] = useState<DatasetDetail | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [editingQuestionUuid, setEditingQuestionUuid] = useState<string | null>(null)
    const [editedQuestion, setEditedQuestion] = useState('')
    const [editedAnswer, setEditedAnswer] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    // Add question state
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [newQuestion, setNewQuestion] = useState('')
    const [newAnswer, setNewAnswer] = useState('')
    const [isAdding, setIsAdding] = useState(false)

    // Delete confirmation state
    const [deleteQuestionUuid, setDeleteQuestionUuid] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        const fetchDataset = async () => {
            setIsLoading(true)
            setError(null)

            try {
                const projectPath = getProjectPath()
                const response = await api.get<DatasetDetail>(`${projectPath}/evaluation-datasets/${datasetUuid}`)
                if (response.data) {
                    setDataset(response.data)
                }
            } catch (err) {
                console.error('Failed to fetch dataset:', err)
                setError('Failed to load dataset')
            } finally {
                setIsLoading(false)
            }
        }

        fetchDataset()
    }, [datasetUuid])

    const handleEditClick = (question: Question) => {
        setEditingQuestionUuid(question.uuid)
        setEditedQuestion(question.question)
        setEditedAnswer(question.answer)
    }

    const handleCancelEdit = () => {
        setEditingQuestionUuid(null)
        setEditedQuestion('')
        setEditedAnswer('')
    }

    const handleSaveEdit = async (questionUuid: string) => {
        if (!dataset) return

        setIsSaving(true)
        try {
            const projectPath = getProjectPath()
            const response = await api.patch<Question>(
                `${projectPath}/evaluation-datasets/${datasetUuid}/questions/${questionUuid}`,
                {
                    question: editedQuestion,
                    answer: editedAnswer,
                }
            )

            if (response.data) {
                // Update the dataset in state with the new question data
                setDataset({
                    ...dataset,
                    questions: dataset.questions.map((q) => (q.uuid === questionUuid ? response.data! : q)),
                })
                setEditingQuestionUuid(null)
                setEditedQuestion('')
                setEditedAnswer('')
            }
        } catch (err) {
            console.error('Failed to update question:', err)
            alert('Failed to update question. Please try again.')
        } finally {
            setIsSaving(false)
        }
    }

    const handleExport = async () => {
        if (!dataset) return

        try {
            const projectPath = getProjectPath()
            const response = await api.get<{ question: string; answer: string }[]>(
                `${projectPath}/evaluation-datasets/${datasetUuid}/export`
            )

            if (response.data) {
                const json = JSON.stringify(response.data, null, 2)
                const blob = new Blob([json], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${dataset.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
            }
        } catch (err) {
            console.error('Failed to export dataset:', err)
            alert('Failed to export dataset. Please try again.')
        }
    }

    const handleAddQuestion = async () => {
        if (!dataset || !newQuestion.trim() || !newAnswer.trim()) return

        setIsAdding(true)
        try {
            const projectPath = getProjectPath()
            const response = await api.post<Question>(`${projectPath}/evaluation-datasets/${datasetUuid}/questions`, {
                question: newQuestion,
                answer: newAnswer,
            })

            if (response.data) {
                setDataset({
                    ...dataset,
                    questions: [...dataset.questions, response.data],
                })
                setIsAddDialogOpen(false)
                setNewQuestion('')
                setNewAnswer('')
                toast.success('Question added successfully')
            } else if (response.error) {
                toast.error(`Failed to add question: ${response.error}`)
            }
        } catch (err) {
            console.error('Failed to add question:', err)
            toast.error('Failed to add question. Please try again.')
        } finally {
            setIsAdding(false)
        }
    }

    const handleDeleteQuestion = async () => {
        if (!dataset || !deleteQuestionUuid) return

        setIsDeleting(true)
        try {
            const projectPath = getProjectPath()
            const response = await api.delete(
                `${projectPath}/evaluation-datasets/${datasetUuid}/questions/${deleteQuestionUuid}`
            )

            if (!response.error) {
                setDataset({
                    ...dataset,
                    questions: dataset.questions.filter((q) => q.uuid !== deleteQuestionUuid),
                })
                setDeleteQuestionUuid(null)
                toast.success('Question deleted successfully')
            } else {
                toast.error(`Failed to delete question: ${response.error}`)
            }
        } catch (err) {
            console.error('Failed to delete question:', err)
            toast.error('Failed to delete question. Please try again.')
        } finally {
            setIsDeleting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="p-4">
                <div className="text-muted-foreground">Loading dataset...</div>
            </div>
        )
    }

    if (error || !dataset) {
        return (
            <div className="p-4">
                <Button variant="ghost" onClick={onBack} className="mb-4">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back to Datasets
                </Button>
                <div className="text-red-500">{error || 'Dataset not found'}</div>
            </div>
        )
    }

    return (
        <div className="p-4">
            <Button variant="ghost" onClick={onBack} className="mb-4">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Datasets
            </Button>

            <div className="mb-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">{dataset.name}</h2>
                        <p className="text-muted-foreground mb-2">{dataset.description}</p>
                        <p className="text-sm text-muted-foreground">
                            Created: {new Date(dataset.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            {dataset.questions.length} question{dataset.questions.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Question
                        </Button>
                        <Button variant="outline" onClick={handleExport}>
                            <Download className="h-4 w-4 mr-2" />
                            Export JSON
                        </Button>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {dataset.questions.map((question, index) => {
                    const isEditing = editingQuestionUuid === question.uuid

                    return (
                        <Card key={question.uuid}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                                        {isEditing ? (
                                            <Input
                                                value={editedQuestion}
                                                onChange={(e) => setEditedQuestion(e.target.value)}
                                                className="mt-2"
                                                placeholder="Enter question"
                                            />
                                        ) : (
                                            <CardDescription>{question.question}</CardDescription>
                                        )}
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        {isEditing ? (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleSaveEdit(question.uuid)}
                                                    disabled={isSaving}
                                                >
                                                    <Save className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={handleCancelEdit}
                                                    disabled={isSaving}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleEditClick(question)}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setDeleteQuestionUuid(question.uuid)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <p className="text-sm font-semibold text-muted-foreground">Answer:</p>
                                    {isEditing ? (
                                        <Textarea
                                            value={editedAnswer}
                                            onChange={(e) => setEditedAnswer(e.target.value)}
                                            className="min-h-[100px]"
                                            placeholder="Enter answer"
                                        />
                                    ) : (
                                        <p className="text-sm whitespace-pre-wrap">{question.answer}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Add Question Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Question</DialogTitle>
                        <DialogDescription>Add a new question and answer to the dataset.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Question</label>
                            <Input
                                value={newQuestion}
                                onChange={(e) => setNewQuestion(e.target.value)}
                                placeholder="Enter question"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Answer</label>
                            <Textarea
                                value={newAnswer}
                                onChange={(e) => setNewAnswer(e.target.value)}
                                placeholder="Enter answer"
                                className="min-h-[100px]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isAdding}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddQuestion}
                            disabled={isAdding || !newQuestion.trim() || !newAnswer.trim()}
                        >
                            {isAdding ? 'Adding...' : 'Add Question'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteQuestionUuid} onOpenChange={(open) => !open && setDeleteQuestionUuid(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Question</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this question? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteQuestionUuid(null)} disabled={isDeleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteQuestion} disabled={isDeleting}>
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
