import { Migration } from '@mikro-orm/migrations'

export class Migration20251110123617 extends Migration {
    override async up(): Promise<void> {
        // Enable pgmq extension if not already enabled
        this.addSql(`CREATE EXTENSION IF NOT EXISTS pgmq CASCADE;`)

        // Create the main queue for processing memos
        this.addSql(`SELECT pgmq.create('process_memo');`)

        // Create the dead letter queue for failed messages
        this.addSql(`SELECT pgmq.create('process_memo_dlq');`)
    }

    override async down(): Promise<void> {
        // Drop the queues
        this.addSql(`SELECT pgmq.drop_queue('process_memo_dlq');`)
        this.addSql(`SELECT pgmq.drop_queue('process_memo');`)

        // Note: We don't drop the pgmq extension as it might be used by other parts of the system
    }
}
