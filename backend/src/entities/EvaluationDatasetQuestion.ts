import { DeferMode, Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core'
import { EvaluationDataset } from '@/entities/EvaluationDataset'

@Entity({ tableName: 'skald_evaluationdatasetquestion' })
export class EvaluationDatasetQuestion {
    @PrimaryKey({ type: 'uuid' })
    uuid!: string

    @Property()
    question!: string

    @Property()
    answer!: string

    @ManyToOne({
        entity: () => EvaluationDataset,
        fieldName: 'evaluation_dataset_id',
        deferMode: DeferMode.INITIALLY_DEFERRED,
        index: 'skald_evaluationdatasetquestion_evaluation_dataset_id_idx',
    })
    evaluationDataset!: EvaluationDataset

    @Property()
    created_at!: Date
}
