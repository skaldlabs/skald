import { DeferMode, Entity, OneToOne, type Opt, PrimaryKey, Property } from '@mikro-orm/core'
import { User } from '@/entities/User'

@Entity({ tableName: 'skald_passwordresettoken' })
export class PasswordResetToken {
    @PrimaryKey({ type: 'bigint', autoincrement: true })
    id!: bigint & Opt

    @Property({ length: 64, index: 'skald_password_token_idx' })
    token!: string

    @Property()
    created_at!: Date

    @Property()
    expires_at!: Date

    @Property()
    attempts!: number

    @OneToOne({
        entity: () => User,
        deferMode: DeferMode.INITIALLY_DEFERRED,
        unique: 'skald_passwordresettoken_user_id_key',
    })
    user!: User
}
