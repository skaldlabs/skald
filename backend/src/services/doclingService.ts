import { generateS3Key, generatePresignedUrl } from '@/lib/s3Utils'
import { DOCLING_SERVICE_URL } from '@/settings'

interface DoclingConvertRequest {
    sources: Array<{
        kind: string
        url: string
    }>
    to_formats?: string[]
    image_export_mode?: 'placeholder' | 'embedded' | 'referenced'
}

interface DoclingConvertResponse {
    status: string
    output: {
        md_content?: string
    }[]
}

export class DoclingService {
    private static readonly PRESIGNED_URL_EXPIRATION = 1200 // 20 minutes

    static async sendDocumentForProcessing(projectUuid: string, memoUuid: string): Promise<string> {
        // Step 1: Generate S3 key and pre-signed URL
        const s3Key = generateS3Key(projectUuid, memoUuid)
        const presignedUrl = await generatePresignedUrl(s3Key, this.PRESIGNED_URL_EXPIRATION)

        // Step 2: Submit the document URL for processing
        const requestBody: DoclingConvertRequest = {
            sources: [
                {
                    kind: 'http',
                    url: presignedUrl,
                },
            ],
            to_formats: ['md'],
            image_export_mode: 'placeholder',
        }

        const response = await fetch(`${DOCLING_SERVICE_URL}/v1/convert/source`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Failed to convert document with Docling: ${response.status} - ${errorText}`)
        }

        const result = (await response.json()) as DoclingConvertResponse

        if (!result.output || result.output.length === 0 || !result.output[0].md_content) {
            throw new Error('Docling returned no markdown content')
        }

        return result.output[0].md_content
    }
}
