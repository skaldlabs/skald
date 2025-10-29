import { DeferMode, Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core'
import { Memo } from './Memo'
import { Project } from './Project'

@Entity({ tableName: 'skald_memochunk' })
export class MemoChunk {
    @PrimaryKey({ type: 'uuid' })
    uuid!: string

    @Property({ type: 'text' })
    chunk_content!: string

    @Property()
    chunk_index!: number

    @Property({ columnType: 'vector(2048)', ignoreSchemaChanges: ['type'] })
    embedding!: unknown

    @ManyToOne({
        entity: () => Memo,
        fieldName: 'memo_id',
        deferMode: DeferMode.INITIALLY_DEFERRED,
        index: 'skald_memochunk_memo_id_0faad25b',
    })
    memo!: Memo

    @ManyToOne({
        entity: () => Project,
        fieldName: 'project_id',
        deferMode: DeferMode.INITIALLY_DEFERRED,
        index: 'skald_memochunk_project_id_6ec66677',
    })
    project!: Project
}
