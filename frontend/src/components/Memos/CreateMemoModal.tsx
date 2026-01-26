import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { X, Loader2, Upload, FileText, Plus } from 'lucide-react'
import { useMemoStore } from '@/stores/memoStore'
import { useSubscriptionStore } from '@/stores/subscriptionStore'
import { isSelfHostedDeploy } from '@/config'
import { toast } from 'sonner'

const ALLOWED_FILE_TYPES = ['.pdf', '.doc', '.docx', '.pptx']

const memoFormSchema = z.object({
    title: z.string().min(1, 'Title is required').max(255, 'Title must be 255 characters or less'),
    content: z.string().min(1, 'Content is required'),
    source: z.string().max(255).optional().nullable(),
    type: z.string().max(255).optional().nullable(),
    client_reference_id: z.string().max(255).optional().nullable(),
    expiration_date: z.string().optional().nullable(),
    tags: z.array(z.string()).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
})

const fileFormSchema = z.object({
    title: z.string().max(255).optional().nullable(),
    source: z.string().max(255).optional().nullable(),
    client_reference_id: z.string().max(255).optional().nullable(),
    expiration_date: z.string().optional().nullable(),
    tags: z.array(z.string()).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
})

type MemoFormValues = z.infer<typeof memoFormSchema>
type FileFormValues = z.infer<typeof fileFormSchema>

interface CreateMemoModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export const CreateMemoModal = ({ open, onOpenChange }: CreateMemoModalProps) => {
    const [activeTab, setActiveTab] = useState<'text' | 'document'>('text')
    const [tagInput, setTagInput] = useState('')
    const [tags, setTags] = useState<string[]>([])
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [scopes, setScopes] = useState<Record<string, string>>({})
    const [scopeKey, setScopeKey] = useState('')
    const [scopeValue, setScopeValue] = useState('')
    const createMemo = useMemoStore((state) => state.createMemo)
    const createFileMemo = useMemoStore((state) => state.createFileMemo)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const currentSubscription = useSubscriptionStore((state) => state.currentSubscription)

    // Calculate max file size: 5MB for free plan (non-self-hosted), 100MB otherwise
    const isFreePlan = currentSubscription?.plan.slug === 'free'
    const maxFileSize = isFreePlan && !isSelfHostedDeploy ? 5 * 1024 * 1024 : 100 * 1024 * 1024 // 5MB or 100MB
    const maxFileSizeMB = isFreePlan && !isSelfHostedDeploy ? 5 : 100

    const textForm = useForm<MemoFormValues>({
        resolver: zodResolver(memoFormSchema),
        defaultValues: {
            title: '',
            content: '',
            source: '',
            type: '',
            client_reference_id: '',
            expiration_date: '',
            tags: [],
            metadata: {},
        },
    })

    const fileForm = useForm<FileFormValues>({
        resolver: zodResolver(fileFormSchema),
        defaultValues: {
            title: '',
            source: '',
            client_reference_id: '',
            expiration_date: '',
            tags: [],
            metadata: {},
        },
    })

