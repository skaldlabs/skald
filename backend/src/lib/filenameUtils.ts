/**
 * Sanitizes a filename for use in titles and display purposes.
 * Keeps only ASCII alphanumeric characters, underscores, hyphens, and parentheses.
 *
 * @param filename - The original filename
 * @param maxLength - Maximum length for the sanitized filename (default: 255)
 * @returns A sanitized filename safe for use in titles
 */
export function sanitizeFilenameForTitle(filename: string, maxLength: number = 255): string {
    if (!filename) {
        return 'Untitled Document'
    }

    const lastDotIndex = filename.lastIndexOf('.')
    const nameWithoutExt = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename
    const extension = lastDotIndex > 0 ? filename.substring(lastDotIndex) : ''

    let sanitized = nameWithoutExt
        .replace(/\s+/g, '_')
        // Keep only ASCII alphanumeric, underscores, hyphens, parentheses
        .replace(/[^a-zA-Z0-9_\-()]/g, '')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')

    if (!sanitized) {
        sanitized = 'document'
    }

    const maxNameLength = maxLength - extension.length
    if (sanitized.length > maxNameLength) {
        sanitized = sanitized.substring(0, maxNameLength)
    }

    return sanitized + extension
}

/**
 * Sanitizes a filename for use in S3 metadata.
 * Keeps only printable ASCII characters.
 *
 * @param filename - The original filename
 * @param maxLength - Maximum length (default: 1024, S3 metadata value limit)
 * @returns A sanitized filename safe for S3 metadata
 */
export function sanitizeFilenameForS3Metadata(filename: string, maxLength: number = 1024): string {
    if (!filename) {
        return ''
    }

    // Keep only printable ASCII (space through tilde)
    let sanitized = filename.replace(/[^\x20-\x7e]/g, '')

    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength)
    }

    return sanitized
}

/**
 * Safely truncates a filename while preserving the extension.
 *
 * @param filename - The original filename
 * @param maxLength - Maximum total length including extension
 * @returns A truncated filename with extension preserved
 */
export function truncateFilename(filename: string, maxLength: number): string {
    if (!filename || filename.length <= maxLength) {
        return filename
    }

    const lastDotIndex = filename.lastIndexOf('.')
    if (lastDotIndex <= 0) {
        // No extension, just truncate
        return filename.substring(0, maxLength)
    }

    const nameWithoutExt = filename.substring(0, lastDotIndex)
    const extension = filename.substring(lastDotIndex)

    // Ensure we have room for at least some characters before the extension
    const minNameLength = Math.max(1, maxLength - extension.length - 10)
    if (nameWithoutExt.length <= minNameLength) {
        return filename.substring(0, maxLength)
    }

    const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length)
    return truncatedName + extension
}
