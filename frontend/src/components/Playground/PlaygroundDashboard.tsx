import { ChatMessagesList } from './ChatMessagesList'
import { ChatInput } from './ChatInput'
import { useProjectStore } from '@/stores/projectStore'
import { Info } from 'lucide-react'
import { PageHeader } from '@/components/AppLayout/PageHeader'
import { Alert, AlertDescription } from '@/components/ui/alert'
import './Playground.scss'

export const PlaygroundDashboard = () => {
    const { currentProject } = useProjectStore()

    if (!currentProject) {
        return (
            <div className="playground-dashboard">
                <div className="no-project-alert">
                    <Info className="h-4 w-4" />
                    <p>Please select a project to start chatting with your data.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="playground-dashboard">
            <PageHeader title="Playground" />
            <Alert className="my-4 [&>svg]:top-3">
                <Info className="h-4 w-4" />
                <AlertDescription>
                    We don't currently support chat history, so each of your messages in this chat is independent from
                    others. We're adding support for chat history this week.
                </AlertDescription>
            </Alert>
            <div className="chat-container">
                <ChatMessagesList />
                <ChatInput />
            </div>
        </div>
    )
}
