import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, Upload } from 'lucide-react'
import { api, getProjectPath } from '@/lib/api'

interface Question {
    id: string
    question: string
    answer: string
}

interface CreateDatasetDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onDatasetCreated: () => void
}

export const CreateDatasetDialog = ({ open, onOpenChange, onDatasetCreated }: CreateDatasetDialogProps) => {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [questions, setQuestions] = useState<Question[]>([{ id: crypto.randomUUID(), question: '', answer: '' }])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [importMode, setImportMode] = useState(false)
    const [jsonInput, setJsonInput] = useState('')

    const handleAddQuestion = () => {
        setQuestions([...questions, { id: crypto.randomUUID(), question: '', answer: '' }])
    }

    const handleRemoveQuestion = (id: string) => {
        if (questions.length > 1) {
            setQuestions(questions.filter((q) => q.id !== id))
        }
    }

    const handleQuestionChange = (id: string, field: 'question' | 'answer', value: string) => {
        setQuestions(questions.map((q) => (q.id === id ? { ...q, [field]: value } : q)))
    }

    const parseJsonInput = (): { question: string; answer: string }[] | null => {
        try {
            const parsed = JSON.parse(jsonInput)
            if (!Array.isArray(parsed)) {
                setError('JSON must be an array of objects')
                return null
            }
            for (const item of parsed) {
                if (typeof item.question !== 'string' || typeof item.answer !== 'string') {
                    setError('Each item must have "question" and "answer" string fields')
                    return null
                }
            }
            return parsed
        } catch {
            setError('Invalid JSON format')
            return null
        }
    }

    const handleSubmit = async () => {
        setError(null)

        if (!name.trim()) {
            setError('Please provide a dataset name')
            return
        }

        if (!description.trim()) {
            setError('Please provide a dataset description')
            return
        }

        let questionsToSubmit: { question: string; answer: string }[]

        if (importMode) {
            const parsed = parseJsonInput()
            if (!parsed) return
            if (parsed.length === 0) {
                setError('JSON array must contain at least one question')
                return
            }
            questionsToSubmit = parsed.map((q) => ({
                question: q.question.trim(),
                answer: q.answer.trim(),
            }))
        } else {
            const validQuestions = questions.filter((q) => q.question.trim() && q.answer.trim())
            if (validQuestions.length === 0) {
                setError('Please add at least one question with both question and answer filled')
                return
            }
            questionsToSubmit = validQuestions.map((q) => ({
                question: q.question.trim(),
                answer: q.answer.trim(),
            }))
        }

        setIsSubmitting(true)

        try {
            const projectPath = getProjectPath()
            const response = await api.post(`${projectPath}/evaluation-datasets`, {
                name: name.trim(),
                description: description.trim(),
                questions: questionsToSubmit,
            })

            if (response.error) {
                setError(response.error)
            } else {
                setName('')
                setDescription('')
                setQuestions([{ id: crypto.randomUUID(), question: '', answer: '' }])
                setJsonInput('')
                setImportMode(false)
                onDatasetCreated()
            }
        } catch {
            setError('Failed to create dataset')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Evaluation Dataset</DialogTitle>
                    <DialogDescription>
                        Create a new evaluation dataset with questions and expected answers
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Dataset Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g., Customer Support Q&A"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Describe what this dataset is for..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="min-h-[80px]"
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <Label>Questions & Answers</Label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={importMode ? 'outline' : 'default'}
                                    size="sm"
                                    onClick={() => setImportMode(false)}
                                >
                                    Manual definition
                                </Button>
                                <Button
                                    type="button"
                                    variant={importMode ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setImportMode(true)}
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Import JSON
                                </Button>
                            </div>
                        </div>

                        {importMode ? (
                            <div className="space-y-2">
                                <Textarea
                                    placeholder='[{"question": "...", "answer": "..."}]'
                                    value={jsonInput}
                                    onChange={(e) => setJsonInput(e.target.value)}
                                    className="min-h-[200px] font-mono text-sm"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Paste JSON array with objects containing "question" and "answer" fields
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    {questions.map((q, index) => (
                                        <div key={q.id} className="border rounded-lg p-4 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium">Question {index + 1}</span>
                                                {questions.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRemoveQuestion(q.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor={`question-${q.id}`}>Question</Label>
                                                <Textarea
                                                    id={`question-${q.id}`}
                                                    placeholder="Enter the question..."
                                                    value={q.question}
                                                    onChange={(e) =>
                                                        handleQuestionChange(q.id, 'question', e.target.value)
                                                    }
                                                    className="min-h-[60px]"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor={`answer-${q.id}`}>Expected Answer</Label>
                                                <Textarea
                                                    id={`answer-${q.id}`}
                                                    placeholder="Enter the expected answer..."
                                                    value={q.answer}
                                                    onChange={(e) =>
                                                        handleQuestionChange(q.id, 'answer', e.target.value)
                                                    }
                                                    className="min-h-[60px]"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={handleAddQuestion}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Question
                                </Button>
                            </>
                        )}
                    </div>

                    {error && <div className="text-sm text-red-500">{error}</div>}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Creating...' : 'Create Dataset'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
