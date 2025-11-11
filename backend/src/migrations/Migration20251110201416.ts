import { Migration } from '@mikro-orm/migrations'

export class Migration20251110201416 extends Migration {
    override async up(): Promise<void> {
        this.addSql(
            `alter table "skald_user" add column "role" varchar(255) null, add column "referral_source" varchar(255) null, add column "referral_details" varchar(255) null, drop column "name";`
        )
    }

    override async down(): Promise<void> {
        this.addSql(
            `alter table "skald_user" drop column "role", drop column "referral_source", drop column "referral_details";`
        )
    }
}
