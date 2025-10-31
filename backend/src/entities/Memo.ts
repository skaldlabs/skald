import { DeferMode, Entity, Index, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core'
import { Project } from '@/entities/Project'

@Entity({ tableName: 'skald_memo' })
@Index({ name: 'skald_memo_project_8101aa_idx', properties: ['project', 'client_reference_id'] })
@Index({ name: 'skald_memo_project_88bd2e_idx', properties: ['project', 'source'] })
@Index({
    expression: 'CREATE INDEX skald_memo_metadat_9c96be_gin ON public.skald_memo USING gin (metadata);',
    name: 'skald_memo_metadat_9c96be_gin',
})
export class Memo {
    @PrimaryKey({ type: 'uuid' })
    uuid!: string

    @Property()
    created_at!: Date

    @Property()
    updated_at!: Date

    @Property()
    title!: string

    @Property()
    content_length!: number

    @Property({ type: 'json' })
    metadata!: any

    @Property({ nullable: true })
    expiration_date?: Date

    @Property()
    archived!: boolean

    @Property()
    content_hash!: string

    @Property()
    pending!: boolean

    @Property({ nullable: true })
    type?: string

    @Property({ nullable: true })
    source?: string

    @Property({ nullable: true })
    client_reference_id?: string

    @ManyToOne({
        entity: () => Project,
        fieldName: 'project_id',
        deferMode: DeferMode.INITIALLY_DEFERRED,
        index: 'skald_memo_project_id_b4c56bf7',
    })
    project!: Project
}
