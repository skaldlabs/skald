import { Migration } from '@mikro-orm/migrations'

export class Migration20251110090800 extends Migration {
    override async up(): Promise<void> {
        this.addSql(`alter table "skald_memo" drop column if exists "pending";`)
    }

    override async down(): Promise<void> {
        this.addSql(`alter table "skald_memo" add column "pending" boolean not null default false;`)
    }
}
