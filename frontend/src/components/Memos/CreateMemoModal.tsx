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
import { X, Loader2 } from 'lucide-react'
import { useMemoStore } from '@/stores/memoStore'
import { toast } from 'sonner'

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

type MemoFormValues = z.infer<typeof memoFormSchema>

interface CreateMemoModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export const CreateMemoModal = ({ open, onOpenChange }: CreateMemoModalProps) => {
    const [tagInput, setTagInput] = useState('')
    const [tags, setTags] = useState<string[]>([])
    const createMemo = useMemoStore((state) => state.createMemo)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<MemoFormValues>({
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

    const onSubmit = async (data: MemoFormValues) => {
        setIsSubmitting(true)
        try {
            const payload = {
                ...data,
                tags: tags.length > 0 ? tags : undefined,
                // Convert empty strings to null/undefined for optional fields
                source: data.source?.trim() || undefined,
                type: data.type?.trim() || undefined,
                client_reference_id: data.client_reference_id?.trim() || undefined,
                expiration_date: data.expiration_date?.trim() || undefined,
            }

            const success = await createMemo(payload)
            if (success) {
                form.reset()
                setTags([])
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

    const handleClose = () => {
        if (!isSubmitting) {
            form.reset()
            setTags([])
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Memo</DialogTitle>
                    <DialogDescription>
                        Add a new memo to your project. Only title and content are required.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Required Fields */}
                        <div className="space-y-4">
                            <FormField
                                control={form.control}
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
                                control={form.control}
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
                                            The main content of the memo will be processed and indexed for search
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
                                control={form.control}
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
                                control={form.control}
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
                                control={form.control}
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
                                control={form.control}
                                name="expiration_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Expiration Date</FormLabel>
                                        <FormControl>
                                            <Input type="datetime-local" {...field} value={field.value ?? ''} />
                                        </FormControl>
                                        <FormDescription>Optional expiration date for this memo</FormDescription>
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
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Memo
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
