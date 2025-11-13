import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import type { DetailedChat, ChatMessage } from '@/lib/types'
import { User, Bot } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface ChatDrawerProps {
    open: boolean
    onClose: () => void
    chat: DetailedChat | null
    loading: boolean
}

const ChatMessageDisplay = ({ message }: { message: ChatMessage }) => {
    const isUser = message.sent_by === 'user'

    return (
        <div className={`flex gap-3 mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                </div>
            )}
            <div className={`flex flex-col gap-1 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                    className={`rounded-lg px-4 py-2 ${
                        isUser
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground border border-border'
                    }`}
                >
                    {isUser ? (
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    ) : (
                        <div className="text-sm prose prose-sm dark:prose-invert max-w-none react-markdown">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                    )}
                </div>
                <span className="text-xs text-muted-foreground">
                    {new Date(message.sent_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </span>
            </div>
            {isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                </div>
            )}
        </div>
    )
}

export const ChatDrawer = ({ open, onClose, chat, loading }: ChatDrawerProps) => {
    return (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Conversation History</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-20 w-full" />
                                </div>
                            ))}
                        </div>
                    ) : chat ? (
                        <div className="space-y-1 px-4">
                            {chat.messages.map((message) => (
                                <ChatMessageDisplay key={message.uuid} message={message} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-32">
                            <p className="text-muted-foreground">No chat selected</p>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
