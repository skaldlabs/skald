import { DeferMode, Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core'
import { Experiment } from './Experiment'
import { EvaluationDatasetQuestion } from './EvaluationDatasetQuestion'

@Entity({ tableName: 'skald_experimentresult' })
export class ExperimentResult {
    @PrimaryKey({ type: 'uuid' })
    uuid!: string

    @ManyToOne({
        entity: () => Experiment,
        fieldName: 'experiment_id',
        deferMode: DeferMode.INITIALLY_DEFERRED,
        index: 'skald_experimentresult_experiment_id_idx',
    })
    experiment!: Experiment

    @ManyToOne({
        entity: () => EvaluationDatasetQuestion,
        fieldName: 'evaluation_dataset_question_id',
        deferMode: DeferMode.INITIALLY_DEFERRED,
        index: 'skald_experimentresult_evaluation_dataset_question_id_idx',
    })
    evaluationDatasetQuestion!: EvaluationDatasetQuestion

    @Property({ nullable: true })
    total_answer_time_ms?: number

    @Property({ nullable: true })
    time_to_first_token_ms?: number

    @Property({ type: 'text' })
    answer!: string

    @Property({ nullable: true })
    llm_answer_rating?: number

    // later support handling what user rated the answer etc
    @Property({ nullable: true })
    human_answer_rating?: number

    @Property({ type: 'json', nullable: true })
    metadata?: Record<string, any>

    @Property()
    created_at!: Date
}
