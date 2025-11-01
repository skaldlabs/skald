import { MikroORM } from '@mikro-orm/postgresql'
import config from '../mikro-orm.config'

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

    // Get all table names
    const tables = await connection.execute(`
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
    `)

    // Truncate all tables
    for (const { tablename } of tables) {
        await connection.execute(`TRUNCATE TABLE "${tablename}" CASCADE`)
    }
}

export const closeDatabase = async (orm: MikroORM) => {
    await orm.close(true)
}
