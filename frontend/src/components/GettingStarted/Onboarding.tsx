import { ApiKeyStep } from '@/components/GettingStarted/ApiKeyStep'
import { CreateMemoStep } from '@/components/GettingStarted/CreateMemoStep'
import { ChatStep } from '@/components/GettingStarted/ChatStep'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { ExternalLink } from 'lucide-react'
import '@/components/GettingStarted/GettingStarted.scss'

export const Onboarding = () => {
    return (
        <div className="getting-started-container">
            <div className="page-header">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <div>
                        <h1>Create your first memo</h1>
                        <p>Follow the steps to create your first memo and chat with it.</p>
                    </div>
                </div>
            </div>

            <div className="steps-container">
                <ApiKeyStep />
                <CreateMemoStep />
                <ChatStep />
            </div>

            <div className="mt-8 p-6 bg-muted/50 rounded-lg border">
                <h3 className="text-lg font-semibold mb-2">Want to learn more?</h3>
                <p className="text-sm text-muted-foreground mb-3">
                    Check out our full documentation for detailed guides, API references, and advanced features.
                </p>
                <a
                    href="https://docs.useskald.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                    View Documentation
                    <ExternalLink className="h-4 w-4" />
                </a>
            </div>
        </div>
    )
}
