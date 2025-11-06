import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { logger } from './logger'

// Initialize S3 client with region-aware configuration
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials:
        process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
            ? {
                  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
              }
            : undefined, // Will use IAM role if credentials not provided
    // Follow region redirects automatically
    followRegionRedirects: true,
})

const BUCKET_NAME = process.env.S3_BUCKET_NAME

if (!BUCKET_NAME) {
    logger.warn('S3_BUCKET_NAME environment variable not set. S3 operations will fail.')
}

/**
 * Uploads a file to S3
 * @param fileBuffer - The file buffer to upload
 * @param key - The S3 key (file path) where the file will be stored
 * @param contentType - The MIME type of the file
 * @param metadata - Optional metadata to attach to the S3 object
 * @returns The S3 key of the uploaded file
 */
export async function uploadFileToS3(
    fileBuffer: Buffer,
    key: string,
    contentType: string,
    metadata?: Record<string, string>
): Promise<string> {
    if (!BUCKET_NAME) {
        throw new Error('S3_BUCKET_NAME environment variable not set')
    }

    try {
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: fileBuffer,
            ContentType: contentType,
            Metadata: metadata,
        })

        await s3Client.send(command)
        logger.info({ key, bucket: BUCKET_NAME }, 'File uploaded to S3')

        return key
    } catch (error) {
        logger.error({ err: error, key, bucket: BUCKET_NAME }, 'Failed to upload file to S3')
        throw new Error('Failed to upload file to S3')
    }
}

/**
 * Retrieves a file from S3
 * @param key - The S3 key (file path) of the file to retrieve
 * @returns The file buffer and metadata
 */
export async function getFileFromS3(key: string): Promise<{
    buffer: Buffer
    contentType?: string
    metadata?: Record<string, string>
}> {
    if (!BUCKET_NAME) {
        throw new Error('S3_BUCKET_NAME environment variable not set')
    }

    try {
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        })

        const response = await s3Client.send(command)

        if (!response.Body) {
            throw new Error('No file content returned from S3')
        }

        // Convert stream to buffer
        const buffer = await streamToBuffer(response.Body)

        return {
            buffer,
            contentType: response.ContentType,
            metadata: response.Metadata,
        }
    } catch (error) {
        logger.error({ err: error, key, bucket: BUCKET_NAME }, 'Failed to retrieve file from S3')
        throw new Error('Failed to retrieve file from S3')
    }
}

/**
 * Deletes a file from S3
 * @param key - The S3 key (file path) of the file to delete
 */
export async function deleteFileFromS3(key: string): Promise<void> {
    if (!BUCKET_NAME) {
        throw new Error('S3_BUCKET_NAME environment variable not set')
    }

    try {
        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        })

        await s3Client.send(command)
        logger.info({ key, bucket: BUCKET_NAME }, 'File deleted from S3')
    } catch (error) {
        logger.error({ err: error, key, bucket: BUCKET_NAME }, 'Failed to delete file from S3')
        throw new Error('Failed to delete file from S3')
    }
}

/**
 * Generates an S3 key for a memo file
 * @param projectId - The project ID
 * @param memoUuid - The memo UUID
 * @returns A unique S3 key
 */
export function generateS3Key(projectId: string, memoUuid: string): string {
    return `memos/${projectId}/${memoUuid}`
}

/**
 * Generates a pre-signed URL for accessing an S3 object
 * @param key - The S3 key (file path) of the file
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 * @returns A pre-signed URL that allows temporary access to the file
 */
export async function generatePresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!BUCKET_NAME) {
        throw new Error('S3_BUCKET_NAME environment variable not set')
    }

    try {
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        })

        const url = await getSignedUrl(s3Client, command, { expiresIn })
        logger.info({ key, bucket: BUCKET_NAME, expiresIn }, 'Generated pre-signed URL')

        return url
    } catch (error) {
        logger.error({ err: error, key, bucket: BUCKET_NAME }, 'Failed to generate pre-signed URL')
        throw new Error('Failed to generate pre-signed URL')
    }
}

/**
 * Converts a readable stream to a buffer
 */
async function streamToBuffer(stream: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Uint8Array[] = []
        stream.on('data', (chunk: Uint8Array) => chunks.push(chunk))
        stream.on('error', reject)
        stream.on('end', () => resolve(Buffer.concat(chunks)))
    })
}
