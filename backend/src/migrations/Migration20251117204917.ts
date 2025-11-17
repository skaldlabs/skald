import { Migration } from '@mikro-orm/migrations'

export class Migration20251117204917 extends Migration {
    override async up(): Promise<void> {
        this.addSql(
            `create table "skald_passwordresettoken" ("id" bigserial primary key, "token" varchar(64) not null, "created_at" timestamptz not null, "expires_at" timestamptz not null, "attempts" int not null, "user_id" bigint not null);`
        )
        this.addSql(`create index "skald_password_token_idx" on "skald_passwordresettoken" ("token");`)
        this.addSql(
            `alter table "skald_passwordresettoken" add constraint "skald_passwordresettoken_user_id_key" unique ("user_id") deferrable initially deferred;`
        )
        this.addSql(
            `alter table "skald_passwordresettoken" add constraint "skald_passwordresettoken_user_id_foreign" foreign key ("user_id") references "skald_user" ("id") on update cascade deferrable initially deferred ;`
        )
    }

    override async down(): Promise<void> {
        this.addSql(`drop table if exists "skald_passwordresettoken" cascade;`)
    }
}
