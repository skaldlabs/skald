import { MikroORM } from '@mikro-orm/postgresql'
import config from '../mikro-orm.config'
import { closeRedisClient } from '@/lib/redisClient'

export const createTestDatabase = async () => {
    const testConfig = {
        ...config,
        dbName: 'skald2_test',
        user: String(config.user || 'postgres'),
        password: String(config.password || '12345678'),
        host: String(config.host || 'localhost'),
        port: Number(config.port || 5432),
    }

    const orm = await MikroORM.init(testConfig)

    const generator = orm.getSchemaGenerator()
    await generator.dropSchema()
    await generator.createSchema()

    return orm
}

export const clearDatabase = async (orm: MikroORM) => {
    const em = orm.em.fork()
    const connection = em.getConnection()

    // Get all table names excluding migrations and system tables
    const tables = await connection.execute(`
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename != 'mikro_orm_migrations'
    `)

    // Build a single TRUNCATE statement for all tables to avoid deadlocks
    const tableNames = tables.map((t: any) => `"${t.tablename}"`).join(', ')

    if (tableNames) {
        // Use a transaction with retry logic for deadlock scenarios
        const maxRetries = 3
        let lastError: Error | null = null

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                await connection.execute(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`)
                return // Success, exit early
            } catch (error: any) {
                lastError = error
                // Check if it's a deadlock error (code 40P01)
                if (error.code === '40P01' && attempt < maxRetries - 1) {
                    // Wait a bit before retrying (exponential backoff)
                    await new Promise((resolve) => setTimeout(resolve, 100 * Math.pow(2, attempt)))
                    continue
                }
                // If it's not a deadlock or we're out of retries, throw
                throw error
            }
        }

        if (lastError) {
            throw lastError
        }
    }
}

export const closeDatabase = async (orm: MikroORM) => {
    await orm.close(true)
    try {
        await closeRedisClient()
    } catch {
        // Ignore errors if Redis wasn't connected
    }
}
