import { createHash } from "crypto"

export const generateSha256Hash = async (data: string) => { 
    return createHash('sha256').update(data).digest('hex')
}