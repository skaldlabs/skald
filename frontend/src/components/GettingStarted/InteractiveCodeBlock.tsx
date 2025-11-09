import { useState, useEffect, useRef, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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

interface CodeSegment {
    type: 'code' | 'input'
    content: string
    inputKey?: string
}

const parseCodeWithInputs = (code: string, inputs: InputField[]): CodeSegment[] => {
    const segments: CodeSegment[] = []

    // Create a map of input keys for quick lookup
    const inputKeys = inputs.map((input) => input.key)

    // Find all placeholders in the code
    const placeholderRegex = /\{(\w+)\}/g
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = placeholderRegex.exec(code)) !== null) {
        const placeholderKey = match[1]

        // Only process if this is a valid input key
        if (inputKeys.includes(placeholderKey)) {
            // Add the code before this placeholder
            if (match.index > lastIndex) {
                segments.push({
                    type: 'code',
                    content: code.slice(lastIndex, match.index),
                })
            }

            // Add the input placeholder
            segments.push({
                type: 'input',
                content: match[0],
                inputKey: placeholderKey,
            })

            lastIndex = match.index + match[0].length
        }
    }

    // Add any remaining code
    if (lastIndex < code.length) {
        segments.push({
            type: 'code',
            content: code.slice(lastIndex),
        })
    }

    return segments
}

export const InteractiveCodeBlock = ({ code, language = 'bash', onCopy, inputs }: InteractiveCodeBlockProps) => {
    const [isCopied, setIsCopied] = useState(false)
    const codeContentRef = useRef<HTMLDivElement>(null)

    // Create a map for quick input lookup
    const inputMap = inputs.reduce(
        (acc, input) => {
            acc[input.key] = input
            return acc
        },
        {} as Record<string, InputField>
    )

    // Generate the actual code with values for copying
    const getCodeWithValues = () => {
        let result = code
        inputs.forEach((input) => {
            result = result.replace(new RegExp(`\\{${input.key}\\}`, 'g'), input.value || '')
        })
        return result
    }

    const handleCopy = async () => {
        await navigator.clipboard.writeText(getCodeWithValues())
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

                const codeText = getCodeWithValues()
                e.clipboardData?.setData('text/plain', codeText)

                onCopy?.()
            }
        }

        document.addEventListener('copy', handleManualCopy)

        return () => {
            document.removeEventListener('copy', handleManualCopy)
        }
    }, [code, inputs, onCopy])

    const segments = parseCodeWithInputs(code, inputs)

    // Render inline input
    const renderInput = (inputKey: string) => {
        const input = inputMap[inputKey]
        if (!input) return null

        const baseClassName = 'inline-code-input'
        const inputClassName = `${baseClassName} ${input.disabled ? 'disabled' : ''}`

        if (input.type === 'textarea') {
            return (
                <Textarea
                    value={input.value}
                    onChange={(e) => input.onChange(e.target.value)}
                    placeholder={input.placeholder}
                    disabled={input.disabled}
                    className={inputClassName}
                    rows={3}
                />
            )
        }

        return (
            <Input
                value={input.value}
                onChange={(e) => input.onChange(e.target.value)}
                placeholder={input.placeholder}
                disabled={input.disabled}
                className={inputClassName}
            />
        )
    }

    // Split segments into lines and render with proper formatting
    const renderSegments = () => {
        const lines: ReactNode[] = []
        let currentLine: ReactNode[] = []
        let lineKey = 0

        segments.forEach((segment, segmentIndex) => {
            if (segment.type === 'input' && segment.inputKey) {
                // Add input inline
                currentLine.push(
                    <span key={`input-${segmentIndex}`} className="inline-input-wrapper">
                        {renderInput(segment.inputKey)}
                    </span>
                )
            } else {
                // Split code segment by newlines
                const lines_in_segment = segment.content.split('\n')
                lines_in_segment.forEach((lineContent, lineIndex) => {
                    if (lineIndex > 0) {
                        // Push current line and start a new one
                        lines.push(
                            <div key={`line-${lineKey++}`} className="code-line">
                                {currentLine}
                            </div>
                        )
                        currentLine = []
                    }
                    if (lineContent) {
                        currentLine.push(
                            <SyntaxHighlighter
                                key={`code-${segmentIndex}-${lineIndex}`}
                                language={language}
                                style={dracula}
                                PreTag="span"
                                customStyle={{ background: 'transparent', padding: 0, margin: 0 }}
                            >
                                {lineContent}
                            </SyntaxHighlighter>
                        )
                    }
                })
            }
        })

        // Push the last line
        if (currentLine.length > 0) {
            lines.push(
                <div key={`line-${lineKey}`} className="code-line">
                    {currentLine}
                </div>
            )
        }

        return lines
    }

    return (
        <div className="code-block-wrapper interactive">
            <div className="code-block-header">
                <Button variant="ghost" size="icon" onClick={handleCopy} className="copy-button">
                    {isCopied ? <Check size={18} /> : <Copy size={18} />}
                </Button>
            </div>
            <div className="interactive-code-content" ref={codeContentRef}>
                {renderSegments()}
            </div>
        </div>
    )
}
