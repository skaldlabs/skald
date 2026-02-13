import { Migration } from '@mikro-orm/migrations'

export class Migration20260213120000 extends Migration {
    override async up(): Promise<void> {
        // Add overage pricing columns to plan
        this.addSql(`alter table "skald_plan" add column "memo_operation_overage_price" numeric(10, 4) null;`)
        this.addSql(`alter table "skald_plan" add column "chat_query_overage_price" numeric(10, 4) null;`)

        // Add billing limit column to organization subscription
        this.addSql(`alter table "skald_organizationsubscription" add column "billing_limit" numeric(10, 2) null;`)

        // Seed existing paid plans with current hardcoded prices
        this.addSql(
            `update "skald_plan" set "memo_operation_overage_price" = 0.0020, "chat_query_overage_price" = 0.0300 where "slug" != 'free';`
        )
    }

    override async down(): Promise<void> {
        this.addSql(`alter table "skald_plan" drop column "memo_operation_overage_price";`)
        this.addSql(`alter table "skald_plan" drop column "chat_query_overage_price";`)
        this.addSql(`alter table "skald_organizationsubscription" drop column "billing_limit";`)
    }
}
