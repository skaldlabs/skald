import { Pool } from 'pg'


const DATABASE_URL = process.env.DATABASE_URL || "postgres://postgres:12345678@localhost/skald2"
const pool = new Pool({
    connectionString: DATABASE_URL,
})

interface DBResult<T> {
    error: string | null
    rows: T[] | null
}


interface BatchInsertResult<T> {
    error: string | null
    insertedCount: number
    rows: T[] | null
}

interface BatchInsertOptions {
    returnColumns?: string[]
}

export const runQuery = async <T> (query: string, params: any[]): Promise<DBResult<T>> => {
    try {
        const client = await pool.connect()
        const result = await client.query(query, params)
        client.release()
        return {
            error: null,
            rows: result.rows
        }
    } catch (error) {
        console.error(error)
        return {
            error: error instanceof Error ? error.message : 'Unknown error',
            rows: null
        }
    }
}


export const insertData = async <T>(
    tableName: string,
    records: Record<string, any>[],
    options?: BatchInsertOptions
): Promise<BatchInsertResult<T>> => {
    try {
        if (records.length === 0) {
            return { error: null, insertedCount: 0, rows: [] }
        }

        // Extract columns from the first record
        const columns = Object.keys(records[0])
        
        // Convert records to array of values
        const values = records.map(record => 
            columns.map(column => record[column])
        )

        const client = await pool.connect()
        
        // Build placeholders like ($1, $2, $3), ($4, $5, $6), etc.
        const placeholders = values.map((row, rowIndex) => {
            const rowPlaceholders = columns.map((_, colIndex) => {
                return `$${rowIndex * columns.length + colIndex + 1}`
            }).join(', ')
            return `(${rowPlaceholders})`
        }).join(', ')

        // Build RETURNING clause
        const returningClause = options?.returnColumns && options.returnColumns.length > 0
            ? `RETURNING ${options.returnColumns.join(', ')}`
            : 'RETURNING *'

        const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES ${placeholders} ${returningClause}`
        const flatParams = values.flat()

        const result = await client.query(query, flatParams)
        client.release()

        return {
            error: null,
            insertedCount: result.rowCount || 0,
            rows: result.rows as T[]
        }
    } catch (error) {
        console.error(error)
        return {
            error: error instanceof Error ? error.message : 'Unknown error',
            insertedCount: 0,
            rows: null
        }
    }
}