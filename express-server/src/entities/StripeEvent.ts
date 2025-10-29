import { Entity, Index, type Opt, PrimaryKey, Property } from '@mikro-orm/core'

@Entity({ tableName: 'skald_stripeevent' })
@Index({ name: 'skald_strip_event_t_1ffd58_idx', properties: ['event_type', 'processed'] })
export class StripeEvent {
    @PrimaryKey({ type: 'bigint', autoincrement: true })
    id!: bigint & Opt

    @Index({ name: 'skald_stripeevent_stripe_event_id_5dfbba10_like' })
    @Property({ index: 'skald_strip_stripe__efbcc3_idx', unique: 'skald_stripeevent_stripe_event_id_key' })
    stripe_event_id!: string

    @Property({ length: 100 })
    event_type!: string

    @Property({ type: 'json' })
    payload!: any

    @Property()
    processed!: boolean

    @Property({ type: 'text', nullable: true })
    processing_error?: string

    @Property()
    created_at!: Date

    @Property({ nullable: true })
    processed_at?: Date
}
