import { Request, Response } from 'express'
import { parseFilter } from '../lib/filterUtils'

export const chat = (req: Request, res: Response) => {
    const query = req.body.query
    const stream = req.body.stream || false
    const filters = req.body.filters || []

    if (!query) {
        return res.status(400).json({ error: 'Query is required' })
    }

    if (!Array.isArray(filters)) {
        return res.status(400).json({ error: 'Filters must be a list' })
    }

    const memoFilters = []
    for (const filter of filters) {
        const { filter: memoFilter, error } = parseFilter(filter)
        if (memoFilter && !error) {
            memoFilters.push(memoFilter)
        } else {
            return res.status(400).json({ error: `Invalid filter: ${error}` })
        }
    }

    console.log(req.context?.user, filters, query, stream)
    res.json({ message: 'Welcome to Skald Express Server' })
}
