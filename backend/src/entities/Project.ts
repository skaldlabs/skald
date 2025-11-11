import { DeferMode, Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core'
import { Organization } from '@/entities/Organization'
import { User } from '@/entities/User'

@Entity({ tableName: 'skald_project' })
export class Project {
    @PrimaryKey({ type: 'uuid' })
    uuid!: string

    @Property()
    created_at!: Date

    @Property()
    updated_at!: Date

    @Property()
    name!: string

    @ManyToOne({
        entity: () => Organization,
        fieldName: 'organization_id',
        deferMode: DeferMode.INITIALLY_DEFERRED,
        index: 'skald_project_organization_id_826910ec',
    })
    organization!: Organization

    @ManyToOne({
        entity: () => User,
        deferMode: DeferMode.INITIALLY_DEFERRED,
        index: 'skald_project_owner_id_5fc4828a',
    })
    owner!: User

    @Property({ default: false })
    query_rewrite_enabled!: boolean
}
