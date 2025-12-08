import { Migration } from '@mikro-orm/migrations'

export class Migration20251208194249 extends Migration {
    override async up(): Promise<void> {
        this.addSql(`create index "skald_project_chat_ui_slug_idx" on "skald_project" ("chat_ui_slug");`)
        this.addSql(
            `alter table "skald_project" add constraint "skald_project_chat_ui_slug_key" unique ("chat_ui_slug");`
        )
    }

    override async down(): Promise<void> {
        this.addSql(`drop index "skald_project_chat_ui_slug_idx";`)
        this.addSql(`alter table "skald_project" drop constraint "skald_project_chat_ui_slug_key";`)
    }
}
