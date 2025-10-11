import { create } from 'zustand'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { storage, STORAGE_KEYS } from '@/lib/localStorage'
import posthog from 'posthog-js'

interface AuthResponse {
    token: string
    user: UserDetails
}
// keep in sync with skald.models.user.OrganizationMembershipRole
export enum OrganizationAccessLevel {
    MEMBER = 1,
    SUPER_ADMIN = 19,
    OWNER = 20,
}

interface UserDetailsResponse {
    email: string
    default_organization: number
    email_verified: boolean
    organization_name: string
    is_superuser: boolean
    name: string
    access_levels: {
        organization_access_levels: {
            [key: number]: OrganizationAccessLevel
        }
    }
}

export interface UserDetails extends UserDetailsResponse {
    current_organization_id: number
}

interface AuthState {
    isAuthenticated: boolean
    firstLoad: boolean
    user: UserDetails | null
    login: (email: string, password: string) => Promise<boolean>
    signup: (email: string, password: string) => Promise<boolean>
    logout: () => void
    initializeAuth: () => Promise<void>
}

const fetchUserDetails = async () => {
    const response = await api.get<UserDetailsResponse>('/user/details/')
    if (response.error) {
        return null
    }
    return response.data || null
}

export const useAuthStore = create<AuthState>((set) => {
    return {
        firstLoad: true,
        isAuthenticated: false,
        user: null,
        initializeAuth: async () => {
            const token = storage.get<string>(STORAGE_KEYS.TOKEN)

            if (!token) {
                set({ isAuthenticated: false, user: null, firstLoad: false })
                return
            }

            const userDetails = await fetchUserDetails()
            if (userDetails) {
                set({
                    isAuthenticated: true,
                    user: {
                        ...userDetails,
                        current_organization_id: userDetails.default_organization,
                        organization_name: userDetails.organization_name,
                    },
                })
            } else {
                storage.remove(STORAGE_KEYS.TOKEN)
                set({ isAuthenticated: false, user: null })
            }
            set({ firstLoad: false })
        },
        login: async (email: string, password: string) => {
            const response = await api.post<AuthResponse>('/user/login/', { email, password })
            if (response.error || !response.data) {
                toast.error(`Error logging in: ${response.error}`)
                return false
            }

            const user = {
                ...response.data.user,
                current_organization_id: response.data.user.default_organization,
            }

            storage.set(STORAGE_KEYS.TOKEN, response.data.token)
            set({ isAuthenticated: true, user: user })

            posthog.identify(user.email, {
                email: user.email,
                default_organization: user.default_organization,
                email_verified: user.email_verified,
                organization_name: user.organization_name,
                current_organization_id: user.current_organization_id,
            })

            return true
        },
        signup: async (email: string, password: string) => {
            const response = await api.post<AuthResponse>('/user/', { email, password })
            if (response.error || !response.data) {
                toast.error(`Error signing up: ${response.error}`)
                return false
            }
            const user = response.data.user
            storage.set(STORAGE_KEYS.TOKEN, response.data.token)
            set({ isAuthenticated: true, user: user })

            posthog.identify(response.data.user.email, {
                email: user.email,
                default_organization: user.default_organization,
                email_verified: user.email_verified,
                organization_name: user.organization_name,
                current_organization_id: user.current_organization_id,
            })

            return true
        },
        logout: () => {
            set({ isAuthenticated: false, user: null })
            storage.cleanupOnLogout()
            api.post('/user/logout/').catch(console.error)
            posthog.reset()
        },
    }
})
