// Constants for localStorage keys
export const STORAGE_KEYS = {
    TOKEN: 'token',
    ONBOARDING_DISMISSED: 'skald_onboarding_dismissed',
}

/**
 * Utility functions for interacting with localStorage
 */
export const storage = {
    /**
     * Get a value from localStorage
     */
    get: <T>(key: string, defaultValue?: T): T | null => {
        try {
            const item = localStorage.getItem(key)

            if (item === null) return defaultValue ?? null

            try {
                return JSON.parse(item)
            } catch (parseError) {
                // If parsing fails, return the raw string
                // This handles cases where values were stored without JSON.stringify
                console.error(`Error parsing localStorage item: ${key}`, parseError)
                return item as unknown as T
            }
        } catch (e) {
            console.error(`Error getting localStorage item: ${key}`, e)
            return defaultValue ?? null
        }
    },

    /**
     * Set a value in localStorage directly without JSON.stringify for primitives
     */
    set: <T>(key: string, value: T): void => {
        try {
            let valueToStore: string

            // Handle primitive types directly, stringify objects
            if (value === null || value === undefined) {
                valueToStore = ''
            } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                valueToStore = String(value)
            } else {
                valueToStore = JSON.stringify(value)
            }

            localStorage.setItem(key, valueToStore)
        } catch (e) {
            console.error(`Error setting localStorage item: ${key}`, e)
        }
    },

    /**
     * Remove a value from localStorage
     */
    remove: (key: string): void => {
        try {
            localStorage.removeItem(key)
        } catch (e) {
            console.error(`Error removing localStorage item: ${key}`, e)
        }
    },

    /**
     * Clear all values in localStorage
     */
    clear: (): void => {
        try {
            localStorage.clear()
        } catch (e) {
            console.error('Error clearing localStorage', e)
        }
    },

    /**
     * Check if onboarding has been dismissed
     */
    isOnboardingDismissed: (): boolean => {
        const value = storage.get<string | boolean>(STORAGE_KEYS.ONBOARDING_DISMISSED)
        return value === true || value === 'true'
    },

    /**
     * Set onboarding as dismissed
     */
    setOnboardingDismissed: (isDismissed = true) => {
        storage.set(STORAGE_KEYS.ONBOARDING_DISMISSED, isDismissed)
    },

    /**
     * Clean up user-related data on logout
     */
    cleanupOnLogout: (): void => {
        storage.remove(STORAGE_KEYS.TOKEN)
        storage.remove(STORAGE_KEYS.ONBOARDING_DISMISSED)
    },
}
