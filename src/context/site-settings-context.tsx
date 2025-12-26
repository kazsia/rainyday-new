"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
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
    statistics: { base_sales: 0, base_buyers: 0, base_rating: "5.0" },
    dns: { records: [] },
    about: {
        title: "Empowering Digital Creators",
        subtitle: "Our Story",
        content_left: "Rainyday was founded with a simple mission: to bridge the gap between digital creators and their global audience.",
        content_right: "Since our inception, we've helped thousands of creators monetize their work and reach customers worldwide.",
        stats: [
            { label: "Creators", value: "10k+" },
            { label: "Transactions", value: "1M+" },
            { label: "Countries", value: "150+" },
            { label: "Uptime", value: "99.9%" }
        ]
    },
    faq: {
        items: [
            { q: "Can I make payments using my preferred method?", a: "Yes, we support a wide range of payment methods." },
            { q: "Is it safe to make payments?", a: "Yes, we take security very seriously." }
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
            { title: "Decentralized Payments", description: "Experience the freedom of peer-to-peer transactions.", icon: "Zap" },
            { title: "Instant Fulfillment", description: "Digital assets are delivered instantly.", icon: "Shield" },
            { title: "Lowest Fees", description: "Our optimized smart contracts ensure you keep more.", icon: "Globe" }
        ]
    },
    how_it_works: {
        title: "Shopping made simple in three easy steps!",
        texts: ["How It Works", "Simple Process", "Easy Steps"],
        steps: [
            { title: "Select a product", description: "Explore a wide range of products tailored to meet your needs." },
            { title: "Pay the invoice", description: "Proceed to checkout and choose from multiple payment options." },
            { title: "Receive Product", description: "Once payment is confirmed, we'll deliver your order promptly." }
        ]
    }
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

        // Set up real-time subscription - only if configured
        const supabase = createClient()
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey === 'your_anon_key_here') {
            return
        }

        const channel = supabase
            .channel('site_settings_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'site_settings'
                },
                () => {
                    fetchSettings()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
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
