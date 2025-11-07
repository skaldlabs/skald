import { DeferMode, Entity, Index, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core'
import { Project } from '@/entities/Project'

export type MemoProcessingStatus = 'received' | 'processing' | 'processed' | 'error'

@Entity({ tableName: 'skald_memo' })
@Index({ name: 'skald_memo_project_8101aa_idx', properties: ['project', 'client_reference_id'] })
@Index({ name: 'skald_memo_project_88bd2e_idx', properties: ['project', 'source'] })
@Index({
    expression: 'CREATE INDEX skald_memo_metadat_9c96be_gin ON public.skald_memo USING gin (metadata);',
    name: 'skald_memo_metadat_9c96be_gin',
})
@Index({ name: 'skald_memo_processing_status_idx', properties: ['processing_status'] })
export class Memo {
    @PrimaryKey({ type: 'uuid' })
    uuid!: string

    @Property()
    created_at!: Date

    @Property()
    updated_at!: Date

    @Property()
    title!: string

    // nullable because we don't always set it when creating a memo
    @Property({ nullable: true })
    content_length?: number

    // nullable because we don't always set it when creating a memo
    @Property({ nullable: true })
    content_hash?: string

    @Property({ type: 'json' })
    metadata!: any

    @Property({ nullable: true })
    expiration_date?: Date | null

    @Property()
    archived!: boolean

    @Property({ default: 'received' })
    processing_status!: MemoProcessingStatus

    @Property({ nullable: true })
    processing_error?: string

    @Property({ nullable: true })
    processing_started_at?: Date

    @Property({ nullable: true })
    processing_completed_at?: Date

    @Property({ nullable: true })
    // this could also be code, image, etc, in the future.
    type?: string // 'plaintext' | 'document'

    @Property({ nullable: true })
    document_format?: string | null

    @Property({ nullable: true })
    object_storage_url?: string

    @Property({ nullable: true })
    source?: string | null

    @Property({ nullable: true })
    client_reference_id?: string | null

    @ManyToOne({
        entity: () => Project,
        fieldName: 'project_id',
        deferMode: DeferMode.INITIALLY_DEFERRED,
        index: 'skald_memo_project_id_b4c56bf7',
    })
    project!: Project
}
