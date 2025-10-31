import { DeferMode, Entity, Index, ManyToOne, OneToOne, type Opt, PrimaryKey, Property } from '@mikro-orm/core'
import { Organization } from '@/entities/Organization'
import { Plan } from '@/entities/Plan'

@Entity({ tableName: 'skald_organizationsubscription' })
@Index({
    expression:
        'CREATE INDEX skald_organizationsubscription_stripe_customer_id_aa0de48c_like ON public.skald_organizationsubscription USING btree (stripe_customer_id varchar_pattern_ops);',
    name: 'skald_organizationsubscription_stripe_customer_id_aa0de48c_like',
})
@Index({
    expression:
        'CREATE INDEX skald_organizationsubscr_stripe_subscription_id_e67d0e5c_like ON public.skald_organizationsubscription USING btree (stripe_subscription_id varchar_pattern_ops);',
    name: 'skald_organizationsubscr_stripe_subscription_id_e67d0e5c_like',
})
@Index({
    expression:
        'CREATE INDEX skald_organizationsubscription_stripe_schedule_id_3e51e1c3_like ON public.skald_organizationsubscription USING btree (stripe_schedule_id varchar_pattern_ops);',
    name: 'skald_organizationsubscription_stripe_schedule_id_3e51e1c3_like',
})
export class OrganizationSubscription {
    @PrimaryKey({ type: 'bigint', autoincrement: true })
    id!: bigint & Opt

    @Property({
        nullable: true,
        index: 'skald_organ_stripe__787c7f_idx',
        unique: 'skald_organizationsubscription_stripe_customer_id_key',
    })
    stripe_customer_id?: string

    @Property({
        nullable: true,
        index: 'skald_organ_stripe__4bbed4_idx',
        unique: 'skald_organizationsubscription_stripe_subscription_id_key',
    })
    stripe_subscription_id?: string

    @Property({ length: 50, index: 'skald_organ_status_b30bd1_idx' })
    status!: string

    @Property()
    current_period_start!: Date

    @Property()
    current_period_end!: Date

    @Property()
    cancel_at_period_end!: boolean

    @Property({ nullable: true })
    canceled_at?: Date

    @Property({ nullable: true })
    trial_start?: Date

    @Property({ nullable: true })
    trial_end?: Date

    @Property()
    created_at!: Date

    @Property()
    updated_at!: Date

    @OneToOne({
        entity: () => Organization,
        fieldName: 'organization_id',
        deferMode: DeferMode.INITIALLY_DEFERRED,
        unique: 'skald_organizationsubscription_organization_id_key',
    })
    organization!: Organization

    @ManyToOne({
        entity: () => Plan,
        deferMode: DeferMode.INITIALLY_DEFERRED,
        index: 'skald_organizationsubscription_plan_id_f66eaa4c',
    })
    plan!: Plan

    @Property({ nullable: true })
    scheduled_change_date?: Date

    @ManyToOne({
        entity: () => Plan,
        nullable: true,
        deferMode: DeferMode.INITIALLY_DEFERRED,
        index: 'skald_organizationsubscription_scheduled_plan_id_607e5f4d',
    })
    scheduled_plan?: Plan

    @Property({
        nullable: true,
        index: 'skald_organ_stripe__fb7b46_idx',
        unique: 'skald_organizationsubscription_stripe_schedule_id_key',
    })
    stripe_schedule_id?: string
}
