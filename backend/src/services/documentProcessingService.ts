import { generateS3Key, generatePresignedUrl } from '@/lib/s3Utils'
import { DATALAB_API_KEY, DOCUMENT_EXTRACTION_PROVIDER } from '@/settings'
import { DoclingService } from './doclingService'

interface MarkerJobResponse {
    success: boolean
    error: string | null
    request_id: string
    request_check_url: string
}

interface MarkerResultResponse {
    success: boolean
    request_id: string
    status: 'pending' | 'processing' | 'complete' | 'error'
    markdown?: string
    images?: Record<string, string>
    metadata?: any
    page_count?: number
    error?: string
}

export class DocumentProcessingService {
    private static readonly MARKER_API_URL = 'https://www.datalab.to/api/v1/marker'
    private static readonly MAX_POLL_ATTEMPTS = 60 // 5 minutes with 5 second intervals
    private static readonly POLL_INTERVAL_MS = 5000 // 5 seconds
    private static readonly PRESIGNED_URL_EXPIRATION = 1200 // 20 minutes

    static async sendDocumentForProcessing(projectUuid: string, memoUuid: string): Promise<string> {
        // Delegate to the appropriate provider based on configuration
        if (DOCUMENT_EXTRACTION_PROVIDER === 'docling') {
            return DoclingService.sendDocumentForProcessing(projectUuid, memoUuid)
        } else if (DOCUMENT_EXTRACTION_PROVIDER === 'datalab') {
            return this.sendDocumentToDatalab(projectUuid, memoUuid)
        } else {
            throw new Error(`Unsupported document extraction provider: ${DOCUMENT_EXTRACTION_PROVIDER}`)
        }
    }

    private static async sendDocumentToDatalab(projectUuid: string, memoUuid: string): Promise<string> {
        // Step 1: Generate S3 key and pre-signed URL
        const s3Key = generateS3Key(projectUuid, memoUuid)
        const presignedUrl = await generatePresignedUrl(s3Key, this.PRESIGNED_URL_EXPIRATION)

        // Step 2: Submit the document URL for processing
        const formData = new FormData()
        formData.append('file_url', presignedUrl)
        formData.append('output_format', 'markdown')

        const submitResponse = await fetch(this.MARKER_API_URL, {
            method: 'POST',
            headers: {
                'X-API-Key': DATALAB_API_KEY,
            },
            body: formData,
        })

        if (!submitResponse.ok) {
            const errorText = await submitResponse.text()
            throw new Error(`Failed to submit document to Marker API: ${submitResponse.status} - ${errorText}`)
        }

        const jobData = (await submitResponse.json()) as MarkerJobResponse

        if (!jobData.success) {
            throw new Error(`Marker API returned error: ${jobData.error}`)
        }

        // Step 3: Poll for the result
        const markdown = await this.pollForResult(jobData.request_check_url)
        return markdown
    }

    private static async pollForResult(checkUrl: string): Promise<string> {
        for (let attempt = 0; attempt < this.MAX_POLL_ATTEMPTS; attempt++) {
            await this.sleep(this.POLL_INTERVAL_MS)

            const response = await fetch(checkUrl, {
                method: 'GET',
                headers: {
                    'X-API-Key': DATALAB_API_KEY,
                },
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`Failed to check job status: ${response.status} - ${errorText}`)
            }

            const result = (await response.json()) as MarkerResultResponse

            if (result.status === 'complete') {
                if (!result.markdown) {
                    throw new Error('Job completed but no markdown content returned')
                }
                return result.markdown
            } else if (result.status === 'error') {
                throw new Error(`Document processing failed: ${result.error || 'Unknown error'}`)
            }

            // Status is 'pending' or 'processing', continue polling
        }

        throw new Error('Document processing timed out after maximum polling attempts')
    }

    private static sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }
}
