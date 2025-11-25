import { DeferMode, Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core'
import { Project } from './Project'
import { MemoFilter } from '@/lib/filterUtils'

@Entity({ tableName: 'skald_searchrequest' })
export class SearchRequest {
    @PrimaryKey({ type: 'uuid' })
    uuid!: string

    @ManyToOne({
        entity: () => Project,
        fieldName: 'project_id',
        deferMode: DeferMode.INITIALLY_DEFERRED,
        index: 'skald_searchrequest_project_id_idx',
    })
    project!: Project

    @Property()
    query!: string

    @Property({ type: 'jsonb', nullable: true })
    filters?: MemoFilter[]

    @Property({ type: 'jsonb', nullable: true })
    results?: Record<string, any>[]

    @Property()
    created_at!: Date
}
