import { Migration } from '@mikro-orm/migrations'

export class Migration20251208204038 extends Migration {
    override async up(): Promise<void> {
        this.addSql(`alter table "skald_project" add column "chat_ui_title" varchar(255) null;`)
    }

    override async down(): Promise<void> {
        this.addSql(`alter table "skald_project" drop column "chat_ui_title";`)
    }
}
