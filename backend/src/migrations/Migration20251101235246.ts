import { Migration } from '@mikro-orm/migrations'

export class Migration20251101235246 extends Migration {
    override async up(): Promise<void> {
        this.addSql(
            `create table "skald_chat" ("uuid" uuid not null, "project_id" uuid not null, "created_at" timestamptz not null, constraint "skald_chat_pkey" primary key ("uuid"));`
        )
        this.addSql(`create index "skald_chat_project_id_9243jsue" on "skald_chat" ("project_id");`)

        this.addSql(
            `create table "skald_chatmessage" ("uuid" uuid not null, "project_id" uuid not null, "chat_id" uuid not null, "content" text not null, "sent_by" varchar(255) not null, "sent_at" timestamptz not null, constraint "skald_chatmessage_pkey" primary key ("uuid"));`
        )
        this.addSql(`create index "skald_chat_project_id_92ds3jsue" on "skald_chatmessage" ("project_id");`)
        this.addSql(`create index "skald_chatmessage_chat_id_32455sja" on "skald_chatmessage" ("chat_id");`)

        this.addSql(
            `alter table "skald_chat" add constraint "skald_chat_project_id_foreign" foreign key ("project_id") references "skald_project" ("uuid") on update cascade deferrable initially deferred ;`
        )

        this.addSql(
            `alter table "skald_chatmessage" add constraint "skald_chatmessage_project_id_foreign" foreign key ("project_id") references "skald_project" ("uuid") on update cascade deferrable initially deferred ;`
        )
        this.addSql(
            `alter table "skald_chatmessage" add constraint "skald_chatmessage_chat_id_foreign" foreign key ("chat_id") references "skald_chat" ("uuid") on update cascade deferrable initially deferred ;`
        )
    }

    override async down(): Promise<void> {
        this.addSql(`alter table "skald_chatmessage" drop constraint "skald_chatmessage_chat_id_foreign";`)

        this.addSql(`drop table if exists "skald_chat" cascade;`)

        this.addSql(`drop table if exists "skald_chatmessage" cascade;`)
    }
}
