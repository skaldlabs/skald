import { Migration } from '@mikro-orm/migrations'

export class Migration20251203164108 extends Migration {
    override async up(): Promise<void> {
        this.addSql(`alter table "skald_user" add column "phone_number" varchar(255) null;`)
    }

    override async down(): Promise<void> {
        this.addSql(`alter table "skald_user" drop column "phone_number";`)
    }
}
