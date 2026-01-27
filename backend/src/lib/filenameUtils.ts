/**
 * Sanitizes a filename for use in titles and display purposes.
 * Removes or replaces special characters, handles accents, and limits length.
 *
 * @param filename - The original filename
 * @param maxLength - Maximum length for the sanitized filename (default: 255)
 * @returns A sanitized filename safe for use in titles
 */
export function sanitizeFilenameForTitle(filename: string, maxLength: number = 255): string {
    if (!filename) {
        return 'Untitled Document'
    }

    // Extract file extension before sanitization
    const lastDotIndex = filename.lastIndexOf('.')
    const nameWithoutExt = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename
    const extension = lastDotIndex > 0 ? filename.substring(lastDotIndex) : ''

    // Normalize unicode characters (handles accents and special characters)
    // NFD normalization decomposes characters (e.g., é -> e + ́)
    let sanitized = nameWithoutExt
        .normalize('NFD')
        // Remove diacritical marks (accents)
        .replace(/[\u0300-\u036f]/g, '')
        // Replace spaces with underscores
        .replace(/\s+/g, '_')
        // Remove or replace problematic characters (including control characters)
        // eslint-disable-next-line no-control-regex
        .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
        // Remove multiple consecutive underscores
        .replace(/_+/g, '_')
        // Remove leading/trailing underscores
        .replace(/^_+|_+$/g, '')

    // If after sanitization we have nothing, use a default name
    if (!sanitized) {
        sanitized = 'document'
    }

    // Limit length (accounting for extension)
    const maxNameLength = maxLength - extension.length
    if (sanitized.length > maxNameLength) {
        sanitized = sanitized.substring(0, maxNameLength)
    }

    return sanitized + extension
}

/**
 * Sanitizes a filename for use in S3 metadata.
 * S3 metadata values must be valid HTTP header values (no newlines, limited special chars).
 *
 * @param filename - The original filename
 * @param maxLength - Maximum length (default: 1024, S3 metadata value limit)
 * @returns A sanitized filename safe for S3 metadata
 */
export function sanitizeFilenameForS3Metadata(filename: string, maxLength: number = 1024): string {
    if (!filename) {
        return ''
    }

    // Remove newlines and carriage returns (not allowed in HTTP headers)
    let sanitized = filename
        .replace(/[\r\n]/g, '')
        // Replace other problematic characters for HTTP headers
        .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '')

    // Limit length
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
