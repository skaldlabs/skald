import { Pool } from 'pg'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
})

interface DBResult<T> {
    error: string | null
    rows: T[] | null
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