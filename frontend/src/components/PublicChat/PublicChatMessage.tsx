import { PublicChatMessage as PublicChatMessageType } from '@/stores/publicChatStore'
import ReactMarkdown from 'react-markdown'
import { ReferenceLink } from '../Playground/ReferenceLink'

interface PublicChatMessageProps {
    message: PublicChatMessageType
    referencesEnabled?: boolean
}

// Parse content and replace [[X]] with ReferenceLink components
const parseContentWithReferences = (
    content: string,
    references?: Record<number, { memo_uuid: string; memo_title: string }>
) => {
    if (!references || Object.keys(references).length === 0) {
        return <ReactMarkdown>{content}</ReactMarkdown>
    }

    // Helper function to process text and replace [[X]] with ReferenceLink
    const processText = (text: string): any[] => {
        const parts: any[] = []
        const regex = /\[\[(\d+)\]\]/g
        let lastIndex = 0
        let match

        while ((match = regex.exec(text)) !== null) {
            // Add text before the match
            if (match.index > lastIndex) {
                parts.push(text.slice(lastIndex, match.index))
            }

            // Add the reference link
            const index = parseInt(match[1], 10)
            const reference = references[index]

            if (reference) {
                parts.push(
                    <ReferenceLink
                        key={`ref-${index}-${match.index}`}
                        index={index}
                        memo_uuid={reference.memo_uuid}
                        memo_title={reference.memo_title}
                    />
                )
            } else {
                // If reference not found, show [X] instead of [[X]]
                parts.push(`[${match[1]}]`)
            }

            lastIndex = regex.lastIndex
        }

        // Add remaining text
        if (lastIndex < text.length) {
            parts.push(text.slice(lastIndex))
        }

        return parts.length > 0 ? parts : [text]
    }

    // Helper to recursively process children
    const processChildren = (children: any): any => {
        if (typeof children === 'string') {
            return processText(children)
        }
        if (Array.isArray(children)) {
            return children.map(processChildren).flat()
        }
        return children
    }

    // Custom components for ReactMarkdown to handle inline references
    const components = {
        p: ({ children }: any) => <p>{processChildren(children)}</p>,
        li: ({ children }: any) => <li>{processChildren(children)}</li>,
        strong: ({ children }: any) => <strong>{processChildren(children)}</strong>,
        em: ({ children }: any) => <em>{processChildren(children)}</em>,
        code: ({ children }: any) => <code>{processChildren(children)}</code>,
    }

    return <ReactMarkdown components={components}>{content}</ReactMarkdown>
}

export const PublicChatMessage = ({ message, referencesEnabled = false }: PublicChatMessageProps) => {
    const isAssistant = message.role === 'assistant'

    const shouldShowReferences = isAssistant && referencesEnabled && message.references

    return (
        <div className={`public-chat-message ${message.role}`}>
            <div className={`public-message-content react-markdown ${isAssistant ? 'assistant-content' : ''}`}>
                {shouldShowReferences ? (
                    parseContentWithReferences(message.content, message.references)
                ) : (
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                )}
                {message.isStreaming && !message.content && <span className="streaming-cursor"></span>}
            </div>
        </div>
    )
}