    const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault()
            if (!tags.includes(tagInput.trim())) {
                setTags([...tags, tagInput.trim()])
            }
            setTagInput('')
        }
    }

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter((tag) => tag !== tagToRemove))
    }

    const handleAddScope = () => {
        if (scopeKey.trim() && scopeValue.trim()) {
            setScopes({ ...scopes, [scopeKey.trim()]: scopeValue.trim() })
            setScopeKey('')
            setScopeValue('')
        }
    }

    const handleScopeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleAddScope()
        }
    }

    const handleRemoveScope = (keyToRemove: string) => {
        const newScopes = { ...scopes }
        delete newScopes[keyToRemove]
        setScopes(newScopes)
    }

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

    const onTextSubmit = async (data: MemoFormValues) => {
        setIsSubmitting(true)
        try {
            const payload = {
                ...data,
                tags: tags.length > 0 ? tags : undefined,
                source: data.source?.trim() || undefined,
                type: data.type?.trim() || undefined,
                client_reference_id: data.client_reference_id?.trim() || undefined,
                expiration_date: data.expiration_date?.trim() || undefined,
                scopes: Object.keys(scopes).length > 0 ? scopes : undefined,
            }

            const success = await createMemo(payload)
            if (success) {
                textForm.reset()
                setTags([])
                setScopes({})
                onOpenChange(false)
                toast.success('Memo created successfully')
            }
        } catch (error) {
            console.error('Error creating memo:', error)
            toast.error('Failed to create memo')
        } finally {
            setIsSubmitting(false)
        }
    }

    const onFileSubmit = async (data: FileFormValues) => {
        if (!selectedFile) {
            toast.error('Please select a file')
            return
        }

        setIsSubmitting(true)
        try {
            const payload = {
                file: selectedFile,
                title: data.title?.trim() || undefined,
                source: data.source?.trim() || undefined,
                reference_id: data.client_reference_id?.trim() || undefined,
                expiration_date: data.expiration_date?.trim() || undefined,
                tags: tags.length > 0 ? tags : undefined,
                metadata: data.metadata,
                scopes: Object.keys(scopes).length > 0 ? scopes : undefined,
            }

            const success = await createFileMemo(payload)
            if (success) {
                fileForm.reset()
                setTags([])
                setScopes({})
                setSelectedFile(null)
                onOpenChange(false)
                toast.success('Document uploaded successfully')
            }
        } catch (error) {
            console.error('Error uploading document:', error)
            toast.error('Failed to upload document')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        if (!isSubmitting) {
            textForm.reset()
            fileForm.reset()
            setTags([])
            setScopes({})
            setScopeKey('')
            setScopeValue('')
            setSelectedFile(null)
            setActiveTab('text')
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Memo</DialogTitle>
                    <DialogDescription>
                        Add a new memo to your project by entering text or uploading a document.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'text' | 'document')}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="text">
                            <FileText className="h-4 w-4 mr-2" />
                            Text
                        </TabsTrigger>
                        <TabsTrigger value="document">
                            <Upload className="h-4 w-4 mr-2" />
                            Document
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="text" className="mt-6">
                        <Form {...textForm}>
                            <form onSubmit={textForm.handleSubmit(onTextSubmit)} className="space-y-6">
                                {/* Required Fields */}
                                <div className="space-y-4">
                                    <FormField
                                        control={textForm.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Title <span className="text-destructive">*</span>
                                                </FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter memo title" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={textForm.control}
                                        name="content"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Content <span className="text-destructive">*</span>
                                                </FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Enter memo content"
                                                        className="min-h-[200px] resize-y"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    The main content of the memo will be processed and indexed for
                                                    search
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Optional Fields */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium">Optional Fields</h3>

                                    <FormField
                                        control={textForm.control}
                                        name="source"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Source</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="e.g., URL, filename, repository name"
                                                        {...field}
                                                        value={field.value ?? ''}
                                                    />
                                                </FormControl>
                                                <FormDescription>Where this content originated from</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={textForm.control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Type</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="e.g., code, document, note"
                                                        {...field}
                                                        value={field.value ?? ''}
                                                    />
                                                </FormControl>
                                                <FormDescription>Category or type of content</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={textForm.control}
                                        name="client_reference_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Reference ID</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="External system reference ID"
                                                        {...field}
                                                        value={field.value ?? ''}
                                                    />
                                                </FormControl>
                                                <FormDescription>Your own reference ID for this memo</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={textForm.control}
                                        name="expiration_date"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Expiration Date</FormLabel>
                                                <FormControl>
                                                    <Input type="datetime-local" {...field} value={field.value ?? ''} />
                                                </FormControl>
                                                <FormDescription>
                                                    Optional expiration date for this memo
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormItem>
                                        <FormLabel>Tags</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Type a tag and press Enter"
                                                value={tagInput}
                                                onChange={(e) => setTagInput(e.target.value)}
                                                onKeyDown={handleAddTag}
                                            />
                                        </FormControl>
                                        <FormDescription>Press Enter to add each tag</FormDescription>
                                        {tags.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {tags.map((tag) => (
                                                    <Badge key={tag} variant="secondary" className="gap-1">
                                                        {tag}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveTag(tag)}
                                                            className="ml-1 hover:bg-muted rounded-full"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </FormItem>

                                    <FormItem>
                                        <FormLabel>Scopes</FormLabel>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Key"
                                                value={scopeKey}
                                                onChange={(e) => setScopeKey(e.target.value)}
                                                onKeyDown={handleScopeKeyDown}
                                                className="flex-1"
                                            />
                                            <Input
                                                placeholder="Value"
                                                value={scopeValue}
                                                onChange={(e) => setScopeValue(e.target.value)}
                                                onKeyDown={handleScopeKeyDown}
                                                className="flex-1"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={handleAddScope}
                                                disabled={!scopeKey.trim() || !scopeValue.trim()}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <FormDescription>Add key-value pairs for access control scopes</FormDescription>
                                        {Object.keys(scopes).length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {Object.entries(scopes).map(([key, value]) => (
                                                    <Badge key={key} variant="secondary" className="gap-1">
                                                        <span className="font-medium">{key}</span>
                                                        <span className="text-muted-foreground">:</span>
                                                        <span>{value}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveScope(key)}
                                                            className="ml-1 hover:bg-muted rounded-full"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </FormItem>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleClose}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Create Memo
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </TabsContent>

                    <TabsContent value="document" className="mt-6">
                        <Form {...fileForm}>
                            <form onSubmit={fileForm.handleSubmit(onFileSubmit)} className="space-y-6">
                                {/* File Upload */}
                                <div className="space-y-4">
                                    <FormItem>
                                        <FormLabel>
                                            Document <span className="text-destructive">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <div className="space-y-2">
                                                <Input
                                                    type="file"
                                                    accept={ALLOWED_FILE_TYPES.join(',')}
                                                    onChange={handleFileSelect}
                                                    disabled={isSubmitting}
                                                />
                                                {selectedFile && (
                                                    <p className="text-sm text-muted-foreground">
                                                        Selected: {selectedFile.name} (
                                                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                                    </p>
                                                )}
                                            </div>
                                        </FormControl>
                                        <FormDescription>
                                            Upload a PDF, Word, or PowerPoint document (max {maxFileSizeMB}MB). Allowed
                                            formats: {ALLOWED_FILE_TYPES.join(', ')}
                                        </FormDescription>
                                    </FormItem>
                                </div>

                                {/* Optional Fields */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium">Optional Fields</h3>

                                    <FormField
                                        control={fileForm.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Title</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Leave blank to use filename"
                                                        {...field}
                                                        value={field.value ?? ''}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Optional custom title (defaults to filename)
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={fileForm.control}
                                        name="source"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Source</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="e.g., URL, repository name"
                                                        {...field}
                                                        value={field.value ?? ''}
                                                    />
                                                </FormControl>
                                                <FormDescription>Where this document originated from</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={fileForm.control}
                                        name="client_reference_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Reference ID</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="External system reference ID"
                                                        {...field}
                                                        value={field.value ?? ''}
                                                    />
                                                </FormControl>
                                                <FormDescription>Your own reference ID for this memo</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={fileForm.control}
                                        name="expiration_date"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Expiration Date</FormLabel>
                                                <FormControl>
                                                    <Input type="datetime-local" {...field} value={field.value ?? ''} />
                                                </FormControl>
                                                <FormDescription>
                                                    Optional expiration date for this memo
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormItem>
                                        <FormLabel>Tags</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Type a tag and press Enter"
                                                value={tagInput}
                                                onChange={(e) => setTagInput(e.target.value)}
                                                onKeyDown={handleAddTag}
                                            />
                                        </FormControl>
                                        <FormDescription>Press Enter to add each tag</FormDescription>
                                        {tags.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {tags.map((tag) => (
                                                    <Badge key={tag} variant="secondary" className="gap-1">
                                                        {tag}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveTag(tag)}
                                                            className="ml-1 hover:bg-muted rounded-full"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </FormItem>

                                    <FormItem>
                                        <FormLabel>Scopes</FormLabel>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Key"
                                                value={scopeKey}
                                                onChange={(e) => setScopeKey(e.target.value)}
                                                onKeyDown={handleScopeKeyDown}
                                                className="flex-1"
                                            />
                                            <Input
                                                placeholder="Value"
                                                value={scopeValue}
                                                onChange={(e) => setScopeValue(e.target.value)}
                                                onKeyDown={handleScopeKeyDown}
                                                className="flex-1"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={handleAddScope}
                                                disabled={!scopeKey.trim() || !scopeValue.trim()}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <FormDescription>Add key-value pairs for access control scopes</FormDescription>
                                        {Object.keys(scopes).length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {Object.entries(scopes).map(([key, value]) => (
                                                    <Badge key={key} variant="secondary" className="gap-1">
                                                        <span className="font-medium">{key}</span>
                                                        <span className="text-muted-foreground">:</span>
                                                        <span>{value}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveScope(key)}
                                                            className="ml-1 hover:bg-muted rounded-full"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </FormItem>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleClose}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting || !selectedFile}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Upload Document
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
