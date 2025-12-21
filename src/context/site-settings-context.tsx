"use client"

import * as React from "react"
import { getSiteSettings, type SiteSettings } from "@/lib/db/settings"

interface SiteSettingsContextType {
    settings: SiteSettings | null
    isLoading: boolean
    refresh: () => Promise<void>
}

const SiteSettingsContext = React.createContext<SiteSettingsContextType | undefined>(undefined)

const defaultSettings: SiteSettings = {
    general: { name: 'Rainyday', description: '' },
    branding: {},
    seo: { title_template: '%s | Rainyday' },
    socials: {},
    checkout: { show_coupon: true, show_terms: true, show_newsletter: false },
    feedbacks: { enable_automatic: true, hide_on_main: false },
    legal: { terms_of_service: '', privacy_policy: '' },
    integrations: {},
    notifications: { webhook_url: '', notify_on_sale: true, notify_on_ticket: true },
    dns: { records: [] }
}

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = React.useState<SiteSettings | null>(null)
    const [isLoading, setIsLoading] = React.useState(true)

    const fetchSettings = React.useCallback(async () => {
        try {
            const data = await getSiteSettings()
            setSettings(data)
        } catch (error) {
            console.error("Failed to fetch site settings:", error)
            setSettings(defaultSettings)
        } finally {
            setIsLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchSettings()
    }, [fetchSettings])

    const value = React.useMemo(() => ({
        settings,
        isLoading,
        refresh: fetchSettings
    }), [settings, isLoading, fetchSettings])

    return (
        <SiteSettingsContext.Provider value={value}>
            {children}
        </SiteSettingsContext.Provider>
    )
}

export function useSiteSettings() {
    const context = React.useContext(SiteSettingsContext)
    if (context === undefined) {
        throw new Error("useSiteSettings must be used within a SiteSettingsProvider")
    }
    return context
}

// Optional: Hook that returns settings with defaults for components that need immediate values
export function useSiteSettingsWithDefaults() {
    const { settings, isLoading } = useSiteSettings()
    return {
        settings: settings || defaultSettings,
        isLoading
    }
}
