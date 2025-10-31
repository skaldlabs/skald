import { DeferMode, Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core'
import { User } from './User'

@Entity({ tableName: 'skald_organization' })
export class Organization {
    @PrimaryKey({ type: 'uuid' })
    uuid!: string

    @Property()
    created_at!: Date

    @Property()
    updated_at!: Date

    @Property()
    name!: string

    @ManyToOne({
        entity: () => User,
        deferMode: DeferMode.INITIALLY_DEFERRED,
        index: 'skald_organization_owner_id_c9bf676b',
    })
    owner!: User
}
