import { REDIS_URL } from '@/settings'
import { createClient } from 'redis'
import { logger } from '@/lib/logger'
import * as Sentry from '@sentry/node'

let redisClient: ReturnType<typeof createClient> | null = null

const REDIS_DEFAULT_TTL = 60 * 60 * 24 // 24 hours

const getRedisClient = async () => {
    if (redisClient) {
        return redisClient
    }
    redisClient = createClient({ url: REDIS_URL })

    await redisClient.connect()
    return redisClient
}

const withRedisClient = async <T>(
    operation: (client: Awaited<ReturnType<typeof getRedisClient>>) => Promise<T>,
    operationName: string
): Promise<T | null> => {
    // redis is not required for skald to work
    if (!REDIS_URL) {
        return null
    }
    try {
        const redisClient = await getRedisClient()
        return await operation(redisClient)
    } catch (error) {
        logger.error(`Error running ${operationName} in Redis: ${error}`)
        Sentry.captureException(error)
        return null
    }
}

export const canConnectToRedis = async (): Promise<void> => {
    // not required for skald to work
    if (!REDIS_URL) return

    const client = createClient({ url: REDIS_URL })

    try {
        await client.connect()
        await client.ping()
        await client.quit()
    } catch {
        logger.fatal('Failed to connect to Redis despite REDIS_URL being set.')
        process.exit(1)
    }
}

export const redisGet = async (key: string): Promise<string | null> => {
    const result = await withRedisClient<string | null>((client) => client.get(key), 'GET')
    return result
}

export const redisSet = async (key: string, value: string | number, ttl: number = REDIS_DEFAULT_TTL): Promise<void> => {
    await withRedisClient((client) => client.set(key, value, { EX: ttl }), 'SET')
}

export const redisDel = async (key: string): Promise<void> => {
    await withRedisClient((client) => client.del(key), 'DEL')
}

export const redisIncrBy = async (key: string, value: number, setTTL: boolean = true): Promise<number | null> => {
    const result = await withRedisClient<number | null>(async (client) => {
        const result = await client.incrBy(key, value)
        if (setTTL && result === value) {
            logger.debug('Setting TTL for key:', key)
            // we do this in order to only set a ttl on the first increment of a key (equivalent to a SET)
            // this is important because if redis is inaccesssible and we don't run an increment we will have a stale
            // value when redis is accessible again and thus we want keys to regularly expire and be updated from the db.
            // if we call EXPIRE on every increment, the key may never expire as we keep resetting the TTL.
            await client.expire(key, REDIS_DEFAULT_TTL)
        }
        return result
    }, 'INCRBY')
    return result
}

export const closeRedisClient = async (): Promise<void> => {
    if (redisClient) {
        await redisClient.quit()
        redisClient = null
    }
}
