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
    { id: 'dotnet', label: '.NET' },
    { id: 'cli', label: 'CLI' },
]

export const CodeLanguageTabs = ({ activeTab, onTabChange }: CodeLanguageTabsProps) => {
    return (
        <div className="code-language-tabs">
            {AVAILABLE_TABS.map((tab) => (
                <button
                    key={tab.id}
                    className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => onTabChange(tab.id)}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    )
}
