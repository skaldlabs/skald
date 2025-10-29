import 'dotenv/config'
import express, { Request, Response } from 'express'

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())

app.get('/', async (req: Request, res: Response) => {
    // promise.all on three timer promises, each returning a random number between 0 and 1000
    const [result1, result2, result3] = await Promise.all([
        new Promise((resolve) => setTimeout(() => resolve(Math.random() * 1000), Math.random() * 1000)),
        new Promise((resolve) => setTimeout(() => resolve(Math.random() * 1000), Math.random() * 2000)),
        new Promise((resolve) => setTimeout(() => resolve(Math.random() * 1000), Math.random() * 3000)),
    ])
    res.json({ message: 'Hello from Express + TypeScript!', result1, result2, result3 })
})

// app.post('/api/v1/chat', async (req: Request, res: Response) => {
//   console.log('hello')
// })

app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok' })
})

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})
