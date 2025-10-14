import './GettingStarted.scss'

interface CodeLanguageTabsProps {
    activeTab: string
    onTabChange: (tab: string) => void
}

const AVAILABLE_TABS = [
    { id: 'curl', label: 'cURL' },
    { id: 'nodejs', label: 'Node.js' },
    { id: 'php', label: 'PHP' },
    { id: 'python', label: 'Python' },
    { id: 'ruby', label: 'Ruby' },
    { id: 'go', label: 'Go' },
    { id: 'rust', label: 'Rust' },
    { id: 'elixir', label: 'Elixir' },
    { id: 'java', label: 'Java' },
    { id: 'dotnet', label: '.NET' },
]

export const CodeLanguageTabs = ({ activeTab, onTabChange }: CodeLanguageTabsProps) => {
    return (
        <div className="code-language-tabs">
            {AVAILABLE_TABS.map((tab) => (
                <button
                    key={tab.id}
                    className={`tab ${activeTab === tab.id ? 'active' : ''} ${tab.id !== 'curl' ? 'disabled' : ''}`}
                    onClick={() => tab.id === 'curl' && onTabChange(tab.id)}
                    disabled={tab.id !== 'curl'}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    )
}
