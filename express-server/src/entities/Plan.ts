import { Entity, type Opt, PrimaryKey, Property } from '@mikro-orm/core'

@Entity({ tableName: 'skald_plan' })
export class Plan {
    @PrimaryKey({ type: 'bigint', autoincrement: true })
    id!: bigint & Opt

    @Property({ length: 50, index: 'skald_plan_slug_0a0cac0f_like', unique: 'skald_plan_slug_key' })
    slug!: string

    @Property({ length: 100 })
    name!: string

    @Property({
        nullable: true,
        index: 'skald_plan_stripe_price_id_3080b1eb_like',
        unique: 'skald_plan_stripe_price_id_key',
    })
    stripe_price_id?: string

    @Property({ type: 'decimal', precision: 10, scale: 2 })
    monthly_price!: string

    @Property({ nullable: true })
    memo_operations_limit?: number

    @Property({ nullable: true })
    chat_queries_limit?: number

    @Property({ nullable: true })
    projects_limit?: number

    @Property({ type: 'json' })
    features!: any

    @Property()
    isActive!: boolean

    @Property()
    isDefault!: boolean

    @Property()
    createdAt!: Date

    @Property()
    updatedAt!: Date
}
