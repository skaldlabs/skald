import { createHash } from 'crypto'

export const sha3_256 = (data: string) => {
    return createHash('sha3-256').update(data).digest('hex')
}

export const sha256 = (data: string) => {
    return createHash('sha256').update(data).digest('hex')
}
