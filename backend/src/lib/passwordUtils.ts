import crypto from 'crypto'

/**
 * Verify a password hash against a plaintext password. This follows the same algorithm as Django.
 * @param {string} password - Plaintext password to check
 * @param {string} djangoHash - e.g. "pbkdf2_sha256$260000$salt$hash"
 * @returns {boolean}
 */
export function checkPassword(password: string, hash: string): boolean {
    // Handle empty hash (OAuth users without password)
    if (!hash || hash === '') {
        return false
    }

    const [algorithm, iterationsStr, salt, expectedHash] = hash.split('$')
    if (algorithm !== 'pbkdf2_sha256') {
        throw new Error(`Unsupported algorithm: ${algorithm}`)
    }

    const iterations = parseInt(iterationsStr, 10)
    const derived = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256')
    const expected = Buffer.from(expectedHash, 'base64')

    // Constant-time comparison to avoid timing attacks
    return crypto.timingSafeEqual(derived, expected)
}

export function makePassword(password: string): string {
    const algorithm = 'pbkdf2_sha256'
    const iterations = 260000
    const salt = crypto.randomBytes(12).toString('base64')
    const derived = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256')
    const hash = derived.toString('base64')
    return `${algorithm}$${iterations}$${salt}$${hash}`
}
