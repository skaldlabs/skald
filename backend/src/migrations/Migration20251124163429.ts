import { Migration } from '@mikro-orm/migrations'

export class Migration20251124163429 extends Migration {
    override async up(): Promise<void> {
        this.addSql(
            `alter table "skald_memo" alter column "processing_error" type text using ("processing_error"::text);`
        )
    }

    override async down(): Promise<void> {
        this.addSql(
            `alter table "skald_memo" alter column "processing_error" type varchar(255) using ("processing_error"::varchar(255));`
        )
    }
}
