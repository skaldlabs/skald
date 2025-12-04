import { Migration } from '@mikro-orm/migrations'

export class Migration20251203200000 extends Migration {
    override async up(): Promise<void> {
        this.addSql(`alter table "skald_user" add column "onboarding_completed" boolean not null default false;`)
    }

    override async down(): Promise<void> {
        this.addSql(`alter table "skald_user" drop column "onboarding_completed";`)
    }
}
