import { ApiKeyStep } from '@/components/GettingStarted/ApiKeyStep'
import { CreateMemoStep } from '@/components/GettingStarted/CreateMemoStep'
import { ChatStep } from '@/components/GettingStarted/ChatStep'
import { SearchMemoStep } from '@/components/GettingStarted/SearchMemoStep'
import { SidebarTrigger } from '@/components/ui/sidebar'
import '@/components/GettingStarted/GettingStarted.scss'

export const Onboarding = () => {
    return (
        <div className="getting-started-container">
            <div className="page-header">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <div>
                        <h1>Create your first memo</h1>
                        <p>Follow the steps to create your first memo, chat with it, and search it</p>
                    </div>
                </div>
            </div>

            <div className="steps-container">
                <ApiKeyStep />
                <CreateMemoStep />
                <ChatStep />
                <SearchMemoStep />
            </div>
        </div>
    )
}
