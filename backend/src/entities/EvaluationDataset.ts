import { DeferMode, Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core'
import { Project } from '@/entities/Project'

@Entity({ tableName: 'skald_evaluationdataset' })
export class EvaluationDataset {
    @PrimaryKey({ type: 'uuid' })
    uuid!: string

    @Property()
    name!: string

    @Property({ nullable: true })
    description?: string

    @ManyToOne({
        entity: () => Project,
        fieldName: 'project_id',
        deferMode: DeferMode.INITIALLY_DEFERRED,
        index: 'skald_evaluationdataset_project_id_idx',
    })
    project!: Project

    @Property()
    created_at!: Date
}
