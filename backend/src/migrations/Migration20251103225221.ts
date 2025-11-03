import { Migration } from '@mikro-orm/migrations'

export class Migration20251103225221 extends Migration {
    override async up(): Promise<void> {
        this.addSql(
            `alter table "skald_memo" add column "document_format" varchar(255) null, add column "object_storage_url" varchar(255) null;`
        )
        this.addSql(`alter table "skald_memo" alter column "content_length" type int using ("content_length"::int);`)
        this.addSql(`alter table "skald_memo" alter column "content_length" drop not null;`)
        this.addSql(
            `alter table "skald_memo" alter column "expiration_date" type varchar(255) using ("expiration_date"::varchar(255));`
        )
        this.addSql(
            `alter table "skald_memo" alter column "content_hash" type varchar(255) using ("content_hash"::varchar(255));`
        )
        this.addSql(`alter table "skald_memo" alter column "content_hash" drop not null;`)
    }

    override async down(): Promise<void> {
        this.addSql(`alter table "skald_memo" drop column "document_format", drop column "object_storage_url";`)

        this.addSql(`alter table "skald_memo" alter column "content_length" type int using ("content_length"::int);`)
        this.addSql(`alter table "skald_memo" alter column "content_length" set not null;`)
        this.addSql(
            `alter table "skald_memo" alter column "content_hash" type varchar(255) using ("content_hash"::varchar(255));`
        )
        this.addSql(`alter table "skald_memo" alter column "content_hash" set not null;`)
        this.addSql(
            `alter table "skald_memo" alter column "expiration_date" type timestamptz using ("expiration_date"::timestamptz);`
        )
    }
}
