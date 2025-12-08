import { PublicChatMessagesList } from './PublicChatMessagesList'
import { PublicChatInput } from './PublicChatInput'

interface PublicChatProps {
    slug: string
}

export const PublicChat = ({ slug }: PublicChatProps) => {
    return (
        <div className="chat-container">
            <PublicChatMessagesList />
            <PublicChatInput slug={slug} />
        </div>
    )
}
