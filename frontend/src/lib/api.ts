import { useAuthStore } from '@/stores/authStore'
import axios, {
    type AxiosRequestConfig,
    AxiosError,
    type AxiosRequestHeaders,
    type InternalAxiosRequestConfig,
} from 'axios'
import type { ApiStreamData, ApiErrorData } from '@/lib/types'
import { useProjectStore } from '@/stores/projectStore'

axios.defaults.withCredentials = true

interface ApiConfig extends AxiosRequestConfig {
    disableTokenAuth?: boolean
    isFormData?: boolean
    signal?: AbortSignal
}

interface ApiResponse<T = unknown> {
    data?: T
    error?: string
}

const LOCAL_URL = 'http://localhost:8000'

export const domain = import.meta.env.VITE_API_HOST || LOCAL_URL

console.log('API URL:', domain)

const baseUrl = `${domain}/api`

const getCookie = (cookieName: string) => {
    let cookieValue = null
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';')
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim()
            if (cookie.substring(0, cookieName.length + 1) === `${cookieName}=`) {
                cookieValue = decodeURIComponent(cookie.substring(cookieName.length + 1))
                break
            }
        }
    }
    return cookieValue
}

axios.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.set('Authorization', `Token ${token}`)
        }

        if (config.method !== 'get') {
            const csrfToken = getCookie('csrftoken')
            if (csrfToken) {
                config.headers.set('X-Csrftoken', csrfToken)
            }
        }

        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

const _makeRequest = async <T>(requestConfig: ApiConfig): Promise<ApiResponse<T>> => {
    try {
        const response = await axios(requestConfig)
        return { data: response.data }
    } catch (error) {
        // If the request was aborted, re-throw the error so it can be handled by the caller
        if (error instanceof AxiosError && error.code === 'ERR_CANCELED') {
            throw error
        }

        let errorStr = String(error)
        if (error instanceof AxiosError) {
            if (error.response?.status === 401) {
                localStorage.removeItem('token')
            }
            errorStr =
                error.response?.data.error || error.response?.data?.detail || `Status code: ${error.response?.status}`
        }
        return { error: errorStr }
    }
}

export const api = {
    get: async <T>(path: string, config: ApiConfig = {}): Promise<ApiResponse<T>> => {
        return _makeRequest<T>({
            method: 'get',
            url: `${baseUrl}${path}`,
            ...config,
        })
    },
    post: async <T>(
        path: string,
        data: Record<string, unknown> = {},
        config: ApiConfig = {}
    ): Promise<ApiResponse<T>> => {
        let requestData: unknown = data
        const headers: AxiosRequestHeaders = { ...config.headers } as AxiosRequestHeaders

        if (config.isFormData) {
            const formData = new FormData()

            for (const key of Object.keys(data)) {
                if (key === 'file' && data[key] instanceof File) {
                    formData.append(key, data[key])
                } else if (key === 'metadata' && typeof data[key] === 'string') {
                    formData.append(key, data[key])
                } else {
                    formData.append(key, String(data[key]))
                }
            }

            requestData = formData
            // Let browser set the content type with boundary
            headers['Content-Type'] = undefined
        }

        return _makeRequest<T>({
            method: 'post',
            url: `${baseUrl}${path}`,
            data: requestData,
            headers,
            ...config,
        })
    },
    postFile: async <T>(path: string, data: FormData, config: ApiConfig = {}): Promise<ApiResponse<T>> => {
        const headers: AxiosRequestHeaders = { ...config.headers } as AxiosRequestHeaders

        return _makeRequest<T>({
            method: 'post',
            url: `${baseUrl}${path}`,
            data: data,
            headers,
            ...config,
        })
    },
    put: async <T>(
        path: string,
        data: Record<string, unknown> = {},
        config: ApiConfig = {}
    ): Promise<ApiResponse<T>> => {
        return _makeRequest<T>({
            method: 'put',
            url: `${baseUrl}${path}`,
            data,
            headers: { ...config.headers },
            ...config,
        })
    },
    delete: async <T>(path: string, config: ApiConfig = {}): Promise<ApiResponse<T>> => {
        return _makeRequest<T>({
            method: 'delete',
            url: `${baseUrl}${path}`,
            headers: { ...config.headers },
            ...config,
        })
    },
    stream: (
        path: string,
        data: Record<string, unknown>,
        onMessage: (data: ApiStreamData) => void,
        onError?: (error: ApiErrorData | Event) => void
    ) => {
        const token = localStorage.getItem('token')

        // create url with authorization token as query param since EventSource doesn't support custom headers
        const url = new URL(`${baseUrl}${path}`, window.location.origin)
        // Add each data field as a query parameter
        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined && value !== null) {
                url.searchParams.set(key, value.toString())
            }
        }
        if (token) {
            url.searchParams.set('authorization', `Token ${token}`)
        }

        const eventSource = new EventSource(url.toString(), {
            withCredentials: true,
        })

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)
                onMessage(data)
            } catch (error) {
                console.error('Error parsing SSE message:', error)
                if (onError) {
                    onError({ message: 'Failed to parse SSE message', details: { error } })
                }
            }
        }

        eventSource.onerror = (error) => {
            console.error('SSE Error:', error)
            if (onError) {
                onError(error)
            }
            eventSource.close()
        }

        return () => {
            eventSource.close()
        }
    },
}

export const getOrgPath = () => {
    const user = useAuthStore.getState().user
    if (!user?.current_organization_uuid) {
        // this should not happen but we handle it nevertheless
        throw new Error('No organization ID found')
    }
    return `/organization/${user.current_organization_uuid}`
}

export const getProjectPath = () => {
    const currentProject = useProjectStore.getState().currentProject
    if (!currentProject?.uuid) {
        throw new Error('No project selected')
    }
    return `/project/${currentProject.uuid}`
}
