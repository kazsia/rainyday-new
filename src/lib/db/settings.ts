import { createClient } from "@/lib/supabase/client"

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
    }
    notifications: {
        webhook_url: string
        notify_on_sale: boolean
        notify_on_ticket: boolean
    }
    dns: {
        records: { type: string; name: string; value: string }[]
    }
}

export async function getSiteSettings(): Promise<SiteSettings> {
    const supabase = createClient()
    const { data } = await supabase.from('site_settings').select('key, value')

    const settingsMap = (data || []).reduce((acc, curr) => {
        acc[curr.key] = curr.value
        return acc
    }, {} as Record<string, any>)

    return {
        general: settingsMap.general || { name: 'Rainyday', description: '' },
        branding: settingsMap.branding || {},
        seo: settingsMap.seo || { title_template: '%s | Rainyday' },
        socials: settingsMap.socials || {},
        checkout: settingsMap.checkout || { show_coupon: true, show_terms: true, show_newsletter: false },
        feedbacks: settingsMap.feedbacks || { enable_automatic: true, hide_on_main: false },
        legal: settingsMap.legal || { terms_of_service: '', privacy_policy: '' },
        integrations: settingsMap.integrations || {},
        notifications: settingsMap.notifications || { webhook_url: '', notify_on_sale: true, notify_on_ticket: true },
        dns: settingsMap.dns || { records: [{ type: 'A', name: '@', value: '76.76.21.21' }] }
    }
}

export async function updateSiteSettings(section: keyof SiteSettings, value: any) {
    const supabase = createClient()
    const { error } = await supabase
        .from('site_settings')
        .upsert({ key: section, value })

    if (error) throw error
}

export async function uploadAsset(file: File): Promise<string> {
    const supabase = createClient()
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
}

// Generic helpers for individual settings (legacy/flat support)
export async function getAllSettings() {
    const supabase = createClient()
    const { data } = await supabase.from('site_settings').select('key, value')
    return (data || []).reduce((acc, curr) => {
        acc[curr.key] = curr.value
        return acc
    }, {} as Record<string, any>)
}

export async function getSetting(key: string) {
    const supabase = createClient()
    const { data } = await supabase.from('site_settings').select('value').eq('key', key).limit(1)
    return data?.[0]?.value
}

export async function updateSetting(key: string, value: any) {
    const supabase = createClient()
    const { error } = await supabase
        .from('site_settings')
        .upsert({ key, value })

    if (error) throw error
}
