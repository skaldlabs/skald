import { Migration } from '@mikro-orm/migrations'

export class Migration20251208191548 extends Migration {
    override async up(): Promise<void> {
        this.addSql(`alter table "skald_project" drop column "query_rewrite_enabled";`)
    }

    override async down(): Promise<void> {
        this.addSql(`alter table "skald_project" add column "query_rewrite_enabled" bool not null default false;`)
    }
}
