import { DeferMode, Entity, Index, ManyToOne, type Opt, PrimaryKey, Property, Unique } from '@mikro-orm/core'
import { Organization } from './Organization'

@Entity({ tableName: 'skald_usagerecord' })
@Index({ name: 'skald_usage_organiz_41ff84_idx', properties: ['organization', 'billing_period_start'] })
@Unique({
    name: 'skald_usagerecord_organization_id_billing__7c9da398_uniq',
    properties: ['organization', 'billing_period_start'],
})
export class UsageRecord {
    @PrimaryKey({ type: 'bigint', autoincrement: true })
    id!: bigint & Opt

    @Property({ type: 'date', index: 'skald_usage_billing_07f781_idx' })
    billing_period_start!: string

    @Property({ type: 'date' })
    billing_period_end!: string

    @Property()
    memo_operations_count!: number

    @Property()
    chat_queries_count!: number

    @Property()
    created_at!: Date

    @Property()
    updated_at!: Date

    @ManyToOne({
        entity: () => Organization,
        fieldName: 'organization_id',
        deferMode: DeferMode.INITIALLY_DEFERRED,
        index: 'skald_usagerecord_organization_id_b31763fe',
    })
    organization!: Organization

    @Property({ type: 'json' })
    alerts_sent!: any
}
