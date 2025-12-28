"use server"
import { createClient, createAdminClient } from "@/lib/supabase/server"

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
        // Discord webhook templates
        sale_title: string
        sale_message: string
        ticket_title: string
        ticket_message: string
    }
    email: {
        enabled: boolean
        from_name: string
        from_email: string
        // Email templates
        invoice_subject: string
        invoice_heading: string
        invoice_message: string
        payment_subject: string
        payment_heading: string
        payment_message: string
        delivery_subject: string
        delivery_heading: string
        delivery_message: string
    }
    dns: {
        records: { type: string; name: string; value: string }[]
    }
    statistics: {
        base_sales: number
        base_buyers: number
        base_rating: string
    }
    about: {
        title: string
        subtitle: string
        content_left: string
        content_right: string
        stats: { label: string; value: string }[]
    }
    faq: {
        items: { q: string; a: string }[]
    }
    hero: {
        title: string
        description: string
        badge_text: string
        badge_label: string
        cta1_text: string
        cta1_href: string
        cta2_text: string
        cta2_href: string
        micro_details?: string[]
    }
    landing_cta: {
        title: string
        description: string
        button_text: string
        button_href: string
    }
    why_choose: {
        title: string
        subtitle: string
        features: {
            title: string
            description: string
            icon: string
        }[]
    }
    how_it_works: {
        title: string
        texts: string[]
        steps: {
            title: string
            description: string
        }[]
    }
}

export async function getSiteSettings(): Promise<SiteSettings> {
    try {
        const supabase = await createAdminClient()
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
            email: settingsMap.email || defaultSiteSettings.email,
            dns: settingsMap.dns || defaultSiteSettings.dns,
            statistics: settingsMap.statistics || defaultSiteSettings.statistics,
            about: settingsMap.about || defaultSiteSettings.about,
            faq: settingsMap.faq || defaultSiteSettings.faq,
            hero: settingsMap.hero || defaultSiteSettings.hero,
            landing_cta: settingsMap.landing_cta || defaultSiteSettings.landing_cta,
            why_choose: settingsMap.why_choose || defaultSiteSettings.why_choose,
            how_it_works: settingsMap.how_it_works || defaultSiteSettings.how_it_works
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
    notifications: {
        webhook_url: '',
        notify_on_sale: true,
        notify_on_ticket: true,
        sale_title: '🛒 New Sale',
        sale_message: 'Order #{order_id} - ${total} from {email}',
        ticket_title: '🎫 New Support Ticket',
        ticket_message: 'Ticket #{ticket_id} from {email}: {subject}'
    },
    email: {
        enabled: true,
        from_name: 'Rainyday',
        from_email: 'noreply@rainyday.cc',
        invoice_subject: 'Order #{order_id} - {store_name}',
        invoice_heading: 'Order Confirmed! 🎉',
        invoice_message: 'Thank you for your order. Please complete payment to receive your items.',
        payment_subject: 'Payment Confirmed - Order #{order_id}',
        payment_heading: 'Payment Received! ✅',
        payment_message: 'Your payment has been confirmed. Your items are being delivered.',
        delivery_subject: '🎉 Your Order is Delivered - #{order_id}',
        delivery_heading: 'Your Order is Delivered! 🚀',
        delivery_message: 'Thank you for your purchase. Your items are ready below.'
    },
    dns: { records: [{ type: 'A', name: '@', value: '76.76.21.21' }] },
    statistics: {
        base_sales: 1460,
        base_buyers: 162,
        base_rating: "4.98"
    },
    about: {
        title: "Empowering Digital Creators",
        subtitle: "Our Story",
        content_left: "Rainyday was founded with a simple mission: to bridge the gap between digital creators and their global audience. We believe that digital assets should be as secure and tangible as physical ones.\n\nOur platform leverages cutting-edge Web3 technology to ensure that every transaction is transparent, secure, and instantaneous. No more waiting for manual approvals or dealing with complex delivery systems.",
        content_right: "Since our inception, we've helped thousands of creators monetize their work and reach customers in over 150 countries. Our commitment to innovation drives us to constantly improve our infrastructure.\n\nWhether you're a seasoned developer or a first-time collector, Rainyday provides the tools you need to succeed in the digital economy.",
        stats: [
            { label: "Creators", value: "10k+" },
            { label: "Transactions", value: "1M+" },
            { label: "Countries", value: "150+" },
            { label: "Uptime", value: "99.9%" }
        ]
    },
    faq: {
        items: [
            {
                q: "Can I make payments using my preferred method?",
                a: "Yes, we support a wide range of payment methods, including popular fiat options like Credit Cards as well as various crypto currencies.",
            },
            {
                q: "Is it safe to make payments?",
                a: "Yes, we take security very seriously. We use advanced fraud prevention measures and do not store sensitive payment information.",
            },
            {
                q: "How do I make a purchase?",
                a: "Simply browse the available products, add them to your cart, and complete checkout with your preferred payment method.",
            },
            {
                q: "What is the return policy?",
                a: "Return policies vary by product. Review the policy for each product before purchasing to understand the terms.",
            }
        ]
    },
    hero: {
        title: "Digital Products, Redefined.",
        description: "Experience the future of digital assets with our secure and intuitive platform. Built for the next generation of creators.",
        badge_text: "Generative Surfaces",
        badge_label: "New",
        cta1_text: "Get Started",
        cta1_href: "/store",
        cta2_text: "View Products",
        cta2_href: "/store",
        micro_details: ["Low‑weight font", "Tight tracking", "Subtle motion"]
    },
    landing_cta: {
        title: "Ready to dive into digital products?",
        description: "Connect with our community and experience hassle-free digital product exchanges today!",
        button_text: "Get Started",
        button_href: "/store"
    },
    why_choose: {
        title: "The Ultimate Ecosystem",
        subtitle: "Why Choose Rainyday?",
        features: [
            {
                title: "Decentralized Payments",
                description: "Experience the freedom of peer-to-peer transactions with absolute security.",
                icon: "Zap"
            },
            {
                title: "Instant Fulfillment",
                description: "Digital assets are delivered to your wallet or email the second payment is confirmed.",
                icon: "Shield"
            },
            {
                title: "Lowest Fees",
                description: "Our optimized smart contracts ensure you keep more of what you earn.",
                icon: "Globe"
            }
        ]
    },
    how_it_works: {
        title: "Shopping made simple in three easy steps!",
        texts: ["How It Works", "Simple Process", "Easy Steps"],
        steps: [
            {
                title: "Select a product",
                description: "Explore a wide range of products, tailored to meet your needs. Simply click on the item you desire to learn more."
            },
            {
                title: "Pay the invoice",
                description: "Proceed to checkout where you can review your selected items and total cost. Choose from multiple payment options."
            },
            {
                title: "Receive Product",
                description: "Once your payment is confirmed, we'll process and ship your order promptly. Enjoy your new purchase!"
            }
        ]
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
    } catch (e: any) {
        console.error("[UPLOAD_ASSET_CRITICAL] Bucket: assets", e)
        // If it's a storage error, log the specific message
        if (e.message) console.error("Message:", e.message)
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
        const supabase = await createAdminClient()
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
