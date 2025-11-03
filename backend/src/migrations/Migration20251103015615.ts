import { Migration } from '@mikro-orm/migrations'

export class Migration20251103015615 extends Migration {
    override async up(): Promise<void> {
        this.addSql(
            `alter table "skald_chatmessage" add column "message_group_id" varchar(255) null, add column "skald_system_prompt" text null, add column "client_system_prompt" text null;`
        )
        this.addSql(
            `create index "skald_chatmessage_message_group_id_index" on "skald_chatmessage" ("message_group_id");`
        )
    }

    override async down(): Promise<void> {
        this.addSql(`drop index "skald_chatmessage_message_group_id_index";`)
        this.addSql(
            `alter table "skald_chatmessage" drop column "message_group_id", drop column "skald_system_prompt", drop column "client_system_prompt";`
        )
    }
}
