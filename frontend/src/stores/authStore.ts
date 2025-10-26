import { create } from 'zustand'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { storage } from '@/lib/localStorage'
import posthog from 'posthog-js'
import { posthogIdentify } from '@/lib/posthog'

interface AuthResponse {
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
    default_organization: string
    current_project: string | null
    email_verified: boolean
    organization_name: string
    is_superuser: boolean
    name: string
    access_levels: {
        organization_access_levels: {
            [key: string]: OrganizationAccessLevel
        }
    }
}

export interface UserDetails extends UserDetailsResponse {
    current_organization_uuid: string
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
            // Try to fetch user details - if we have a valid cookie, this will succeed
            const userDetails = await fetchUserDetails()
            if (userDetails) {
                const user = {
                    ...userDetails,
                    current_organization_uuid: userDetails.default_organization,
                    organization_name: userDetails.organization_name,
                }
                set({
                    isAuthenticated: true,
                    user: user,
                })

                posthogIdentify(user.email, {
                    email: user.email,
                    name: user.name,
                    default_organization: user.default_organization,
                    email_verified: user.email_verified,
                    organization_name: user.organization_name,
                    current_organization_uuid: user.current_organization_uuid,
                })
            } else {
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
                current_organization_uuid: response.data.user.default_organization,
            }

            // Token is now stored in httpOnly cookie, no need to use localStorage
            set({ isAuthenticated: true, user: user })

            posthogIdentify(user.email, {
                email: user.email,
                name: user.name,
                default_organization: user.default_organization,
                email_verified: user.email_verified,
                organization_name: user.organization_name,
                current_organization_uuid: user.current_organization_uuid,
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
            // Token is now stored in httpOnly cookie, no need to use localStorage
            set({ isAuthenticated: true, user: user })

            posthogIdentify(user.email, {
                email: user.email,
                name: user.name,
                default_organization: user.default_organization,
                email_verified: user.email_verified,
                organization_name: user.organization_name,
                current_organization_uuid: user.current_organization_uuid,
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
