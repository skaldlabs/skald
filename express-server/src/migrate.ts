import fs from 'fs'
import path from 'path'
import { Client, ClientConfig } from 'pg'

const TEST = process.env.TEST === 'true'

const LOG_LEVEL = process.env.LOG_LEVEL || 'INFO'

const logger = {
    debug: (msg: string) => {
        if (LOG_LEVEL === 'DEBUG') console.log(`[DEBUG] ${msg}`)
    },
    info: (msg: string) => console.log(`[INFO] ${msg}`),
    error: (msg: string) => console.error(`[ERROR] ${msg}`),
}

const POSTGRES_CONNECTION_PARAMS: ClientConfig = {
    database: process.env.DB_NAME || (TEST ? 'foo' : 'foo'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || 'localhost',
}

if (process.env.DB_OPTIONS) {
    POSTGRES_CONNECTION_PARAMS.options = process.env.DB_OPTIONS.replace(/'/g, '')
}

if (process.env.DB_SSLMODE) {
    POSTGRES_CONNECTION_PARAMS.ssl = process.env.DB_SSLMODE !== 'disable'
}

const SCHEMA_DIR = 'schema'

function ensureSchemaDirectory(): void {
    if (!fs.existsSync(SCHEMA_DIR)) {
        fs.mkdirSync(SCHEMA_DIR, { recursive: true })
    }
}

async function getAllTables(client: Client): Promise<string[]> {
    const result = await client.query<{ tablename: string }>(
        `SELECT tablename
     FROM pg_tables
     WHERE schemaname = 'public'`
    )
    return result.rows.map((row) => row.tablename)
}

async function getTableSchema(client: Client, tableName: string): Promise<string> {
    const columnsResult = await client.query<{
        column_name: string
        data_type: string
        is_nullable: string
        column_default: string | null
        character_maximum_length: number | null
    }>(
        `SELECT
      column_name,
      data_type,
      is_nullable,
      column_default,
      character_maximum_length
    FROM information_schema.columns
    WHERE table_name = $1
    ORDER BY ordinal_position`,
        [tableName]
    )

    const columns: string[] = []
    for (const col of columnsResult.rows) {
        let colDef = `${col.column_name} ${col.data_type}`
        if (col.character_maximum_length) {
            colDef += `(${col.character_maximum_length})`
        }
        if (col.column_default) {
            colDef += ` DEFAULT ${col.column_default}`
        }
        if (col.is_nullable === 'NO') {
            colDef += ' NOT NULL'
        }
        columns.push(colDef)
    }

    const pkResult = await client.query<{ column_name: string }>(
        `SELECT c.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage AS ccu USING (constraint_schema, constraint_name)
    JOIN information_schema.columns AS c ON c.table_schema = tc.constraint_schema
      AND tc.table_name = c.table_name AND ccu.column_name = c.column_name
    WHERE constraint_type = 'PRIMARY KEY' AND tc.table_name = $1`,
        [tableName]
    )
    const pkColumns = pkResult.rows.map((row) => row.column_name)

    if (pkColumns.length > 0) {
        columns.push(`PRIMARY KEY (${pkColumns.join(', ')})`)
    }

    const columnDefinitions = columns.join(',\n    ')
    return `CREATE TABLE ${tableName} (\n    ${columnDefinitions}\n);`
}

async function exportSchema(client: Client): Promise<void> {
    ensureSchemaDirectory()

    const files = fs.readdirSync(SCHEMA_DIR)
    for (const file of files) {
        if (file.endsWith('.sql')) {
            fs.unlinkSync(path.join(SCHEMA_DIR, file))
            logger.debug(`Removed existing schema file: ${file}`)
        }
    }

    const tables = await getAllTables(client)

    for (const table of tables) {
        const schema = await getTableSchema(client, table)
        fs.writeFileSync(path.join(SCHEMA_DIR, `${table}.sql`), schema)
        logger.debug(`Exported schema for table: ${table}`)
    }
}

async function executeInTransaction(client: Client, sql: string, values?: any[]): Promise<void> {
    await client.query(sql, values)
}

function getSortedMigrationFiles(directory: string = path.join(__dirname, 'migrations')): string[] {
    if (!fs.existsSync(directory)) {
        return []
    }
    return fs
        .readdirSync(directory)
        .filter((f) => f.endsWith('.ts') && fs.statSync(path.join(directory, f)).isFile())
        .sort()
}

async function ensureMigrationsTableExists(client: Client): Promise<void> {
    await executeInTransaction(
        client,
        `CREATE TABLE IF NOT EXISTS migrations (
      name VARCHAR PRIMARY KEY,
      date_applied TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
    )
}

async function getAppliedMigrations(client: Client, reverse: boolean = false): Promise<string[]> {
    const result = await client.query<{ name: string }>('SELECT name FROM migrations ORDER BY name')
    const migrations = result.rows.map((row) => row.name)

    if (reverse) {
        migrations.reverse()
    }

    return migrations
}

interface MigrationOperation {
    SQL: string
    rollbackSQL?: string
}

interface MigrationModule {
    operations: MigrationOperation[]
}

async function applyMigration(client: Client, migrationName: string): Promise<boolean> {
    const migrationPath = path.join(__dirname, 'migrations', migrationName)
    const migrationModule: MigrationModule = await import(migrationPath)

    try {
        for (const [index, op] of migrationModule.operations.entries()) {
            logger.debug(`➡️  Executing operation: \n${op.SQL}`)
            await executeInTransaction(client, op.SQL)
            logger.debug(`🟢 Success applying operation #${index} of ${migrationName}\n\n`)
        }
        await client.query('COMMIT')
    } catch (e) {
        logger.error(`🔴 Error applying operations of ${migrationName} with error: ${e}`)
        await client.query('ROLLBACK')
        logger.info('↩️  Rolling back all operations of the migration')
        return false
    }
    return true
}

async function migrate(client: Client, targetMigration?: string): Promise<void> {
    await ensureMigrationsTableExists(client)

    const appliedMigrations = await getAppliedMigrations(client)
    const allMigrations = getSortedMigrationFiles()

    for (const migration of allMigrations) {
        const migrationName = migration.slice(0, -3) // Remove .ts extension
        const migrationApplied = appliedMigrations.includes(migrationName)
        const migrationOutOfRange = targetMigration && migrationName > targetMigration

        if (migrationApplied) {
            logger.info(`Skipping migration ${migrationName} as it is already applied`)
            continue
        }

        if (migrationOutOfRange) {
            logger.info(`Skipping migration ${migrationName} as it is out of range`)
            continue
        }

        await client.query('BEGIN')
        const migrationSuccessful = await applyMigration(client, migration)
        if (migrationSuccessful) {
            await executeInTransaction(client, 'INSERT INTO migrations (name) VALUES ($1)', [migrationName])
            await client.query('COMMIT')
            logger.info(`✅ Applied migration: ${migrationName}`)

            await exportSchema(client)
            logger.info('📝 Exported current schema to schema directory')

            fs.writeFileSync('latest_migration', migrationName)
        } else {
            return
        }

        if (migrationName === targetMigration) {
            break
        }
    }
}

async function applyRollback(client: Client, migrationName: string): Promise<boolean> {
    const migrationPath = path.join(__dirname, 'migrations', migrationName)
    const migrationModule: MigrationModule = await import(migrationPath)

    try {
        const operations = [...migrationModule.operations].reverse()
        for (const [index, op] of operations.entries()) {
            if (op.rollbackSQL) {
                logger.debug(`↩️  Rolling back operation #${index}: \n${op.rollbackSQL}`)
                await executeInTransaction(client, op.rollbackSQL)
                logger.debug(`🟢 Success rolling back operation #${index} of ${migrationName}\n\n`)
            }
        }
        await client.query('COMMIT')
    } catch (e) {
        logger.error(`🔴 Error rolling back operations of ${migrationName} with error: ${e}`)
        await client.query('ROLLBACK')
        logger.info(`↩️  Reverting all operations of the ${migrationName} rollback`)
        return false
    }
    return true
}

async function rollback(client: Client, targetMigration: string): Promise<void> {
    await ensureMigrationsTableExists(client)

    const appliedMigrations = await getAppliedMigrations(client, true)

    for (const migrationName of appliedMigrations) {
        if (migrationName <= targetMigration) {
            fs.writeFileSync('latest_migration', targetMigration)
            logger.info(`Reached target migration ${targetMigration}. Stopping rollback.`)
            break
        }

        const migrationSuccessful = await applyRollback(client, `${migrationName}.ts`)
        if (migrationSuccessful) {
            await executeInTransaction(client, 'DELETE FROM migrations WHERE name = $1', [migrationName])
            await client.query('COMMIT')
            logger.info(`Rolled back migration: ${migrationName}`)

            await exportSchema(client)
            logger.info('📝 Exported current schema to schema directory')
        } else {
            logger.error(`Failed to rollback migration ${migrationName}. Aborting further rollbacks.`)
            return
        }
    }
}

async function main(): Promise<void> {
    const args = process.argv.slice(2)
    const command = args[0]
    const targetIndex = args.indexOf('--target')
    const target = targetIndex !== -1 ? args[targetIndex + 1] : undefined

    const client = new Client(POSTGRES_CONNECTION_PARAMS)
    await client.connect()

    try {
        await ensureMigrationsTableExists(client)

        if (command === 'migrate') {
            logger.info(`Running migrations for database at host ${POSTGRES_CONNECTION_PARAMS.host}`)
            await migrate(client, target)
        } else if (command === 'rollback') {
            logger.info(`Rolling back migrations for database at host ${POSTGRES_CONNECTION_PARAMS.host}`)
            await rollback(client, target!)
        } else {
            console.log(`Unsupported command ${command}. Supported commands: migrate, rollback`)
        }
    } finally {
        await client.end()
    }
}

// Run main if this file is executed directly
// eslint-disable-next-line @typescript-eslint/no-require-imports
const isMainModule = require.main === module
if (isMainModule) {
    main().catch((err) => {
        console.error('Fatal error:', err)
        process.exit(1)
    })
}
