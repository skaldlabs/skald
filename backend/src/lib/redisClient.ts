import { REDIS_HOST, REDIS_PORT } from '@/settings'
import { createClient } from 'redis'

let redisClient: ReturnType<typeof createClient> | null = null

const REDIS_DEFAULT_TTL = 60 * 60 * 24 // 24 hours

export const getRedisClient = async () => {
    if (redisClient) {
        return redisClient
    }

    redisClient = createClient({
        socket: {
            host: REDIS_HOST,
            port: REDIS_PORT,
        },
    })

    await redisClient.connect()
    return redisClient
}

export const redisGet = async (key: string): Promise<string | null> => {
    const redisClient = await getRedisClient()
    const value = await redisClient.get(key)
    return value
}

export const redisSet = async (key: string, value: string, ttl: number = REDIS_DEFAULT_TTL): Promise<void> => {
    const redisClient = await getRedisClient()
    await redisClient.set(key, value, { EX: ttl })
}

export const redisDel = async (key: string): Promise<void> => {
    const redisClient = await getRedisClient()
    await redisClient.del(key)
}

export const redisIncrBy = async (key: string, value: number): Promise<number> => {
    const redisClient = await getRedisClient()
    return await redisClient.incrBy(key, value)
}

export const closeRedisClient = async (): Promise<void> => {
    if (redisClient) {
        await redisClient.quit()
        redisClient = null
    }
}
