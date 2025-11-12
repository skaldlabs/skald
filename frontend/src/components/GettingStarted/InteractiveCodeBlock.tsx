import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { dracula } from 'react-syntax-highlighter/dist/cjs/styles/prism'

import './GettingStarted.scss'

interface InputField {
    key: string
    value: string
    onChange: (value: string) => void
    placeholder?: string
    type?: 'input' | 'textarea'
    disabled?: boolean
}

interface InteractiveCodeBlockProps {
    code: string
    language?: string
    onCopy?: () => void
    inputs: InputField[]
}

export const InteractiveCodeBlock = ({ code, language = 'bash', onCopy }: InteractiveCodeBlockProps) => {
    const [isCopied, setIsCopied] = useState(false)
    const codeContentRef = useRef<HTMLDivElement>(null)

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code)
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
        onCopy?.()
    }

    useEffect(() => {
        const handleManualCopy = (e: ClipboardEvent) => {
            const selection = window.getSelection()
            if (!selection || !codeContentRef.current) return

            if (codeContentRef.current.contains(selection.anchorNode)) {
                e.preventDefault()

                e.clipboardData?.setData('text/plain', code)

                onCopy?.()
            }
        }

        document.addEventListener('copy', handleManualCopy)

        return () => {
            document.removeEventListener('copy', handleManualCopy)
        }
    }, [code, onCopy])

    return (
        <div className="code-block-wrapper interactive">
            <div className="code-block-header">
                <Button variant="ghost" size="icon" onClick={handleCopy} className="copy-button">
                    {isCopied ? <Check size={18} /> : <Copy size={18} />}
                </Button>
            </div>
            <div className="interactive-code-content" ref={codeContentRef}>
                <SyntaxHighlighter language={language} style={dracula} customStyle={{ background: 'transparent' }}>
                    {code}
                </SyntaxHighlighter>
            </div>
        </div>
    )
}
