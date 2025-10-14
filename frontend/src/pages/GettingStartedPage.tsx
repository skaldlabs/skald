import { useState } from 'react'
import { AppLayout } from '@/components/AppLayout/AppLayout'
import { ApiKeyStep } from '@/components/GettingStarted/ApiKeyStep'
import { CreateMemoStep } from '@/components/GettingStarted/CreateMemoStep'
import { SearchMemoStep } from '@/components/GettingStarted/SearchMemoStep'
import '@/components/GettingStarted/GettingStarted.scss'

export const GettingStartedPage = () => {
    const [apiKey, setApiKey] = useState<string | null>(null)
    const [memoCreated, setMemoCreated] = useState(false)

    return (
        <AppLayout>
            <div className="getting-started-container">
                <div className="page-header">
                    <h1>Getting Started</h1>
                    <p>Follow the steps to start using the Skald API</p>
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
