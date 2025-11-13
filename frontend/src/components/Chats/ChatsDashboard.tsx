import { useEffect, useState } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { useChatsListStore } from '@/stores/chatsListStore'
import type { Chat } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { ChatsTable } from './ChatsTable'
import { ChatDrawer } from './ChatDrawer'
import { PageHeader } from '@/components/AppLayout/PageHeader'

export const ChatsDashboard = () => {
    const currentProject = useProjectStore((state) => state.currentProject)

    const chats = useChatsListStore((state) => state.chats)
    const loading = useChatsListStore((state) => state.loading)
    const fetchChats = useChatsListStore((state) => state.fetchChats)
    const getChatDetails = useChatsListStore((state) => state.getChatDetails)
    const selectedChat = useChatsListStore((state) => state.selectedChat)
    const loadingChatDetails = useChatsListStore((state) => state.loadingChatDetails)
    const clearSelectedChat = useChatsListStore((state) => state.clearSelectedChat)

    const [drawerOpen, setDrawerOpen] = useState(false)

    const handleViewChat = async (chat: Chat) => {
        await getChatDetails(chat.uuid)
        setDrawerOpen(true)
    }

    const handleCloseDrawer = () => {
        setDrawerOpen(false)
        clearSelectedChat()
    }

    const handleRefresh = () => {
        fetchChats()
    }

    useEffect(() => {
        if (currentProject) {
            fetchChats()
        }
    }, [currentProject, fetchChats])

    if (!currentProject) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <p className="text-muted-foreground">Please select a project to view chats</p>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <PageHeader title="Chats">
                <div className="flex gap-2">
                    <Button onClick={handleRefresh} disabled={loading} variant="outline" size="sm">
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </PageHeader>

            <ChatsTable chats={chats} loading={loading} onViewChat={handleViewChat} />

            <ChatDrawer
                open={drawerOpen}
                onClose={handleCloseDrawer}
                chat={selectedChat}
                loading={loadingChatDetails}
            />
        </div>
    )
}
