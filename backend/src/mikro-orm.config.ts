import { defineConfig } from '@mikro-orm/postgresql'
import { Migrator } from '@mikro-orm/migrations'
import { DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT } from './settings'

export default defineConfig({
    entities: ['./dist/entities'], // compiled entities
    entitiesTs: ['./src/entities'], // source entity location
    dbName: DB_NAME,
    user: DB_USER,
    password: DB_PASSWORD,
    host: DB_HOST,
    port: DB_PORT,
    extensions: [Migrator],
    // debug: ['query', 'query-params'],
    migrations: {
        path: './dist/migrations', // path to migration folder (compiled)
        pathTs: './src/migrations', // path to TS migration files (for development)
        glob: '!(*.d).{js,ts}', // how to match migration files
        transactional: true, // wrap each migration in a transaction
        disableForeignKeys: false, // disable foreign key checks during migrations
        allOrNothing: true, // wrap all migrations in master transaction
        emit: 'ts', // migration generation mode
    },
})
