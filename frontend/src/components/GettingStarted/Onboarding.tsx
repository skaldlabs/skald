import { ApiKeyStep } from '@/components/GettingStarted/ApiKeyStep'
import { CreateMemoStep } from '@/components/GettingStarted/CreateMemoStep'
import { SearchMemoStep } from '@/components/GettingStarted/SearchMemoStep'
import '@/components/GettingStarted/GettingStarted.scss'

export const Onboarding = () => {
    return (
        <div className="getting-started-container">
            <div className="page-header">
                <h1>Create your first memo</h1>
                <p>Follow the steps to create your first memo and search it</p>
            </div>

            <div className="steps-container">
                <ApiKeyStep />
                <CreateMemoStep />
                <SearchMemoStep />
            </div>
        </div>
    )
}
