import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check } from 'lucide-react'
import { CodeLanguageTabs } from './CodeLanguageTabs'
import { CodeBlock } from './CodeBlock'
import { domain } from '@/lib/api'
import { useOnboardingStore } from '@/stores/onboardingStore'
import '@/components/GettingStarted/GettingStarted.scss'

export const SearchMemoStep = () => {
    const apiKey = useOnboardingStore((state) => state.apiKey)
    const searchQuery = useOnboardingStore((state) => state.searchQuery)
    const searchResults = useOnboardingStore((state) => state.searchResults)
    const isSearching = useOnboardingStore((state) => state.isSearching)
    const hasSearched = useOnboardingStore((state) => state.hasSearched)
    const setSearchQuery = useOnboardingStore((state) => state.setSearchQuery)
    const searchMemos = useOnboardingStore((state) => state.searchMemos)
    const generateSampleSearch = useOnboardingStore((state) => state.generateSampleSearch)

    const [activeTab, setActiveTab] = useState('curl')

    const searchMethod = 'summary_vector_search'

    const getCurlCommand = () => {
        const sampleQuery = searchQuery || 'search query'

        return `curl -X POST '${domain}/api/v1/search/' \\
  -H 'Authorization: Bearer ${apiKey || 'your_api_key'}' \\
  -H 'Content-Type: application/json' \\
  -d '{
  "query": "${sampleQuery}",
  "search_method": "${searchMethod}",
  "limit": 10
}'`
    }

    const isDisabled = !apiKey
    const isComplete = hasSearched

    return (
        <div className={`getting-started-step ${isComplete ? 'complete' : ''} ${isDisabled ? 'disabled' : ''}`}>
            <div className="step-content">
                <h2 className="step-title">Search for a memo {isComplete && <Check className="title-check" />}</h2>
                <p className="step-description">Implement or run the code below to search your memos</p>

                <div className="code-section">
                    <CodeLanguageTabs activeTab={activeTab} onTabChange={setActiveTab} />
                    <CodeBlock code={getCurlCommand()} language="bash" />
                </div>

                <div className="interactive-section">
                    <div className="form-field">
                        <label>Search Query</label>
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Enter search query"
                            disabled={isDisabled}
                            onKeyDown={(e) => e.key === 'Enter' && searchMemos()}
                        />
                    </div>
                    <div className="button-group">
                        <Button variant="outline" onClick={generateSampleSearch} disabled={isDisabled}>
                            Auto-fill sample
                        </Button>
                        <Button onClick={searchMemos} disabled={isDisabled || isSearching || !searchQuery.trim()}>
                            {isSearching ? 'Searching...' : 'Search memos'}
                        </Button>
                    </div>

                    {hasSearched && (
                        <div className="search-results">
                            <h3>Results ({searchResults.length})</h3>
                            {searchResults.length === 0 ? (
                                <p className="no-results">No memos found. Try creating one first!</p>
                            ) : (
                                <div className="results-list">
                                    {searchResults.map((result) => (
                                        <div key={result.uuid} className="result-item">
                                            <h4>{result.title}</h4>
                                            <p className="result-summary">{result.summary || result.content_snippet}</p>
                                            {result.distance !== null && (
                                                <span className="result-distance">
                                                    Distance: {result.distance.toFixed(4)}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
