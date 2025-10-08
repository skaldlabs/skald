import axios, { AxiosRequestConfig, AxiosError, AxiosRequestHeaders, InternalAxiosRequestConfig } from 'axios'

axios.defaults.withCredentials = true

interface ApiConfig extends AxiosRequestConfig {
    disableTokenAuth?: boolean
    isFormData?: boolean
}

interface ApiResponse<T = any> {
    data?: T
    error?: string
}

const LOCAL_URL = 'http://localhost:8000'

const runningLocally = window.location.hostname === 'localhost'
export const domain = runningLocally ? LOCAL_URL : process.env.REACT_APP_REMOTE_URL

console.log('API URL:', domain)

const baseUrl = `${domain}/api`

const getCookie = (cookieName: string) => {
    let cookieValue = null
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';')
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim()
            if (cookie.substring(0, cookieName.length + 1) === cookieName + '=') {
                cookieValue = decodeURIComponent(cookie.substring(cookieName.length + 1))
                break
            }
        }
    }
    return cookieValue
}

axios.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
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

const makeRequest = async <T>(requestConfig: ApiConfig): Promise<ApiResponse<T>> => {
    try {
        const response = await axios(requestConfig)
        return { data: response.data }
    } catch (error) {
        let errorStr = String(error)
        if (error instanceof AxiosError) {
            errorStr =
                error.response?.data.error || error.response?.data?.detail || `Status code: ${error.response?.status}`
        }
        return { error: errorStr }
    }
}

export const api = {
    get: async <T>(path: string, config: ApiConfig = {}): Promise<ApiResponse<T>> => {
        return makeRequest<T>({
            method: 'get',
            url: `${baseUrl}${path}`,
            ...config,
        })
    },
    post: async <T>(path: string, data: Record<string, any> = {}, config: ApiConfig = {}): Promise<ApiResponse<T>> => {
        let requestData = data
        const headers: AxiosRequestHeaders = { ...config.headers } as AxiosRequestHeaders

        if (config.isFormData) {
            const formData = new FormData()
            Object.keys(data).forEach((key) => {
                formData.append(key, data[key])
            })
            requestData = formData
            headers['Content-Type'] = 'multipart/form-data'
        }

        return makeRequest<T>({
            method: 'post',
            url: `${baseUrl}${path}`,
            data: requestData,
            headers,
            ...config,
        })
    },
    put: async <T>(path: string, data: Record<string, any> = {}, config: ApiConfig = {}): Promise<ApiResponse<T>> => {
        return makeRequest<T>({
            method: 'put',
            url: `${baseUrl}${path}`,
            data,
            headers: { ...config.headers },
            ...config,
        })
    },
    delete: async <T>(path: string, config: ApiConfig = {}): Promise<ApiResponse<T>> => {
        return makeRequest<T>({
            method: 'delete',
            url: `${baseUrl}${path}`,
            headers: { ...config.headers },
            ...config,
        })
    },
}
