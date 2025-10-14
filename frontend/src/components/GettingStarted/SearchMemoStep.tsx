import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check } from 'lucide-react'
import { CodeLanguageTabs } from './CodeLanguageTabs'
import { CodeBlock } from './CodeBlock'
import { domain } from '@/lib/api'
import { toast } from 'sonner'
import { useProjectStore } from '@/stores/projectStore'
import './GettingStarted.scss'

// Helper to get CSRF token from cookies
const getCsrfToken = (): string | null => {
    const name = 'csrftoken'
    let cookieValue = null
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';')
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim()
            if (cookie.substring(0, name.length + 1) === `${name}=`) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
                break
            }
        }
    }
    return cookieValue
}

interface SearchMemoStepProps {
    apiKey: string | null
    isEnabled: boolean
}

interface SearchResult {
    title: string
    uuid: string
    content_snippet: string
    summary: string
    distance: number | null
}

export const SearchMemoStep = ({ apiKey, isEnabled }: SearchMemoStepProps) => {
    const { currentProject } = useProjectStore()
    const [activeTab, setActiveTab] = useState('curl')
    const [query, setQuery] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const [searchResults, setSearchResults] = useState<SearchResult[]>([])
    const [hasSearched, setHasSearched] = useState(false)

    const searchMethod = 'summary_vector_search'

    const generateSampleSearch = () => {
        setQuery('first memo')
    }

    const handleSearch = async () => {
        if (!apiKey || !currentProject) {
            toast.error('Please generate an API key first')
            return
        }

        if (!query.trim()) {
            toast.error('Please enter a search query')
            return
        }

        setIsSearching(true)
        setHasSearched(true)
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            }

            const csrfToken = getCsrfToken()
            if (csrfToken) {
                headers['X-CSRFToken'] = csrfToken
            }

            const response = await fetch(`${domain}/api/v1/search/`, {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify({
                    query,
                    search_method: searchMethod,
                    limit: 5,
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to search memos')
            }

            const data = await response.json()
            setSearchResults(data.results || [])

            if (data.results && data.results.length > 0) {
                toast.success(`Found ${data.results.length} result(s)`)
            } else {
                toast.info('No results found')
            }
        } catch (error) {
            toast.error('Failed to search memos')
            console.error(error)
        } finally {
            setIsSearching(false)
        }
    }

    const getCurlCommand = () => {
        const sampleQuery = query || 'search query'

        return `curl -X POST '${domain}/api/v1/search/' \\
  -H 'Authorization: Bearer ${apiKey || 'your_api_key'}' \\
  -H 'Content-Type: application/json' \\
  -d '{
  "query": "${sampleQuery}",
  "search_method": "${searchMethod}",
  "limit": 10
}'`
    }

    const isDisabled = !apiKey || !isEnabled
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
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Enter search query"
                            disabled={isDisabled}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    <div className="button-group">
                        <Button variant="outline" onClick={generateSampleSearch} disabled={isDisabled}>
                            Auto-fill sample
                        </Button>
                        <Button onClick={handleSearch} disabled={isDisabled || isSearching || !query.trim()}>
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
