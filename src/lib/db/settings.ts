"use server"
import { createClient } from "@/lib/supabase/server"

export type SiteSettings = {
    general: {
        name: string
        description: string
    }
    branding: {
        logo_url?: string
        footer_logo_url?: string
        favicon_url?: string
    }
    seo: {
        title_template: string
        og_image?: string
    }
    socials: {
        discord_url?: string
        youtube_url?: string
        telegram_url?: string
        tiktok_url?: string
        instagram_url?: string
    }
    checkout: {
        show_coupon: boolean
        show_terms: boolean
        show_newsletter: boolean
    }
    feedbacks: {
        enable_automatic: boolean
        hide_on_main: boolean
    }
    legal: {
        terms_of_service: string
        privacy_policy: string
    }
    integrations: {
        ga_id?: string
        crisp_id?: string
        tawk_id?: string
        webhook_secret?: string
    }
    notifications: {
        webhook_url: string
        notify_on_sale: boolean
        notify_on_ticket: boolean
    }
    dns: {
        records: { type: string; name: string; value: string }[]
    }
    statistics: {
        base_sales: number
        base_buyers: number
        base_rating: string
    }
}

export async function getSiteSettings(): Promise<SiteSettings> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase.from('site_settings').select('key, value')

        if (error) {
            console.error("Error fetching site settings:", error)
            return defaultSiteSettings
        }

        const settingsMap = (data || []).reduce((acc, curr) => {
            acc[curr.key] = curr.value
            return acc
        }, {} as Record<string, any>)

        return {
            general: settingsMap.general || defaultSiteSettings.general,
            branding: settingsMap.branding || defaultSiteSettings.branding,
            seo: settingsMap.seo || defaultSiteSettings.seo,
            socials: settingsMap.socials || defaultSiteSettings.socials,
            checkout: settingsMap.checkout || defaultSiteSettings.checkout,
            feedbacks: settingsMap.feedbacks || defaultSiteSettings.feedbacks,
            legal: settingsMap.legal || defaultSiteSettings.legal,
            integrations: settingsMap.integrations || defaultSiteSettings.integrations,
            notifications: settingsMap.notifications || defaultSiteSettings.notifications,
            dns: settingsMap.dns || defaultSiteSettings.dns,
            statistics: settingsMap.statistics || defaultSiteSettings.statistics
        }
    } catch (error) {
        console.error("Critical error in getSiteSettings:", error)
        return defaultSiteSettings
    }
}

const defaultSiteSettings: SiteSettings = {
    general: { name: 'Rainyday', description: '' },
    branding: {},
    seo: { title_template: '%s | Rainyday' },
    socials: {},
    checkout: { show_coupon: true, show_terms: true, show_newsletter: false },
    feedbacks: { enable_automatic: true, hide_on_main: false },
    legal: { terms_of_service: '', privacy_policy: '' },
    integrations: {},
    notifications: { webhook_url: '', notify_on_sale: true, notify_on_ticket: true },
    dns: { records: [{ type: 'A', name: '@', value: '76.76.21.21' }] },
    statistics: {
        base_sales: 1460,
        base_buyers: 162,
        base_rating: "4.98"
    }
}

export async function updateSiteSettings(section: keyof SiteSettings, value: any) {
    try {
        const supabase = await createClient()
        const { error } = await supabase
            .from('site_settings')
            .upsert({ key: section, value })

        if (error) throw error
    } catch (e) {
        console.error("[UPDATE_SITE_SETTINGS_CRITICAL]", e)
    }
}

export async function uploadAsset(file: File): Promise<string> {
    try {
        const supabase = await createClient()
        const ext = file.name.split('.').pop()
        const filename = `${Math.random().toString(36).substring(2)}.${ext}`

        const { error: uploadError } = await supabase.storage
            .from('assets')
            .upload(filename, file)

        if (uploadError) throw uploadError

        const { data } = supabase.storage
            .from('assets')
            .getPublicUrl(filename)

        return data.publicUrl
    } catch (e) {
        console.error("[UPLOAD_ASSET_CRITICAL]", e)
        return ""
    }
}

// Generic helpers for individual settings (legacy/flat support)
export async function getAllSettings() {
    try {
        const supabase = await createClient()
        const { data } = await supabase.from('site_settings').select('key, value')
        return (data || []).reduce((acc, curr) => {
            acc[curr.key] = curr.value
            return acc
        }, {} as Record<string, any>)
    } catch (e) {
        console.error("[GET_ALL_SETTINGS_CRITICAL]", e)
        return {}
    }
}

export async function getSetting(key: string) {
    try {
        const supabase = await createClient()
        const { data } = await supabase.from('site_settings').select('value').eq('key', key).limit(1)
        return data?.[0]?.value
    } catch (e) {
        console.error("[GET_SETTING_CRITICAL]", e)
        return null
    }
}

export async function updateSetting(key: string, value: any) {
    try {
        const supabase = await createClient()
        const { error } = await supabase
            .from('site_settings')
            .upsert({ key, value })

        if (error) throw error
    } catch (e) {
        console.error("[UPDATE_SETTING_CRITICAL]", e)
    }
}
