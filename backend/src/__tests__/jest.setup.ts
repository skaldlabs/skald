// Mock Redis client to prevent hanging connections in tests
jest.mock('@/lib/redisClient', () => {
    const cache = new Map<string, string>()

    return {
        getRedisClient: jest.fn().mockResolvedValue({
            get: jest.fn((key: string) => Promise.resolve(cache.get(key) || null)),
            set: jest.fn((key: string, value: string) => {
                cache.set(key, value)
                return Promise.resolve('OK')
            }),
            del: jest.fn((key: string) => {
                cache.delete(key)
                return Promise.resolve(1)
            }),
            incrBy: jest.fn((key: string, value: number) => {
                const current = parseInt(cache.get(key) || '0')
                const newValue = current + value
                cache.set(key, newValue.toString())
                return Promise.resolve(newValue)
            }),
            quit: jest.fn().mockResolvedValue('OK'),
            connect: jest.fn().mockResolvedValue(undefined),
        }),
        redisGet: jest.fn((key: string) => Promise.resolve(cache.get(key) || null)),
        redisSet: jest.fn((key: string, value: string) => {
            cache.set(key, value)
            return Promise.resolve()
        }),
        redisDel: jest.fn((key: string) => {
            cache.delete(key)
            return Promise.resolve()
        }),
        redisIncrBy: jest.fn((key: string, value: number) => {
            const current = parseInt(cache.get(key) || '0')
            const newValue = current + value
            cache.set(key, newValue.toString())
            return Promise.resolve(newValue)
        }),
        redisSetAndIncrement: jest.fn((key: string, value: number) => {
            const current = parseInt(cache.get(key) || '0')
            const newValue = current + value
            cache.set(key, newValue.toString())
            return Promise.resolve(newValue)
        }),
        closeRedisClient: jest.fn().mockResolvedValue(undefined),
    }
})
