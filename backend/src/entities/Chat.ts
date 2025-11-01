import { DeferMode, Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core'
import { Project } from '@/entities/Project'

@Entity({ tableName: 'skald_chat' })
export class Chat {
    @PrimaryKey({ type: 'uuid' })
    uuid!: string

    @ManyToOne({
        entity: () => Project,
        fieldName: 'project_id',
        deferMode: DeferMode.INITIALLY_DEFERRED,
        index: 'skald_chat_project_id_9243jsue',
    })
    project!: Project

    @Property()
    created_at!: Date
}
