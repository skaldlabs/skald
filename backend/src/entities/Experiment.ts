import { DeferMode, Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core'
import { Project } from '@/entities/Project'
import { EvaluationDataset } from '@/entities/EvaluationDataset'

@Entity({ tableName: 'skald_experiment' })
export class Experiment {
    @PrimaryKey({ type: 'uuid' })
    uuid!: string

    @Property()
    title!: string

    @Property({ nullable: true })
    description?: string

    @Property({ type: 'json', nullable: true })
    properties?: Record<string, any>

    @ManyToOne({
        entity: () => Project,
        fieldName: 'project_id',
        deferMode: DeferMode.INITIALLY_DEFERRED,
        index: 'skald_experiment_project_id_idx',
    })
    project!: Project

    @ManyToOne({
        entity: () => EvaluationDataset,
        fieldName: 'evaluation_dataset_id',
        deferMode: DeferMode.INITIALLY_DEFERRED,
        index: 'skald_experiment_evaluation_dataset_id_idx',
    })
    evaluationDataset!: EvaluationDataset

    @Property()
    created_at!: Date
}
