import { DeferMode, Entity, OneToOne, PrimaryKey, PrimaryKeyProp, Property } from '@mikro-orm/core'
import { User } from './User'

@Entity({ tableName: 'authtoken_token' })
export class AuthToken {
    [PrimaryKeyProp]?: 'key'

    @PrimaryKey({ length: 40, index: 'authtoken_token_key_10f0b77e_like' })
    key!: string

    @Property()
    created!: Date

    @OneToOne({ entity: () => User, deferMode: DeferMode.INITIALLY_DEFERRED, unique: 'authtoken_token_user_id_key' })
    user!: User
}
