import { Migration } from '@mikro-orm/migrations'

export class Migration20251029221317 extends Migration {
    override async up(): Promise<void> {
        this.addSql(`drop table if exists "authtoken_token" cascade;`)
    }

    override async down(): Promise<void> {
        this.addSql(
            `create table "authtoken_token" ("key" varchar(40) not null, "created" timestamptz(6) not null, "user_id" int8 not null, constraint "authtoken_token_pkey" primary key ("key"));`
        )
        this.addSql(`create index "authtoken_token_key_10f0b77e_like" on "authtoken_token" ("key");`)
        this.addSql(
            `alter table "authtoken_token" add constraint "authtoken_token_user_id_key" unique ("user_id") deferrable initially deferred;`
        )

        this.addSql(
            `alter table "authtoken_token" add constraint "authtoken_token_user_id_foreign" foreign key ("user_id") references "skald_user" ("id") on update cascade on delete no action deferrable initially deferred ;`
        )
    }
}
