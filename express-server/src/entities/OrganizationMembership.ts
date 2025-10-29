import { DeferMode, Entity, ManyToOne, type Opt, PrimaryKey, Property, Unique } from '@mikro-orm/core'
import { Organization } from './Organization'
import { User } from './User'

@Entity({ tableName: 'skald_organizationmembership' })
@Unique({
    name: 'skald_organizationmember_user_id_organization_id_539edeac_uniq',
    properties: ['user', 'organization'],
})
export class OrganizationMembership {
    @PrimaryKey({ type: 'bigint', autoincrement: true })
    id!: bigint & Opt

    @Property()
    accessLevel!: number

    @Property()
    joinedAt!: Date

    @ManyToOne({
        entity: () => Organization,
        fieldName: 'organization_id',
        deferMode: DeferMode.INITIALLY_DEFERRED,
        index: 'skald_organizationmembership_organization_id_21fd5aa7',
    })
    organization!: Organization

    @ManyToOne({
        entity: () => User,
        deferMode: DeferMode.INITIALLY_DEFERRED,
        index: 'skald_organizationmembership_user_id_938634a4',
    })
    user!: User
}
