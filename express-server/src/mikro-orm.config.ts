import { defineConfig } from '@mikro-orm/postgresql'
import { Migrator } from '@mikro-orm/migrations'

export default defineConfig({
    entities: ['./dist/entities'], // compiled entities
    entitiesTs: ['./src/entities'], // source entity location
    // SECURITY: Use DATABASE_URL environment variable instead of hardcoded credentials
    // These defaults are only for local development
    dbName: process.env.DB_NAME || 'foobar',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '12345678',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    extensions: [Migrator],
    // debug: ['query', 'query-params'],
    migrations: {
        path: './src/migrations', // path to migration folder
        pathTs: './src/migrations', // path to TS migration files
        glob: '!(*.d).{js,ts}', // how to match migration files
        transactional: true, // wrap each migration in a transaction
        disableForeignKeys: false, // disable foreign key checks during migrations
        allOrNothing: true, // wrap all migrations in master transaction
        emit: 'ts', // migration generation mode
    },
})
