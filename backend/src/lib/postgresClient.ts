import { DB_HOST, DB_NAME, DB_PORT, DB_USER, DB_PASSWORD } from '@/settings'
import { logger } from '@/lib/logger'
import { Client } from 'pg'

export async function canConnectToPostgres(): Promise<void> {
    const client = new Client({
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
    })

    try {
        await client.connect()
        await client.end()
    } catch {
        logger.fatal('Failed to connect to Postgres')
        process.exit(1)
    }
}
