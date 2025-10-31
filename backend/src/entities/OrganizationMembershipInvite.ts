import { DeferMode, Entity, ManyToOne, PrimaryKey, Property, Unique } from '@mikro-orm/core'
import { Organization } from '@/entities/Organization'
import { User } from '@/entities/User'

@Entity({ tableName: 'skald_organizationmembershipinvite' })
@Unique({ name: 'skald_organizationmember_organization_id_email_a6273e0c_uniq', properties: ['organization', 'email'] })
export class OrganizationMembershipInvite {
    @PrimaryKey({ type: 'uuid' })
    id!: string

    @Property({ length: 254 })
    email!: string

    @Property()
    createdAt!: Date

    @Property({ nullable: true })
    acceptedAt?: Date

    @ManyToOne({
        entity: () => User,
        deferMode: DeferMode.INITIALLY_DEFERRED,
        index: 'skald_organizationmembershipinvite_invited_by_id_bb70bb84',
    })
    invitedBy!: User

    @ManyToOne({
        entity: () => Organization,
        fieldName: 'organization_id',
        deferMode: DeferMode.INITIALLY_DEFERRED,
        index: 'skald_organizationmembershipinvite_organization_id_f922971e',
    })
    organization!: Organization
}
