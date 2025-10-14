import { useState } from 'react'
import { AppLayout } from '@/components/AppLayout/AppLayout'
import { ApiKeyStep } from '@/components/GettingStarted/ApiKeyStep'
import { CreateMemoStep } from '@/components/GettingStarted/CreateMemoStep'
import { SearchMemoStep } from '@/components/GettingStarted/SearchMemoStep'
import '@/components/GettingStarted/GettingStarted.scss'

export const GettingStartedPage = () => {
    const [apiKey, setApiKey] = useState<string | null>(null)

    return (
        <AppLayout>
            <div className="getting-started-container">
                <div className="page-header">
                    <h1>Create your first memo</h1>
                    <p>Follow the steps to create your first memo and search it</p>
                </div>

                <div className="steps-container">
                    <ApiKeyStep onApiKeyGenerated={setApiKey} />
                    <CreateMemoStep apiKey={apiKey} />
                    <SearchMemoStep apiKey={apiKey} isEnabled={!!apiKey} />
                </div>
            </div>
        </AppLayout>
    )
}
