import { logger } from '@/lib/logger'
import { ChatMessage } from '@/entities/ChatMessage'
import { DI } from '@/di'
import { Project } from '@/entities/Project'
import { Chat } from '@/entities/Chat'
import { randomUUID } from 'crypto'
import { CHAT_AGENT_INSTRUCTIONS } from '@/agents/chatAgent/prompts'
import { LLMService } from '@/services/llmService'
import { getMemoryExtractionPrompt } from '@/lib/prompts'

export interface ChatHistoryMessage {
    role: 'user' | 'model'
    content: string
}

const TOKEN_THRESHOLD = 2000
const RECENT_MESSAGES_TO_KEEP = 10

export const getFullChatHistory = async (chatId: string, project: Project): Promise<ChatHistoryMessage[]> => {
    try {
        const chat = await DI.em.findOne(Chat, { uuid: chatId, project: project.uuid })
        if (!chat) {
            return []
        }

        const messages = await DI.em.find(
            ChatMessage,
            { chat: chat, project: project },
            { orderBy: { sent_at: 'ASC' } }
        )

        return messages.map((msg) => ({
            role: msg.sent_by === 'user' ? 'user' : 'model',
            content: msg.content,
        }))
    } catch (error) {
        logger.error({ err: error, chatId }, 'Error retrieving chat history')
        return []
    }
}

const _summarizeOldMessages = async (messages: ChatHistoryMessage[]): Promise<string> => {
    if (messages.length === 0) {
        return ''
    }

    try {
        const llm = LLMService.getLLM({ purpose: 'classification' })
        const conversationText = messages
            .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
            .join('\n\n')

        const summaryPrompt = getMemoryExtractionPrompt(conversationText)

        const result = await llm.invoke([
            {
                role: 'user',
                content: summaryPrompt,
            },
        ])
        const summary = typeof result.content === 'string' ? result.content : String(result.content)
        return summary
    } catch (error) {
        logger.error({ err: error }, 'Error summarizing old messages')
        // Fall back to a simple truncation if summarization fails
        const truncated = messages
            .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
            .join('\n\n')
        return `Previous conversation (truncated): ${truncated.substring(0, 500)}...`
    }
}

const _estimateTokens = (text: string): number => {
    // Rough estimate: 1 token ≈ 4 characters (conservative)
    return Math.ceil(text.length / 4)
}

export const getOptimizedChatHistory = async (
    chatId: string | undefined,
    project: Project
): Promise<Array<['human' | 'ai' | 'system', string]>> => {
    if (!chatId) {
        return []
    }

    const history = await getFullChatHistory(chatId, project)
    if (history.length === 0) {
        return []
    }

    const totalText = history.map((msg) => msg.content).join(' ')
    const totalTokens = _estimateTokens(totalText)

    if (totalTokens <= TOKEN_THRESHOLD) {
        return history.map((msg) => [msg.role === 'user' ? 'human' : 'ai', msg.content])
    }

    const recentMessages = history.slice(-RECENT_MESSAGES_TO_KEEP)
    const oldMessages = history.slice(0, -RECENT_MESSAGES_TO_KEEP)

    const summary = await _summarizeOldMessages(oldMessages)
    const formattedHistory: Array<['human' | 'ai' | 'system', string]> = []

    if (summary) {
        formattedHistory.push(['system', `Previous conversation summary: ${summary}`])
    }

    for (const msg of recentMessages) {
        formattedHistory.push([msg.role === 'user' ? 'human' : 'ai', msg.content])
    }

    return formattedHistory
}

export const createChatMessagePair = async (
    project: Project,
    userMessage: string,
    modelMessage: string,
    chatId?: string,
    clientSystemPrompt?: string | null
): Promise<string> => {
    const entitiesToPersist = []
    let chat: Chat
    if (!chatId) {
        chat = DI.em.create(Chat, {
            uuid: randomUUID(),
            project: project,
            created_at: new Date(),
        })
        entitiesToPersist.push(chat)
    } else {
        try {
            chat = await DI.em.findOneOrFail(Chat, { uuid: chatId, project: project })
        } catch {
            chat = DI.em.create(Chat, {
                uuid: randomUUID(),
                project: project,
                created_at: new Date(),
            })
            entitiesToPersist.push(chat)
        }
    }

    const messageGroupId = randomUUID()
    const timestamp = Date.now()
    const userMessageEntity = DI.em.create(ChatMessage, {
        uuid: randomUUID(),
        message_group_id: messageGroupId,
        project: project,
        chat: chat,
        content: userMessage,
        skald_system_prompt: CHAT_AGENT_INSTRUCTIONS,
        client_system_prompt: clientSystemPrompt || null,
        sent_by: 'user',
        sent_at: new Date(timestamp),
    })
    entitiesToPersist.push(userMessageEntity)

    const modelMessageEntity = DI.em.create(ChatMessage, {
        uuid: randomUUID(),
        message_group_id: messageGroupId,
        project: project,
        chat: chat,
        content: modelMessage,
        sent_by: 'model',
        sent_at: new Date(timestamp + 1), // ensure we keep an ordering of messages
    })
    entitiesToPersist.push(modelMessageEntity)

    await DI.em.persistAndFlush(entitiesToPersist)
    return chat.uuid
}
