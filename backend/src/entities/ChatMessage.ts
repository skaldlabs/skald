import { DeferMode, Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core'
import { Project } from '@/entities/Project'
import { Chat } from './Chat'

@Entity({ tableName: 'skald_chatmessage' })
export class ChatMessage {
    @PrimaryKey({ type: 'uuid' })
    uuid!: string

    @ManyToOne({
        entity: () => Project,
        fieldName: 'project_id',
        deferMode: DeferMode.INITIALLY_DEFERRED,
        index: 'skald_chat_project_id_92ds3jsue',
    })
    project!: Project

    @ManyToOne({
        entity: () => Chat,
        fieldName: 'chat_id',
        deferMode: DeferMode.INITIALLY_DEFERRED,
        index: 'skald_chatmessage_chat_id_32455sja',
    })
    chat!: Chat

    @Property({ type: 'text' })
    content!: string

    @Property()
    sent_by!: string // 'user' | 'model'

    @Property()
    sent_at!: Date
}
