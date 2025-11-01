import { Migration } from '@mikro-orm/migrations'

export class Migration20251101234419 extends Migration {
    override async up(): Promise<void> {
        this.addSql(`alter table "skald_chatmessage" alter column "content" type text using ("content"::text);`)
    }

    override async down(): Promise<void> {
        this.addSql(
            `alter table "skald_chatmessage" alter column "content" type varchar(255) using ("content"::varchar(255));`
        )
    }
}
