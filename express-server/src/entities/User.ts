import { DeferMode, Entity, ManyToOne, type Opt, PrimaryKey, Property } from '@mikro-orm/core'
import { Organization } from './Organization'
import { Project } from './Project'

@Entity({ tableName: 'skald_user' })
export class User {
    @PrimaryKey({ type: 'bigint', autoincrement: true })
    id!: bigint & Opt

    @Property({ length: 128 })
    password!: string

    @Property({ nullable: true })
    last_login?: Date

    @Property()
    is_superuser!: boolean

    @Property({ length: 150 })
    first_name!: string

    @Property({ length: 150 })
    last_name!: string

    @Property()
    is_staff!: boolean

    @Property()
    is_active!: boolean

    @Property()
    date_joined!: Date

    @Property({ length: 254, index: 'skald_user_email_16347cfd_like', unique: 'skald_user_email_key' })
    email!: string

    @Property()
    emailVerified!: boolean

    @Property()
    name!: string

    @ManyToOne({
        entity: () => Organization,
        fieldName: 'default_organization_id',
        nullable: true,
        deferMode: DeferMode.INITIALLY_DEFERRED,
        index: 'skald_user_default_organization_id_0d57be46',
    })
    defaultOrganization?: Organization

    @ManyToOne({
        entity: () => Project,
        fieldName: 'current_project_id',
        nullable: true,
        deferMode: DeferMode.INITIALLY_DEFERRED,
        index: 'skald_user_current_project_id_ed8d14d2',
    })
    current_project?: Project
}
