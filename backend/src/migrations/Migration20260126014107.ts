import { Migration } from '@mikro-orm/migrations'

export class Migration20260126014107 extends Migration {
    override async up(): Promise<void> {
        this.addSql(`alter table "skald_memo" add column "scopes" jsonb null;`)
        this.addSql(`CREATE INDEX skald_memo_scopes_gin_idx ON public.skald_memo USING gin (scopes);;`)
    }

    override async down(): Promise<void> {
        this.addSql(`drop index "skald_memo_scopes_gin_idx";`)
        this.addSql(`alter table "skald_memo" drop column "scopes";`)
    }
}
