import { ChatMessagesList } from './ChatMessagesList'
import { ChatInput } from './ChatInput'

export const Chat = () => {
    return (
        <div className="chat-container">
            <ChatMessagesList />
            <ChatInput />
        </div>
    )
}
