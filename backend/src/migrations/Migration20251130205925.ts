import { Migration } from '@mikro-orm/migrations'

export class Migration20251130205925 extends Migration {
    override async up(): Promise<void> {
        this.addSql(
            `alter table "skald_user" add column "google_id" varchar(255) null, add column "profile_picture" varchar(500) null, add column "auth_provider" varchar(20) null;`
        )
        this.addSql(`alter table "skald_user" add constraint "skald_user_google_id_key" unique ("google_id");`)
    }

    override async down(): Promise<void> {
        this.addSql(`alter table "skald_user" drop constraint "skald_user_google_id_key";`)
        this.addSql(
            `alter table "skald_user" drop column "google_id", drop column "profile_picture", drop column "auth_provider";`
        )
    }
}
