import { Migration } from '@mikro-orm/migrations'

export class Migration20251125132350 extends Migration {
    override async up(): Promise<void> {
        this.addSql(
            `create table "skald_searchrequest" ("uuid" uuid not null, "project_id" uuid not null, "query" varchar(255) not null, "filters" jsonb null, "results" jsonb null, "created_at" timestamptz not null, constraint "skald_searchrequest_pkey" primary key ("uuid"));`
        )
        this.addSql(`create index "skald_searchrequest_project_id_idx" on "skald_searchrequest" ("project_id");`)

        this.addSql(
            `alter table "skald_searchrequest" add constraint "skald_searchrequest_project_id_foreign" foreign key ("project_id") references "skald_project" ("uuid") on update cascade deferrable initially deferred ;`
        )
    }

    override async down(): Promise<void> {
        this.addSql(`drop table if exists "skald_searchrequest" cascade;`)
    }
}
