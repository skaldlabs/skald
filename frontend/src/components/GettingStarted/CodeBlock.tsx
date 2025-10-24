import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { dracula } from 'react-syntax-highlighter/dist/cjs/styles/prism'

import './GettingStarted.scss'

interface CodeBlockProps {
    code: string
    language?: string
}

export const CodeBlock = ({ code, language = 'bash' }: CodeBlockProps) => {
    const [isCopied, setIsCopied] = useState(false)

    console.log('language', language)

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code)
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
    }

    return (
        <div className="code-block-wrapper">
            <div className="code-block-header">
                <Button variant="ghost" size="icon" onClick={handleCopy} className="copy-button">
                    {isCopied ? <Check size={18} /> : <Copy size={18} />}
                </Button>
            </div>
            <SyntaxHighlighter
                language={language}
                style={dracula}
                customStyle={{ padding: '1.5rem', paddingTop: '3rem', overflowX: 'auto', margin: '0' }}
            >
                {code}
            </SyntaxHighlighter>
        </div>
    )
}
