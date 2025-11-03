import { DeferMode, Entity, Index, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core'
import { Project } from '@/entities/Project'
import { Chat } from './Chat'

@Entity({ tableName: 'skald_chatmessage' })
export class ChatMessage {
    @PrimaryKey({ type: 'uuid' })
    uuid!: string

    @Index()
    @Property({ nullable: true })
    message_group_id?: string

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

    // in order to save disk space on the db we could ofc store this as e.g. v1, v2, etc
    // but shouldn't need it now
    @Property({ type: 'text', nullable: true })
    skald_system_prompt?: string

    @Property({ type: 'text', nullable: true })
    client_system_prompt?: string

    @Property()
    sent_by!: string // 'user' | 'model'

    @Property()
    sent_at!: Date
}
