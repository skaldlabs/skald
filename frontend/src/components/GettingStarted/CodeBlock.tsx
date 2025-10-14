import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import './GettingStarted.scss'

interface CodeBlockProps {
    code: string
    language?: string
}

export const CodeBlock = ({ code, language = 'bash' }: CodeBlockProps) => {
    const [isCopied, setIsCopied] = useState(false)

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
            <pre className="code-block">
                <code>{code}</code>
            </pre>
        </div>
    )
}
