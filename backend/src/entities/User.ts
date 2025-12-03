import { DeferMode, Entity, Index, ManyToOne, type Opt, PrimaryKey, Property } from '@mikro-orm/core'
import { Organization } from '@/entities/Organization'
import { Project } from '@/entities/Project'

@Entity({ tableName: 'skald_user' })
@Index({
    expression:
        'CREATE INDEX skald_user_email_16347cfd_like ON public.skald_user USING btree (email varchar_pattern_ops);',
    name: 'skald_user_email_16347cfd_like',
})
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

    @Property({ nullable: true })
    phone_number?: string | null

    @Property()
    is_staff!: boolean

    @Property()
    is_active!: boolean

    @Property()
    date_joined!: Date

    @Property({ length: 254, unique: 'skald_user_email_key' })
    email!: string

    @Property()
    emailVerified!: boolean

    @Property({ nullable: true })
    role?: string

    @Property({ nullable: true })
    referral_source?: string

    @Property({ nullable: true })
    referral_details?: string

    @Property({ nullable: true, unique: 'skald_user_google_id_key' })
    googleId?: string

    @Property({ nullable: true, length: 500 })
    profilePicture?: string

    @Property({ nullable: true, length: 20 })
    authProvider?: string

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

    @Property({ default: false })
    onboarding_completed!: boolean & Opt
}
