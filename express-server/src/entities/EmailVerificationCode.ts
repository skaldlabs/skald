import { DeferMode, Entity, OneToOne, type Opt, PrimaryKey, Property } from '@mikro-orm/core'
import { User } from './User'

@Entity({ tableName: 'skald_emailverificationcode' })
export class EmailVerificationCode {
    @PrimaryKey({ type: 'bigint', autoincrement: true })
    id!: bigint & Opt

    @Property({ length: 6, index: 'skald_email_code_27ca5e_idx' })
    code!: string

    @Property()
    created_at!: Date

    @Property()
    expires_at!: Date

    @Property()
    attempts!: number

    @OneToOne({
        entity: () => User,
        deferMode: DeferMode.INITIALLY_DEFERRED,
        unique: 'skald_emailverificationcode_user_id_key',
    })
    user!: User
}
