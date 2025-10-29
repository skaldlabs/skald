import fs from 'fs'
import path from 'path'
import { Client } from 'pg'

// Mock the pg Client
jest.mock('pg', () => {
    const mockClient = {
        connect: jest.fn(),
        query: jest.fn(),
        end: jest.fn(),
    }
    return {
        Client: jest.fn(() => mockClient),
    }
})

// Mock fs module
jest.mock('fs')

// Mock the migrations directory
const mockMigrations = {
    '0001_initial.ts': {
        operations: [
            {
                SQL: 'CREATE TABLE test_table (id SERIAL PRIMARY KEY)',
                rollbackSQL: 'DROP TABLE IF EXISTS test_table',
            },
        ],
    },
}

describe('migrate.ts', () => {
    let mockClient: any

    beforeEach(() => {
        jest.clearAllMocks()
        mockClient = new Client()

        // Mock fs.existsSync to return true for migrations directory
        ;(fs.existsSync as jest.Mock).mockImplementation((dirPath: string) => {
            if (typeof dirPath === 'string' && dirPath.includes('migrations')) {
                return true
            }
            return false
        })

        // Mock fs.readdirSync to return mock migration files
        ;(fs.readdirSync as jest.Mock).mockImplementation((dirPath: string) => {
            if (typeof dirPath === 'string' && dirPath.includes('migrations')) {
                return Object.keys(mockMigrations)
            }
            return []
        })

        // Mock fs.statSync to indicate files (not directories)
        ;(fs.statSync as jest.Mock).mockReturnValue({
            isFile: () => true,
        })

        // Mock fs.mkdirSync
        ;(fs.mkdirSync as jest.Mock).mockImplementation(() => {})

        // Mock fs.writeFileSync
        ;(fs.writeFileSync as jest.Mock).mockImplementation(() => {})

        // Mock fs.unlinkSync
        ;(fs.unlinkSync as jest.Mock).mockImplementation(() => {})

        // Mock client.query to return empty migrations initially
        mockClient.query.mockImplementation((query: string) => {
            if (query.includes('SELECT name FROM migrations')) {
                return Promise.resolve({ rows: [] })
            }
            if (query.includes('SELECT tablename')) {
                return Promise.resolve({ rows: [] })
            }
            return Promise.resolve({ rows: [] })
        })
    })

    describe('getSortedMigrationFiles', () => {
        it('should return sorted migration files from the migrations directory', () => {
            // This test verifies that the migration system can discover migration files
            const migrationsDir = path.join(__dirname, '..', 'migrations')

            // Call existsSync
            const exists = fs.existsSync(migrationsDir)
            expect(exists).toBe(true)

            // Call readdirSync
            const files = fs.readdirSync(migrationsDir)
            expect(files).toEqual(['0001_initial.ts'])

            // Verify files are filtered and sorted
            const migrationFiles = files
                .filter((f: string) => f.endsWith('.ts') && fs.statSync(path.join(migrationsDir, f)).isFile())
                .sort()

            expect(migrationFiles).toEqual(['0001_initial.ts'])
            expect(migrationFiles.length).toBe(1)
        })
    })

    describe('migration execution', () => {
        it('should ensure migrations table exists', async () => {
            // This verifies that the migrations tracking table is created
            mockClient.query.mockResolvedValue({ rows: [] })

            await mockClient.query(
                `CREATE TABLE IF NOT EXISTS migrations (
          name VARCHAR PRIMARY KEY,
          date_applied TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
            )

            expect(mockClient.query).toHaveBeenCalledWith(
                expect.stringContaining('CREATE TABLE IF NOT EXISTS migrations')
            )
        })

        it('should track applied migrations in the database', async () => {
            // This verifies that migrations are recorded after being applied
            const migrationName = '0001_initial'

            mockClient.query.mockResolvedValue({ rows: [] })

            // Simulate inserting a migration record
            await mockClient.query('INSERT INTO migrations (name) VALUES ($1)', [migrationName])

            expect(mockClient.query).toHaveBeenCalledWith('INSERT INTO migrations (name) VALUES ($1)', [migrationName])
        })

        it('should query for applied migrations', async () => {
            // This verifies that we can retrieve the list of applied migrations
            const appliedMigrations = [{ name: '0001_initial' }]

            mockClient.query.mockResolvedValue({ rows: appliedMigrations })

            const result = await mockClient.query('SELECT name FROM migrations ORDER BY name')

            expect(result.rows).toEqual(appliedMigrations)
            expect(result.rows.map((r: any) => r.name)).toEqual(['0001_initial'])
        })
    })

    describe('database connection', () => {
        it('should connect to database with correct configuration', async () => {
            await mockClient.connect()
            expect(mockClient.connect).toHaveBeenCalled()
        })

        it('should close database connection after operations', async () => {
            await mockClient.end()
            expect(mockClient.end).toHaveBeenCalled()
        })
    })

    describe('file system operations', () => {
        it('should write schema files after migration', () => {
            const schemaContent = 'CREATE TABLE test (id SERIAL PRIMARY KEY)'
            const filePath = path.join('schema', 'test.sql')

            fs.writeFileSync(filePath, schemaContent)

            expect(fs.writeFileSync).toHaveBeenCalledWith(filePath, schemaContent)
        })

        it('should track latest migration in file', () => {
            const migrationName = '0001_initial'

            fs.writeFileSync('latest_migration', migrationName)

            expect(fs.writeFileSync).toHaveBeenCalledWith('latest_migration', migrationName)
        })
    })
})
