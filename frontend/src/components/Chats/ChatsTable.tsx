import type { Chat } from '@/lib/types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageSquare } from 'lucide-react'

interface ChatsTableProps {
    chats: Chat[]
    loading: boolean
    onViewChat: (chat: Chat) => void
}

export const ChatsTable = ({ chats, loading, onViewChat }: ChatsTableProps) => {
    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const truncate = (text: string, maxLength: number) => {
        if (!text) return ''
        return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
    }

    if (loading) {
        return (
            <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
        )
    }

    if (chats.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">
                    No chats yet. Start a conversation in the Playground to get started.
                </p>
            </div>
        )
    }

    return (
        <div className="rounded-md border overflow-x-auto">
            <Table className="w-full table-fixed">
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50%]">Conversation</TableHead>
                        <TableHead className="w-[15%]">Messages</TableHead>
                        <TableHead className="w-[20%]">Created</TableHead>
                        <TableHead className="w-[15%]">Last Activity</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {chats.map((chat) => (
                        <TableRow
                            key={chat.uuid}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => onViewChat(chat)}
                        >
                            <TableCell className="font-medium">
                                <div className="flex items-start gap-2 min-w-0">
                                    <MessageSquare className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
                                    <p className="line-clamp-2 break-words" title={chat.title}>
                                        {truncate(chat.title, 120)}
                                    </p>
                                </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{chat.message_count}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                                {formatDate(chat.created_at)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                                {formatDate(chat.last_message_at)}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
