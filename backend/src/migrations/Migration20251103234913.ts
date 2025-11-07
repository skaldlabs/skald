import { Migration } from '@mikro-orm/migrations'

export class Migration20251103234913 extends Migration {
    override async up(): Promise<void> {
        this.addSql(
            `alter table "skald_memo" add column "processing_status" varchar(255) not null default 'received', add column "processing_error" varchar(255) null, add column "processing_started_at" timestamptz null, add column "processing_completed_at" timestamptz null;`
        )
        this.addSql(`create index "skald_memo_processing_status_idx" on "skald_memo" ("processing_status");`)
    }

    override async down(): Promise<void> {
        this.addSql(`drop index "skald_memo_processing_status_idx";`)
        this.addSql(
            `alter table "skald_memo" drop column "processing_status", drop column "processing_error", drop column "processing_started_at", drop column "processing_completed_at";`
        )
    }
}
