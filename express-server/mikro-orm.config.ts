import { defineConfig } from '@mikro-orm/postgresql'
import { Migrator } from '@mikro-orm/migrations'

export default defineConfig({
    entities: ['./dist/entities'], // compiled entities
    entitiesTs: ['./src/entities'], // source entity location
    dbName: 'foobar',
    user: 'postgres',
    password: '12345678',
    host: 'localhost',
    port: 5432,
    extensions: [Migrator],
    migrations: {
        path: './src/migrations-mikro', // path to migration folder
        pathTs: './src/migrations-mikro', // path to TS migration files
        glob: '!(*.d).{js,ts}', // how to match migration files
        transactional: true, // wrap each migration in a transaction
        disableForeignKeys: false, // disable foreign key checks during migrations
        allOrNothing: true, // wrap all migrations in master transaction
        emit: 'ts', // migration generation mode
    },
})
