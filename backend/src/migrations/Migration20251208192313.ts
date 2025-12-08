import { Migration } from '@mikro-orm/migrations'

export class Migration20251208192313 extends Migration {
    override async up(): Promise<void> {
        this.addSql(
            `alter table "skald_project" add column "chat_ui_enabled" boolean not null default false, add column "chat_ui_rag_config" jsonb null, add column "chat_ui_slug" varchar(255) null;`
        )
    }

    override async down(): Promise<void> {
        this.addSql(
            `alter table "skald_project" drop column "chat_ui_enabled", drop column "chat_ui_rag_config", drop column "chat_ui_slug";`
        )
    }
}
