import { Pool } from 'pg'
import * as fs from 'fs'
import * as path from 'path'
import { DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT } from '../src/settings'

interface FixtureRecord {
    model: string
    pk: number
    fields: Record<string, any>
}

async function loadFixture(pool: Pool, fixturePath: string) {
    const fileName = path.basename(fixturePath, '.json')
    const tableName = fileName

    const fileContent = fs.readFileSync(fixturePath, 'utf-8')
    const records: FixtureRecord[] = JSON.parse(fileContent)

    console.log(`Loading fixture: ${fileName} (${records.length} records)`)

    for (const record of records) {
        const fields = record.fields
        const columns = Object.keys(fields)
        const values = Object.values(fields)

        // Convert snake_case to camelCase for column names to match entity definitions
        const columnNames = columns.map((col) => {
            // Convert to snake_case (most MikroORM entities use this in DB)
            return col.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
        })

        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ')

        // Serialize JSON fields
        const processedValues = values.map((val) => {
            if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
                return JSON.stringify(val)
            }
            return val
        })

        const query = `
            INSERT INTO ${tableName} (id, ${columnNames.join(', ')})
            VALUES ($${values.length + 1}, ${placeholders})
            ON CONFLICT (id) DO UPDATE SET
                ${columnNames.map((col, i) => `${col} = $${i + 1}`).join(', ')}
        `

        try {
            await pool.query(query, [...processedValues, record.pk])
            console.log(`  ✓ Inserted/Updated record ${record.pk}`)
        } catch (error) {
            console.error(`  ✗ Error inserting record ${record.pk}:`, error)
            throw error
        }
    }

    console.log(`✓ Successfully loaded ${fileName}\n`)
}

async function main() {
    const pool = new Pool({
        host: DB_HOST,
        port: DB_PORT,
        database: DB_NAME,
        user: DB_USER,
        password: DB_PASSWORD,
    })

    try {
        const fixturesDir = __dirname
        const args = process.argv.slice(2)

        if (args.length === 0) {
            console.error('Usage: tsx load-fixtures.ts <fixture-file.json>')
            console.error('Example: tsx load-fixtures.ts skald_plan.json')
            process.exit(1)
        }

        const fixturePath = path.join(fixturesDir, args[0])

        if (!fs.existsSync(fixturePath)) {
            console.error(`Error: Fixture file not found: ${fixturePath}`)
            process.exit(1)
        }

        await loadFixture(pool, fixturePath)

        console.log('All fixtures loaded successfully!')
    } catch (error) {
        console.error('Error loading fixtures:', error)
        process.exit(1)
    } finally {
        await pool.end()
    }
}

main()
