import { useEffect, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { PublicChat } from '@/components/PublicChat/PublicChat'
import { usePublicChatStore } from '@/stores/publicChatStore'

interface PublicChatConfig {
    logo_url: string | null
    title: string | null
}

export const PublicChatPage = () => {
    const { slug } = useParams<{ slug: string }>()
    const [isChecking, setIsChecking] = useState(true)
    const [isAvailable, setIsAvailable] = useState(false)
    const [config, setConfig] = useState<PublicChatConfig | null>(null)
    const clearMessages = usePublicChatStore((state) => state.clearMessages)

    useEffect(() => {
        // Clear messages when component mounts or slug changes
        clearMessages()
    }, [slug, clearMessages])

    useEffect(() => {
        if (!slug) {
            setIsChecking(false)
            setIsAvailable(false)
            return
        }

        const checkAvailabilityAndLoadConfig = async () => {
            try {
                const [availabilityResponse, configResponse] = await Promise.all([
                    api.get<{ available: boolean }>(`/public_chat/${slug}/available`),
                    api.get<PublicChatConfig>(`/public_chat/${slug}/config`).catch(() => null),
                ])

                if (availabilityResponse.data?.available) {
                    setIsAvailable(true)
                    if (configResponse?.data) {
                        setConfig(configResponse.data)
                    }
                } else {
                    setIsAvailable(false)
                }
            } catch (error) {
                console.error('Error checking availability:', error)
                setIsAvailable(false)
            } finally {
                setIsChecking(false)
            }
        }

        checkAvailabilityAndLoadConfig()
    }, [slug])

    if (!slug) {
        return <Navigate to="/404" replace />
    }

    if (isChecking) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (!isAvailable) {
        return <Navigate to="/404" replace />
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <PublicChat slug={slug} logoUrl={config?.logo_url} title={config?.title} />
        </div>
    )
}
