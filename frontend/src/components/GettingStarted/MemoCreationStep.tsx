import { useEffect, useRef, useState } from 'react'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Loader2,
    FileText,
    Upload,
    X,
    FileSearch,
    Scissors,
    Database,
    Sparkles,
    Tags,
    Wand2,
    ArrowLeft,
    ArrowRight,
    PenLine,
} from 'lucide-react'
import { toast } from 'sonner'

const ALLOWED_FILE_TYPES = ['.pdf', '.doc', '.docx', '.pptx', '.xls', '.xlsx']

const pipelineSteps = [
    { icon: FileSearch, title: 'Data Type Detection' },
    { icon: Scissors, title: 'Smart Chunking' },
    { icon: Database, title: 'Vector Embedding' },
    { icon: Sparkles, title: 'Summary Generation' },
    { icon: Tags, title: 'Auto-Tagging' },
]

type CreationMode = 'text' | 'file'

export const MemoCreationStep = () => {
    const memoTitle = useOnboardingStore((state) => state.memoTitle)
    const memoContent = useOnboardingStore((state) => state.memoContent)
    const isCreatingMemo = useOnboardingStore((state) => state.isCreatingMemo)
    const selectedFile = useOnboardingStore((state) => state.selectedFile)
    const isUploadingFile = useOnboardingStore((state) => state.isUploadingFile)
    const isGeneratingExample = useOnboardingStore((state) => state.isGeneratingExample)
    const setMemoTitle = useOnboardingStore((state) => state.setMemoTitle)
    const setMemoContent = useOnboardingStore((state) => state.setMemoContent)
    const setSelectedFile = useOnboardingStore((state) => state.setSelectedFile)
    const createMemo = useOnboardingStore((state) => state.createMemo)
    const uploadFileMemo = useOnboardingStore((state) => state.uploadFileMemo)
    const generateExampleMemo = useOnboardingStore((state) => state.generateExampleMemo)

    const [creationMode, setCreationMode] = useState<CreationMode | null>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const maxFileSize = 5 * 1024 * 1024 // 5MB
    const maxFileSizeMB = 5

    // Auto-focus textarea when text mode is selected
    useEffect(() => {
        if (creationMode === 'text' && textareaRef.current) {
            textareaRef.current.focus()
        }
    }, [creationMode])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`
        if (!ALLOWED_FILE_TYPES.includes(fileExtension)) {
            toast.error(`Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`)
            return
        }

        // Validate file size
        if (file.size > maxFileSize) {
            toast.error(`File size exceeds ${maxFileSizeMB}MB limit`)
            return
        }

        setSelectedFile(file)
    }

    const handleRemoveFile = () => {
        setSelectedFile(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault()
        e.stopPropagation()

        const file = e.dataTransfer.files?.[0]
        if (!file) return

        // Validate file type
        const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`
        if (!ALLOWED_FILE_TYPES.includes(fileExtension)) {
            toast.error(`Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`)
            return
        }

        // Validate file size
        if (file.size > maxFileSize) {
            toast.error(`File size exceeds ${maxFileSizeMB}MB limit`)
            return
        }

        setSelectedFile(file)
    }

    const handleCreateText = () => {
        createMemo()
    }

    const handleUploadFile = () => {
        uploadFileMemo()
    }

    const handleGenerateExample = () => {
        generateExampleMemo()
    }

    const isTextValid = memoTitle.trim().length > 0 && memoContent.trim().length > 20
    const isFileValid = selectedFile !== null

    if (creationMode === null) {
        return (
            <div className="memo-creation-step selection-state">
                <Card className="memo-card memo-card-wide">
                    <CardContent className="memo-card-content">
                        <h1>Create your first memo</h1>

                        <p className="memo-description">
                            Memos are units of knowledge in Skald. They go through a processing pipeline that makes them
                            searchable and ready for AI-powered retrieval.
                        </p>

                        <div className="pipeline-preview">
                            {pipelineSteps.map((step, index) => (
                                <div key={index} className="pipeline-item">
                                    <step.icon className="h-4 w-4" />
                                    <span>{step.title}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mode-options">
                            <button className="mode-option" onClick={() => setCreationMode('text')}>
                                <div className="mode-icon">
                                    <PenLine className="h-5 w-5" />
                                </div>
                                <div className="mode-content">
                                    <span className="mode-title">Write text</span>
                                    <span className="mode-description">Type or paste content directly</span>
                                </div>
                                <ArrowRight className="h-4 w-4 mode-arrow" />
                            </button>

                            <button className="mode-option" onClick={() => setCreationMode('file')}>
                                <div className="mode-icon">
                                    <Upload className="h-5 w-5" />
                                </div>
                                <div className="mode-content">
                                    <span className="mode-title">Upload file</span>
                                    <span className="mode-description">
                                        PDF, Word, PowerPoint, Excel • Max {maxFileSizeMB}MB
                                    </span>
                                </div>
                                <ArrowRight className="h-4 w-4 mode-arrow" />
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (creationMode === 'text') {
        return (
            <div className="memo-creation-step text-state">
                <Card className="memo-card memo-card-wide">
                    <CardContent className="memo-card-content">
                        <button className="back-button" onClick={() => setCreationMode(null)}>
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </button>

                        <div className="memo-badge-container">
                            <Badge variant="secondary" className="memo-badge">
                                <PenLine className="h-3.5 w-3.5" />
                                Write text
                            </Badge>
                        </div>

                        <h1>Write your first memo</h1>

                        <p className="memo-description">
                            Enter a title and content. This will be processed and made searchable for your AI agent.
                        </p>

                        <div className="memo-form">
                            <div className="form-field">
                                <label htmlFor="memo-title">Title</label>
                                <input
                                    id="memo-title"
                                    type="text"
                                    value={memoTitle}
                                    onChange={(e) => setMemoTitle(e.target.value)}
                                    placeholder="Give your memo a title"
                                    disabled={isGeneratingExample}
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="memo-content">Content</label>
                                <div className="textarea-container">
                                    <Textarea
                                        ref={textareaRef}
                                        id="memo-content"
                                        value={memoContent}
                                        onChange={(e) => setMemoContent(e.target.value)}
                                        placeholder="Write or paste your content here..."
                                        disabled={isGeneratingExample}
                                    />
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleGenerateExample}
                                disabled={isGeneratingExample || isCreatingMemo}
                                className="generate-button"
                            >
                                {isGeneratingExample ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Filling...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="h-4 w-4" />
                                        Fill with example content
                                    </>
                                )}
                            </Button>
                        </div>

                        <Button
                            onClick={handleCreateText}
                            disabled={!isTextValid || isCreatingMemo || isGeneratingExample}
                            size="lg"
                            className="submit-button"
                        >
                            {isCreatingMemo ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    Create memo
                                    <ArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="memo-creation-step file-state">
            <Card className="memo-card">
                <CardContent className="memo-card-content">
                    <button className="back-button" onClick={() => setCreationMode(null)}>
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </button>

                    <div className="memo-badge-container">
                        <Badge variant="secondary" className="memo-badge">
                            <Upload className="h-3.5 w-3.5" />
                            Upload file
                        </Badge>
                    </div>

                    <h1>Upload a document</h1>

                    <p className="memo-description">
                        We'll extract its content, process it, and make it searchable for your AI agent.
                    </p>

                    <div className="file-upload-zone">
                        {!selectedFile ? (
                            <label className="drop-area" onDragOver={handleDragOver} onDrop={handleDrop}>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept={ALLOWED_FILE_TYPES.join(',')}
                                    onChange={handleFileSelect}
                                    className="hidden-input"
                                />
                                <Upload className="h-8 w-8" />
                                <span className="drop-text">Click to select or drag and drop</span>
                                <span className="drop-hint">
                                    {ALLOWED_FILE_TYPES.join(', ')} • Max {maxFileSizeMB}MB
                                </span>
                            </label>
                        ) : (
                            <div className="file-selected">
                                <div className="file-info">
                                    <FileText className="h-6 w-6" />
                                    <div className="file-details">
                                        <span className="file-name">{selectedFile.name}</span>
                                        <span className="file-size">
                                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                        </span>
                                    </div>
                                </div>
                                <button className="remove-button" onClick={handleRemoveFile} aria-label="Remove file">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    <Button
                        onClick={handleUploadFile}
                        disabled={!isFileValid || isUploadingFile}
                        size="lg"
                        className="submit-button"
                    >
                        {isUploadingFile ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                Upload document
                                <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
