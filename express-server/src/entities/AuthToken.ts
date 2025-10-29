import { DeferMode, Entity, Index, OneToOne, PrimaryKey, PrimaryKeyProp, Property } from '@mikro-orm/core'
import { User } from './User'

@Entity({ tableName: 'authtoken_token' })
@Index({
    expression:
        'CREATE INDEX authtoken_token_key_10f0b77e_like ON public.authtoken_token USING btree (key varchar_pattern_ops);',
    name: 'authtoken_token_key_10f0b77e_like',
})
export class AuthToken {
    [PrimaryKeyProp]?: 'key'

    @PrimaryKey({ length: 40 })
    key!: string

    @Property()
    created!: Date

    @OneToOne({ entity: () => User, deferMode: DeferMode.INITIALLY_DEFERRED, unique: 'authtoken_token_user_id_key' })
    user!: User
}
