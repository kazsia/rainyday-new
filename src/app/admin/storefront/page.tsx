"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import {
    Store,
    Heart,
    Bell,
    FileText,
    ShoppingCart,
    Star,
    Settings,
    Plug,
    Save,
    Upload,
    Loader2,
    Image as ImageIcon,
    X,
    Trash,
    Bold,
    Italic,
    Underline,
    Link,
    Code,
    List,
    AlignLeft,
    HelpCircle,
    Activity,
    Mail,
    Info,
    Plus,
    Zap,
    Menu,
    Sparkles,
    MessageCircle,
    MousePointerClick,
    Footprints,
    User
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { getSiteSettings, updateSiteSettings, uploadAsset, type SiteSettings } from "@/lib/db/settings"
import { toast } from "sonner"
import Image from "next/image"

const CONFIGURE_TABS = [
    { id: "identity", label: "Identity", icon: Store },
    { id: "socials", label: "Socials", icon: Heart },
    { id: "checkout", label: "Checkout", icon: ShoppingCart },
    { id: "feedbacks", label: "Feedbacks", icon: Star },
    { id: "integrations", label: "Integrations", icon: Plug },
    { id: "statistics", label: "Statistics", icon: Activity },
]

const EDITOR_TABS = [
    { id: "navbar", label: "Navbar", icon: Menu },
    { id: "hero", label: "Hero Section", icon: Sparkles },
    { id: "why_choose", label: "Why Choose", icon: Zap },
    { id: "how_it_works", label: "How It Works", icon: Activity },
    { id: "faq", label: "FAQ", icon: HelpCircle },
    { id: "cta", label: "CTA Section", icon: MousePointerClick },
    { id: "footer", label: "Footer", icon: Footprints },
    { id: "about", label: "About Page", icon: Info },
    { id: "legal", label: "Legal Pages", icon: FileText },
    { id: "notifications", label: "Webhooks", icon: Bell },
    { id: "email", label: "Email", icon: Mail },
]

const TABS = [...CONFIGURE_TABS, ...EDITOR_TABS]

import { useSearchParams } from "next/navigation"

export default function AdminStorefrontPage() {
    const searchParams = useSearchParams()
    const tabParam = searchParams.get("tab")
    const [activeTab, setActiveTab] = useState(tabParam && TABS.some(t => t.id === tabParam) ? tabParam : "hero")
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (tabParam && TABS.some(t => t.id === tabParam)) {
            setActiveTab(tabParam)
        }
    }, [tabParam])

    const [settings, setSettings] = useState<SiteSettings>({
        general: { name: "", description: "" },
        branding: {},
        seo: { title_template: "" },
        socials: {},
        checkout: { show_coupon: true, show_terms: true, show_newsletter: false },
        feedbacks: { enable_automatic: true, hide_on_main: false },
        legal: { terms_of_service: "", privacy_policy: "" },
        integrations: {},
        notifications: {
            webhook_url: "",
            notify_on_sale: true,
            notify_on_ticket: true,
            sale_title: '🛒 New Sale',
            sale_message: 'Order #{order_id} - ${total} from {email}',
            ticket_title: '🎫 New Support Ticket',
            ticket_message: 'Ticket #{ticket_id} from {email}: {subject}'
        },
        email: {
            enabled: true,
            from_name: "",
            from_email: "",
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
        dns: { records: [] },
        statistics: {
            base_sales: 1460,
            base_buyers: 162,
            base_rating: "4.98"
        },
        about: {
            title: "",
            subtitle: "",
            content_left: "",
            content_right: "",
            stats: []
        },
        faq: {
            items: []
        },
        hero: {
            title: "",
            description: "",
            badge_text: "",
            badge_label: "",
            cta1_text: "",
            cta1_href: "",
            cta2_text: "",
            cta2_href: ""
        },
        landing_cta: {
            title: "",
            description: "",
            button_text: "",
            button_href: ""
        },
        why_choose: {
            title: "",
            subtitle: "",
            features: []
        },
        how_it_works: {
            title: "",
            texts: [],
            steps: []
        }
    })
    const [uploading, setUploading] = useState<string | null>(null)

    useEffect(() => {
        loadSettings()
    }, [])

    async function loadSettings() {
        try {
            const data = await getSiteSettings()
            setSettings(data)
        } catch (error) {
            toast.error("Failed to load settings")
        } finally {
            setIsLoading(false)
        }
    }

    async function handleSave() {
        try {
            await Promise.all([
                updateSiteSettings('general', settings.general),
                updateSiteSettings('branding', settings.branding),
                updateSiteSettings('seo', settings.seo),
                updateSiteSettings('socials', settings.socials),
                updateSiteSettings('checkout', settings.checkout),
                updateSiteSettings('feedbacks', settings.feedbacks),
                updateSiteSettings('legal', settings.legal),
                updateSiteSettings('integrations', settings.integrations),
                updateSiteSettings('notifications', settings.notifications),
                updateSiteSettings('email', settings.email),
                updateSiteSettings('statistics', settings.statistics),
                updateSiteSettings('about', settings.about),
                updateSiteSettings('faq', settings.faq),
                updateSiteSettings('hero', settings.hero),
                updateSiteSettings('landing_cta', settings.landing_cta),
                updateSiteSettings('why_choose', settings.why_choose),
                updateSiteSettings('how_it_works', settings.how_it_works)
            ])
            toast.success("Settings saved successfully")
        } catch (error) {
            toast.error("Failed to save settings")
        }
    }

    async function handleUpload(file: File, section: 'branding' | 'seo', field: string) {
        setUploading(field)
        try {
            const url = await uploadAsset(file)
            setSettings(prev => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [field]: url
                }
            }))
            toast.success("Image uploaded")
        } catch (error) {
            toast.error("Upload failed")
            console.error(error)
        } finally {
            setUploading(null)
        }
    }

    if (isLoading) return (
        <AdminLayout>
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                <Loader2 className="w-8 h-8 animate-spin text-white/20" />
            </div>
        </AdminLayout>
    )

    return (
        <AdminLayout>
            <div className="space-y-6 max-w-[100rem] mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Configure Storefront</h1>
                        <p className="text-sm text-white/40">Manage your shop settings.</p>
                    </div>
                </div>


                <div className="flex flex-col md:grid md:grid-cols-12 gap-6 lg:gap-8 pb-32">
                    {/* Sidebar / Tabs */}
                    <div className="col-span-12 md:col-span-3 lg:col-span-2">
                        <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                            {/* Configure Section */}
                            <div className="hidden md:block text-[10px] font-black text-white/20 uppercase tracking-widest px-4 py-2">Configure</div>
                            {CONFIGURE_TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "whitespace-nowrap flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium border shrink-0",
                                        activeTab === tab.id
                                            ? "bg-brand/10 text-brand border-brand/20 shadow-[0_0_15px_rgba(38,188,196,0.1)]"
                                            : "text-white/40 hover:text-white hover:bg-white/5 border-transparent"
                                    )}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}

                            {/* Editor Section */}
                            <div className="hidden md:block text-[10px] font-black text-white/20 uppercase tracking-widest px-4 py-2 mt-4">Editor</div>
                            {EDITOR_TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "whitespace-nowrap flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium border shrink-0",
                                        activeTab === tab.id
                                            ? "bg-brand/10 text-brand border-brand/20 shadow-[0_0_15px_rgba(38,188,196,0.1)]"
                                            : "text-white/40 hover:text-white hover:bg-white/5 border-transparent"
                                    )}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="col-span-12 md:col-span-9 lg:col-span-10 bg-[#080c10] border border-white/5 rounded-2xl p-4 sm:p-8 min-h-[600px]">

                        {/* IDENTITY TAB */}
                        {activeTab === "identity" && (
                            <div className="space-y-10 max-w-3xl animate-in fade-in duration-500">
                                <div>
                                    <h2 className="text-lg font-bold text-white mb-1">Identity</h2>
                                    <p className="text-sm text-white/40">Customize your shop's branding and description.</p>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-white">Shop Name</label>
                                        <p className="text-xs text-white/40 mb-2">It will be displayed all over your website and in the browser tab.</p>
                                        <Input
                                            value={settings.general.name}
                                            onChange={e => setSettings({ ...settings, general: { ...settings.general, name: e.target.value } })}
                                            className="bg-background border-white/10 h-11"
                                            placeholder="Your Shop Name"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        {[
                                            { label: "Logo", field: "logo_url", desc: "Will be displayed in the header." },
                                            { label: "Footer Logo", field: "footer_logo_url", desc: "Will be displayed in the footer." },
                                            { label: "Favicon", field: "favicon_url", desc: "Will be displayed in the browser tab." },
                                            { label: "OG Image", field: "og_image", desc: "Social sharing preview.", section: 'seo' }
                                        ].map((item) => (
                                            <div key={item.field} className="space-y-3">
                                                <div className="flex justify-between items-baseline">
                                                    <label className="text-sm font-bold text-white">{item.label}</label>
                                                </div>
                                                <p className="text-xs text-white/40 min-h-[20px]">{item.desc}</p>
                                                <div className="relative group aspect-video rounded-xl bg-background border border-white/10 overflow-hidden hover:border-brand/40 transition-colors">
                                                    {(settings[item.section as 'branding' | 'seo' || 'branding'] as any)?.[item.field] ? (
                                                        <>
                                                            <Image
                                                                src={(settings[item.section as 'branding' | 'seo' || 'branding'] as any)[item.field]}
                                                                alt={item.label}
                                                                fill
                                                                sizes="(max-width: 768px) 50vw, 200px"
                                                                className="object-contain p-4"
                                                            />
                                                            <button
                                                                onClick={() => { /* Add delete logic */ }}
                                                                className="absolute top-2 right-2 p-1.5 bg-background/60 rounded-lg text-white/60 hover:text-white hover:bg-red-500/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20 gap-2">
                                                            <ImageIcon className="w-8 h-8" />
                                                            <span className="text-xs font-bold uppercase tracking-wider">Upload</span>
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                                                        <div className="relative">
                                                            <Input
                                                                type="file"
                                                                accept="image/*"
                                                                disabled={uploading === item.field}
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0]
                                                                    if (file) handleUpload(file, (item.section as any) || 'branding', item.field)
                                                                }}
                                                                className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                                                            />
                                                            <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 pointer-events-none">
                                                                {uploading === item.field ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Upload className="w-3 h-3 mr-2" />}
                                                                Choose File
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-white">Description</label>
                                        <p className="text-xs text-white/40 mb-2">This will be shown in Google search results and on your shop page.</p>
                                        <Textarea
                                            value={settings.general.description}
                                            onChange={e => setSettings({ ...settings, general: { ...settings.general, description: e.target.value } })}
                                            className="bg-background border-white/10 min-h-[100px]"
                                            placeholder="Describe your store..."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SOCIALS TAB */}
                        {activeTab === "socials" && (
                            <div className="space-y-10 max-w-3xl animate-in fade-in duration-500">
                                <div>
                                    <h2 className="text-lg font-bold text-white mb-1">Socials</h2>
                                    <p className="text-sm text-white/40">Add links to your social media profiles to display them on your shop.</p>
                                </div>
                                <div className="space-y-6">
                                    {[
                                        { label: "Discord Server URL", field: "discord_url" },
                                        { label: "YouTube Channel URL", field: "youtube_url" },
                                        { label: "Telegram Channel URL", field: "telegram_url" },
                                        { label: "TikTok Profile URL", field: "tiktok_url" },
                                        { label: "Instagram Profile URL", field: "instagram_url" }
                                    ].map((item) => (
                                        <div key={item.field} className="space-y-2">
                                            <label className="text-sm font-bold text-white">{item.label}</label>
                                            <Input
                                                value={settings.socials[item.field as keyof typeof settings.socials] || ""}
                                                onChange={e => setSettings({ ...settings, socials: { ...settings.socials, [item.field]: e.target.value } })}
                                                className="bg-background border-white/10 h-11"
                                                placeholder={`https://${item.label.toLowerCase().split(' ')[0]}.com/...`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* CHECKOUT TAB */}
                        {activeTab === "checkout" && (
                            <div className="space-y-10 max-w-3xl animate-in fade-in duration-500">
                                <div>
                                    <h2 className="text-lg font-bold text-white mb-1">Checkout</h2>
                                    <p className="text-sm text-white/40">Customize the checkout page.</p>
                                </div>
                                <div className="space-y-8 bg-background p-6 rounded-xl border border-white/5">
                                    {[
                                        { label: "Show Coupon Code Textbox", desc: "If enabled, a textbox will be shown on the checkout page to allow customers to enter a coupon code.", field: "show_coupon" },
                                        { label: "Show Terms Checkbox", desc: "If enabled, a checkbox saying \"have read and agree the Terms of Service\" will be shown on the checkout page.", field: "show_terms" },
                                        { label: "Show Newsletter Checkbox", desc: "If enabled, a checkbox saying \"I would like to receive updates and promotions\" will be shown on the checkout page.", field: "show_newsletter" }
                                    ].map((item) => (
                                        <div key={item.field} className="flex flex-col gap-4">
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="text-sm font-bold text-white">{item.label}</label>
                                                    <Switch
                                                        checked={settings.checkout[item.field as keyof typeof settings.checkout]}
                                                        onCheckedChange={val => setSettings({ ...settings, checkout: { ...settings.checkout, [item.field]: val } })}
                                                    />
                                                </div>
                                                <p className="text-xs text-white/40 leading-relaxed max-w-xl">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* FEEDBACKS TAB */}
                        {activeTab === "feedbacks" && (
                            <div className="space-y-10 max-w-3xl animate-in fade-in duration-500">
                                <div>
                                    <h2 className="text-lg font-bold text-white mb-1">Feedbacks</h2>
                                    <p className="text-sm text-white/40">Customize how feedbacks are handled on your shop.</p>
                                </div>

                                <div className="bg-background p-6 rounded-xl border border-white/5 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-bold text-white">Enable Automatic Feedbacks</label>
                                                <Switch
                                                    checked={settings.feedbacks.enable_automatic}
                                                    onCheckedChange={val => setSettings({ ...settings, feedbacks: { ...settings.feedbacks, enable_automatic: val } })}
                                                />
                                            </div>
                                            <p className="text-xs text-white/40">If buyers do not leave feedback within 7 days, a 5 star feedback will be automatically left.</p>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-bold text-white">Hide Automatic Feedbacks on Main Page</label>
                                                <Switch
                                                    checked={settings.feedbacks.hide_on_main}
                                                    onCheckedChange={val => setSettings({ ...settings, feedbacks: { ...settings.feedbacks, hide_on_main: val } })}
                                                />
                                            </div>
                                            <p className="text-xs text-white/40">Automatic feedbacks will be hidden from the main page, but will remain visible on the Feedback page.</p>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-white/5 space-y-4">
                                        <div>
                                            <label className="text-sm font-bold text-white">Delete Existing Automatic Feedbacks</label>
                                            <p className="text-xs text-white/40 mt-1">This will permanently delete all automatic feedbacks that have been left on your shop.</p>
                                        </div>
                                        <Button variant="outline" className="border-brand/20 text-brand hover:bg-brand/10 hover:text-brand">
                                            <Trash className="w-4 h-4 mr-2" />
                                            Delete Automatic Feedbacks
                                        </Button>
                                    </div>
                                </div>

                                <div className="bg-brand/5 border border-brand/10 p-6 rounded-xl">
                                    <div className="flex items-start gap-3">
                                        <HelpCircle className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-bold text-white">How can a Customer Leave a Feedback?</h4>
                                            <ul className="text-xs text-white/60 space-y-1 list-disc pl-4">
                                                <li>A "Leave Feedback" button is shown on the invoice page after a successful payment.</li>
                                                <li>The button only shows to the buyer. No one else can see the button when visiting the invoice page.</li>
                                                <li>The button is also included in the "Order Completed" email sent to the customer.</li>
                                                <li>A feedback can be left only if the invoice isn't processed manually (by the shop owner in the dashboard), and if the invoice price is more or equal to $1.00.</li>
                                                <li>This has been done to reduce the risk of fake feedbacks being submitted.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* LEGAL PAGES TAB */}
                        {activeTab === "legal" && (
                            <div className="space-y-10 max-w-4xl animate-in fade-in duration-500">
                                <div>
                                    <h2 className="text-lg font-bold text-white mb-1">Legal Pages</h2>
                                    <p className="text-sm text-white/40">Configure the legal pages for your shop.</p>
                                </div>

                                {[
                                    { label: "Terms of Service", field: "terms_of_service", desc: "This page is important for protecting your business and informing customers of their rights and responsibilities when using your services." },
                                    { label: "Privacy Policy", field: "privacy_policy", desc: "This page is important for informing customers about how their data is collected, used, and protected when they use your services." }
                                ].map((item) => (
                                    <div key={item.field} className="space-y-3">
                                        <div>
                                            <label className="text-sm font-bold text-white">{item.label}</label>
                                            <p className="text-xs text-white/40 mt-1">{item.desc}</p>
                                        </div>
                                        <div className="bg-background border border-white/10 rounded-lg overflow-hidden">
                                            {/* Dummy Toolbar */}
                                            <div className="flex items-center gap-1 p-2 border-b border-white/10 bg-white/5">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-white/40 hover:text-white"><Bold className="w-4 h-4" /></Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-white/40 hover:text-white"><Italic className="w-4 h-4" /></Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-white/40 hover:text-white"><Underline className="w-4 h-4" /></Button>
                                                <div className="w-px h-4 bg-white/10 mx-1" />
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-white/40 hover:text-white"><Link className="w-4 h-4" /></Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-white/40 hover:text-white"><Code className="w-4 h-4" /></Button>
                                                <div className="w-px h-4 bg-white/10 mx-1" />
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-white/40 hover:text-white"><List className="w-4 h-4" /></Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-white/40 hover:text-white"><AlignLeft className="w-4 h-4" /></Button>
                                            </div>
                                            <Textarea
                                                value={settings.legal[item.field as keyof typeof settings.legal]}
                                                onChange={e => setSettings({ ...settings, legal: { ...settings.legal, [item.field]: e.target.value } })}
                                                className="bg-transparent border-none min-h-[300px] resize-y p-4 focus-visible:ring-0"
                                                placeholder={`Write your ${item.label} here...`}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* INTEGRATIONS TAB */}
                        {activeTab === "integrations" && (
                            <div className="space-y-10 max-w-3xl animate-in fade-in duration-500">
                                <div>
                                    <h2 className="text-lg font-bold text-white mb-1">Integrations</h2>
                                    <p className="text-sm text-white/40">Integrate third-party services to your shop.</p>
                                </div>
                                <div className="space-y-6">
                                    {[
                                        { label: "Google Analytics ID (gtag)", field: "ga_id", placeholder: "G-XXXXXXXX" },
                                        { label: "Crisp Website ID", field: "crisp_id", placeholder: "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX" },
                                        { label: "Tawk.to ID", field: "tawk_id", placeholder: "d7264425ca33feee33ee1597158e68ce41949a17" }
                                    ].map((item) => (
                                        <div key={item.field} className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <label className="text-sm font-bold text-white">{item.label}</label>
                                                <HelpCircle className="w-3 h-3 text-white/20" />
                                            </div>
                                            <Input
                                                value={settings.integrations[item.field as keyof typeof settings.integrations] || ""}
                                                onChange={e => setSettings({ ...settings, integrations: { ...settings.integrations, [item.field]: e.target.value } })}
                                                className="bg-background border-white/10 h-11"
                                                placeholder={item.placeholder}
                                            />
                                        </div>
                                    ))}
                                    {/* Webhook Secret */}
                                    <div className="pt-6 border-t border-white/5 space-y-4">
                                        <div className="space-y-1">
                                            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Global Webhook Secret</h3>
                                            <p className="text-xs text-white/40">This secret is used to sign Dynamic Delivery requests. Keep it private.</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                readOnly
                                                value={settings.integrations.webhook_secret || ""}
                                                className="bg-background border-white/10 h-11 font-mono text-xs text-brand"
                                            />
                                            <Button
                                                variant="outline"
                                                className="border-white/10 hover:bg-white/5 text-white/60 hover:text-white shrink-0"
                                                onClick={() => {
                                                    const newSecret = Array.from(crypto.getRandomValues(new Uint8Array(16)))
                                                        .map(b => b.toString(16).padStart(2, '0'))
                                                        .join('');
                                                    setSettings(prev => ({
                                                        ...prev,
                                                        integrations: {
                                                            ...prev.integrations,
                                                            webhook_secret: newSecret
                                                        }
                                                    }));
                                                }}
                                            >
                                                Regenerate
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* NOTIFICATIONS TAB */}
                        {activeTab === "notifications" && (
                            <div className="space-y-8 animate-in fade-in duration-500">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
                                    <div>
                                        <h2 className="text-lg font-bold text-white">Discord Webhooks</h2>
                                        <p className="text-xs text-white/40">Real-time notifications for your store events.</p>
                                    </div>
                                    <div className="flex items-center gap-6 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Sale</label>
                                            <Switch
                                                checked={settings.notifications.notify_on_sale}
                                                onCheckedChange={val => setSettings({ ...settings, notifications: { ...settings.notifications, notify_on_sale: val } })}
                                            />
                                        </div>
                                        <div className="w-px h-4 bg-white/10" />
                                        <div className="flex items-center gap-3">
                                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Ticket</label>
                                            <Switch
                                                checked={settings.notifications.notify_on_ticket}
                                                onCheckedChange={val => setSettings({ ...settings, notifications: { ...settings.notifications, notify_on_ticket: val } })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/60">Webhook URL</label>
                                        <Input
                                            value={settings.notifications.webhook_url}
                                            onChange={e => setSettings({ ...settings, notifications: { ...settings.notifications, webhook_url: e.target.value } })}
                                            className="bg-background border-white/10 h-10 font-mono text-xs"
                                            placeholder="https://discord.com/api/webhooks/..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Sale Template */}
                                        <div className="bg-[#0c1218] p-5 rounded-2xl border border-white/5 space-y-4">
                                            <div className="flex items-center gap-2 text-brand">
                                                <ShoppingCart className="w-4 h-4" />
                                                <h3 className="text-xs font-bold uppercase tracking-widest">Sale Notification</h3>
                                            </div>
                                            <div className="space-y-3 font-sans">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Title</label>
                                                    <Input
                                                        value={settings.notifications.sale_title || ""}
                                                        onChange={e => setSettings({ ...settings, notifications: { ...settings.notifications, sale_title: e.target.value } })}
                                                        className="bg-background/50 border-white/5 h-9 text-xs"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Message</label>
                                                    <Textarea
                                                        value={settings.notifications.sale_message || ""}
                                                        onChange={e => setSettings({ ...settings, notifications: { ...settings.notifications, sale_message: e.target.value } })}
                                                        className="bg-background/50 border-white/5 min-h-[60px] text-xs resize-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Ticket Template */}
                                        <div className="bg-[#0c1218] p-5 rounded-2xl border border-white/5 space-y-4">
                                            <div className="flex items-center gap-2 text-brand">
                                                <Bell className="w-4 h-4" />
                                                <h3 className="text-xs font-bold uppercase tracking-widest">Ticket Notification</h3>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Title</label>
                                                    <Input
                                                        value={settings.notifications.ticket_title || ""}
                                                        onChange={e => setSettings({ ...settings, notifications: { ...settings.notifications, ticket_title: e.target.value } })}
                                                        className="bg-background/50 border-white/5 h-9 text-xs"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Message</label>
                                                    <Textarea
                                                        value={settings.notifications.ticket_message || ""}
                                                        onChange={e => setSettings({ ...settings, notifications: { ...settings.notifications, ticket_message: e.target.value } })}
                                                        className="bg-background/50 border-white/5 min-h-[60px] text-xs resize-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Variables Legend */}
                                    <div className="px-4 py-3 bg-brand/5 border border-brand/10 rounded-xl flex flex-wrap gap-x-6 gap-y-2 items-center">
                                        <span className="text-[10px] font-bold text-brand uppercase tracking-widest flex items-center gap-2">
                                            <Code className="w-3 h-3" /> Variables:
                                        </span>
                                        <div className="flex flex-wrap gap-3">
                                            {["order_id", "total", "email", "products", "ticket_id", "subject"].map(v => (
                                                <code key={v} className="text-[10px] text-white/40 font-mono bg-white/5 px-1.5 py-0.5 rounded">{"{"}{v}{"}"}</code>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* EMAIL TAB */}
                        {activeTab === "email" && (
                            <div className="space-y-8 animate-in fade-in duration-500">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={settings.email?.enabled}
                                                onCheckedChange={val => setSettings({ ...settings, email: { ...settings.email, enabled: val } })}
                                            />
                                            <span className="text-sm font-bold text-white">Enable Email</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Sender Name</label>
                                            <Input
                                                value={settings.email?.from_name || ""}
                                                onChange={e => setSettings({ ...settings, email: { ...settings.email, from_name: e.target.value } })}
                                                className="bg-background border-white/10 h-9 px-3 text-xs w-full sm:w-[150px]"
                                                placeholder="Rainyday"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Sender Email</label>
                                            <Input
                                                value={settings.email?.from_email || ""}
                                                onChange={e => setSettings({ ...settings, email: { ...settings.email, from_email: e.target.value } })}
                                                className="bg-background border-white/10 h-9 px-3 text-xs w-full sm:w-[220px]"
                                                placeholder="noreply@yourdomain.com"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {[
                                        { title: "Invoice Email", key: "invoice", icon: FileText },
                                        { title: "Payment Received", key: "payment", icon: ShoppingCart },
                                        { title: "Delivery Completed", key: "delivery", icon: Zap }
                                    ].map((tmpl) => (
                                        <div key={tmpl.key} className="bg-[#0c1218] p-5 rounded-2xl border border-white/5 space-y-4">
                                            <div className="flex items-center gap-2 text-brand">
                                                <tmpl.icon className="w-4 h-4" />
                                                <h3 className="text-xs font-bold uppercase tracking-widest">{tmpl.title}</h3>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Subject Line</label>
                                                    <Input
                                                        value={settings.email?.[`${tmpl.key}_subject` as keyof typeof settings.email] as string || ""}
                                                        onChange={e => setSettings({ ...settings, email: { ...settings.email, [`${tmpl.key}_subject`]: e.target.value } })}
                                                        className="bg-background/50 border-white/5 h-9 text-xs"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Heading</label>
                                                        <Input
                                                            value={settings.email?.[`${tmpl.key}_heading` as keyof typeof settings.email] as string || ""}
                                                            onChange={e => setSettings({ ...settings, email: { ...settings.email, [`${tmpl.key}_heading`]: e.target.value } })}
                                                            className="bg-background/50 border-white/5 h-9 text-xs"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Message Text</label>
                                                        <Input
                                                            value={settings.email?.[`${tmpl.key}_message` as keyof typeof settings.email] as string || ""}
                                                            onChange={e => setSettings({ ...settings, email: { ...settings.email, [`${tmpl.key}_message`]: e.target.value } })}
                                                            className="bg-background/50 border-white/5 h-9 text-xs"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 text-blue-400">
                                            <Info className="w-4 h-4" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-xs font-bold text-white">Resend Setup</h4>
                                            <p className="text-[10px] text-white/40 leading-relaxed italic">
                                                Add your domain and API key at <a href="https://resend.com" target="_blank" className="text-brand hover:underline">resend.com</a>. Set <code className="bg-white/10 px-1 rounded">RESEND_API_KEY</code> in your environment.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-4 py-3 bg-brand/5 border border-brand/10 rounded-xl flex flex-wrap gap-x-6 gap-y-2 items-center">
                                    <span className="text-[10px] font-bold text-brand uppercase tracking-widest flex items-center gap-2">
                                        <Code className="w-3 h-3" /> Variables:
                                    </span>
                                    <div className="flex flex-wrap gap-3">
                                        {["order_id", "email", "total", "store_name", "products", "payment_method"].map(v => (
                                            <code key={v} className="text-[10px] text-white/40 font-mono bg-white/5 px-1.5 py-0.5 rounded">{"{"}{v}{"}"}</code>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ABOUT TAB */}
                        {/* WHY CHOOSE TAB */}
                        {activeTab === "why_choose" && (
                            <div className="space-y-10 max-w-4xl animate-in fade-in duration-500">
                                <div>
                                    <h2 className="text-lg font-bold text-white mb-1">Why Choose Section</h2>
                                    <p className="text-sm text-white/40">Customize the "Why Choose" section on your landing page.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-white">Title</label>
                                            <Input
                                                value={settings.why_choose.title}
                                                onChange={e => setSettings({ ...settings, why_choose: { ...settings.why_choose, title: e.target.value } })}
                                                className="bg-background border-white/10 h-11"
                                                placeholder="The Ultimate Ecosystem"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-white">Subtitle</label>
                                            <Input
                                                value={settings.why_choose.subtitle}
                                                onChange={e => setSettings({ ...settings, why_choose: { ...settings.why_choose, subtitle: e.target.value } })}
                                                className="bg-background border-white/10 h-11"
                                                placeholder="Why Choose Rainyday?"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-bold text-white">Features</label>
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={() => {
                                                    setSettings({
                                                        ...settings,
                                                        why_choose: {
                                                            ...settings.why_choose,
                                                            features: [
                                                                ...settings.why_choose.features,
                                                                { title: "", description: "", icon: "Zap" }
                                                            ]
                                                        }
                                                    })
                                                }}
                                                className="bg-brand/10 hover:bg-brand/20 text-brand border border-brand/20"
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                Add Feature
                                            </Button>
                                        </div>

                                        <div className="space-y-4">
                                            {settings.why_choose.features.map((feature, index) => (
                                                <div key={index} className="bg-background p-6 rounded-xl border border-white/10 space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Feature {index + 1}</span>
                                                        <Button
                                                            type="button"
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                const newFeatures = settings.why_choose.features.filter((_, i) => i !== index)
                                                                setSettings({
                                                                    ...settings,
                                                                    why_choose: {
                                                                        ...settings.why_choose,
                                                                        features: newFeatures
                                                                    }
                                                                })
                                                            }}
                                                            className="h-8 w-8 text-white/40 hover:text-red-500 hover:bg-red-500/10"
                                                        >
                                                            <Trash className="w-4 h-4" />
                                                        </Button>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold text-white/60">Icon</label>
                                                            <select
                                                                value={feature.icon}
                                                                onChange={e => {
                                                                    const newFeatures = [...settings.why_choose.features]
                                                                    newFeatures[index] = { ...newFeatures[index], icon: e.target.value }
                                                                    setSettings({
                                                                        ...settings,
                                                                        why_choose: {
                                                                            ...settings.why_choose,
                                                                            features: newFeatures
                                                                        }
                                                                    })
                                                                }}
                                                                className="w-full h-11 bg-background border border-white/10 rounded-lg px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand/50"
                                                            >
                                                                <option value="Zap">⚡ Zap</option>
                                                                <option value="Shield">🛡️ Shield</option>
                                                                <option value="Globe">🌐 Globe</option>
                                                                <option value="Rocket">🚀 Rocket</option>
                                                                <option value="Lock">🔒 Lock</option>
                                                                <option value="Cloud">☁️ Cloud</option>
                                                                <option value="Download">⬇️ Download</option>
                                                                <option value="Eye">👁️ Eye</option>
                                                                <option value="Star">⭐ Star</option>
                                                                <option value="Heart">❤️ Heart</option>
                                                                <option value="Trophy">🏆 Trophy</option>
                                                                <option value="Users">👥 Users</option>
                                                                <option value="Activity">📊 Activity</option>
                                                                <option value="Cpu">💻 Cpu</option>
                                                            </select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold text-white/60">Title</label>
                                                            <Input
                                                                value={feature.title}
                                                                onChange={e => {
                                                                    const newFeatures = [...settings.why_choose.features]
                                                                    newFeatures[index] = { ...newFeatures[index], title: e.target.value }
                                                                    setSettings({
                                                                        ...settings,
                                                                        why_choose: {
                                                                            ...settings.why_choose,
                                                                            features: newFeatures
                                                                        }
                                                                    })
                                                                }}
                                                                className="bg-background border-white/10 h-11"
                                                                placeholder="Feature Title"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-white/60">Description</label>
                                                        <Textarea
                                                            value={feature.description}
                                                            onChange={e => {
                                                                const newFeatures = [...settings.why_choose.features]
                                                                newFeatures[index] = { ...newFeatures[index], description: e.target.value }
                                                                setSettings({
                                                                    ...settings,
                                                                    why_choose: {
                                                                        ...settings.why_choose,
                                                                        features: newFeatures
                                                                    }
                                                                })
                                                            }}
                                                            className="bg-background border-white/10 min-h-[80px] resize-none"
                                                            placeholder="Feature description..."
                                                        />
                                                    </div>
                                                </div>
                                            ))}

                                            {settings.why_choose.features.length === 0 && (
                                                <div className="text-center py-12 bg-background rounded-xl border border-white/5">
                                                    <p className="text-sm text-white/40">No features added yet. Click "Add Feature" to get started.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "about" && (
                            <div className="space-y-10 max-w-4xl animate-in fade-in duration-500">
                                <div>
                                    <h2 className="text-lg font-bold text-white mb-1">About Page</h2>
                                    <p className="text-sm text-white/40">Customize the contents of your /about page.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-white">Title</label>
                                            <Input
                                                value={settings.about.title}
                                                onChange={e => setSettings({ ...settings, about: { ...settings.about, title: e.target.value } })}
                                                className="bg-background border-white/10 h-11"
                                                placeholder="Empowering Digital Creators"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-white">Subtitle</label>
                                            <Input
                                                value={settings.about.subtitle}
                                                onChange={e => setSettings({ ...settings, about: { ...settings.about, subtitle: e.target.value } })}
                                                className="bg-background border-white/10 h-11"
                                                placeholder="Our Story"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-white">Content Left Column</label>
                                            <Textarea
                                                value={settings.about.content_left}
                                                onChange={e => setSettings({ ...settings, about: { ...settings.about, content_left: e.target.value } })}
                                                className="bg-background border-white/10 min-h-[150px]"
                                                placeholder="Describe your mission..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-white">Content Right Column</label>
                                            <Textarea
                                                value={settings.about.content_right}
                                                onChange={e => setSettings({ ...settings, about: { ...settings.about, content_right: e.target.value } })}
                                                className="bg-background border-white/10 min-h-[150px]"
                                                placeholder="Describe your achievements..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-white/5 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold text-white mb-1">Statistics</h3>
                                            <p className="text-sm text-white/40">Numbers displayed at the bottom of the page.</p>
                                        </div>
                                        <Button
                                            onClick={() => setSettings({
                                                ...settings,
                                                about: {
                                                    ...settings.about,
                                                    stats: [...settings.about.stats, { label: "", value: "" }]
                                                }
                                            })}
                                            variant="outline"
                                            className="border-brand/20 text-brand hover:bg-brand/10 h-9"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Stat
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {settings.about.stats.map((stat, index) => (
                                            <div key={index} className="bg-background p-4 rounded-xl border border-white/5 relative group">
                                                <button
                                                    onClick={() => {
                                                        const newStats = [...settings.about.stats]
                                                        newStats.splice(index, 1)
                                                        setSettings({ ...settings, about: { ...settings.about, stats: newStats } })
                                                    }}
                                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                                <div className="space-y-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Value</label>
                                                        <Input
                                                            value={stat.value}
                                                            onChange={e => {
                                                                const newStats = [...settings.about.stats]
                                                                newStats[index] = { ...newStats[index], value: e.target.value }
                                                                setSettings({ ...settings, about: { ...settings.about, stats: newStats } })
                                                            }}
                                                            className="bg-background border-white/10 h-9 text-lg font-bold"
                                                            placeholder="10k+"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Label</label>
                                                        <Input
                                                            value={stat.label}
                                                            onChange={e => {
                                                                const newStats = [...settings.about.stats]
                                                                newStats[index] = { ...newStats[index], label: e.target.value }
                                                                setSettings({ ...settings, about: { ...settings.about, stats: newStats } })
                                                            }}
                                                            className="bg-background border-white/10 h-8 text-xs font-medium"
                                                            placeholder="Creators"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* FAQ TAB */}
                        {activeTab === "faq" && (
                            <div className="space-y-10 max-w-4xl animate-in fade-in duration-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-lg font-bold text-white mb-1">Frequently Asked Questions</h2>
                                        <p className="text-sm text-white/40">Manage the questions and answers on your /faq page.</p>
                                    </div>
                                    <Button
                                        onClick={() => setSettings({
                                            ...settings,
                                            faq: {
                                                ...settings.faq,
                                                items: [...settings.faq.items, { q: "", a: "" }]
                                            }
                                        })}
                                        className="bg-brand text-black font-bold h-10 px-6 rounded-xl"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add FAQ Item
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {settings.faq.items.map((item, index) => (
                                        <div key={index} className="bg-background border border-white/5 rounded-2xl p-6 group relative">
                                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    disabled={index === 0}
                                                    onClick={() => {
                                                        const newItems = [...settings.faq.items]
                                                        const temp = newItems[index]
                                                        newItems[index] = newItems[index - 1]
                                                        newItems[index - 1] = temp
                                                        setSettings({ ...settings, faq: { items: newItems } })
                                                    }}
                                                    className="h-8 w-8 text-white/40 hover:text-white"
                                                >
                                                    <Loader2 className="w-4 h-4 rotate-180" /> {/* Should be Up arrow but using Loader2 as placeholder or just leave it for now */}
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        const newItems = [...settings.faq.items]
                                                        newItems.splice(index, 1)
                                                        setSettings({ ...settings, faq: { items: newItems } })
                                                    }}
                                                    className="h-8 w-8 text-red-500/50 hover:text-red-500 hover:bg-red-500/10"
                                                >
                                                    <Trash className="w-4 h-4" />
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Question</label>
                                                    <Input
                                                        value={item.q}
                                                        onChange={e => {
                                                            const newItems = [...settings.faq.items]
                                                            newItems[index] = { ...newItems[index], q: e.target.value }
                                                            setSettings({ ...settings, faq: { items: newItems } })
                                                        }}
                                                        className="bg-background border-white/10 h-11 text-white font-bold"
                                                        placeholder="e.g., How long does delivery take?"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Answer</label>
                                                    <Textarea
                                                        value={item.a}
                                                        onChange={e => {
                                                            const newItems = [...settings.faq.items]
                                                            newItems[index] = { ...newItems[index], a: e.target.value }
                                                            setSettings({ ...settings, faq: { items: newItems } })
                                                        }}
                                                        className="bg-background border-white/10 min-h-[100px] text-white/70"
                                                        placeholder="e.g., Delivery is instant and will be sent to your email immediately after payment."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {settings.faq.items.length === 0 && (
                                        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-white/5 rounded-3xl text-center">
                                            <HelpCircle className="w-12 h-12 text-white/10 mb-4" />
                                            <p className="text-white/40 font-medium">No FAQ items added yet.</p>
                                            <Button
                                                onClick={() => setSettings({
                                                    ...settings,
                                                    faq: { items: [{ q: "", a: "" }] }
                                                })}
                                                variant="outline"
                                                className="mt-4 border-white/10 text-white/60 hover:text-white"
                                            >
                                                Create your first FAQ
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* NAVBAR TAB */}
                        {activeTab === "navbar" && (
                            <div className="space-y-10 max-w-4xl animate-in fade-in duration-500">
                                <div>
                                    <h2 className="text-lg font-bold text-white mb-1">Navbar Settings</h2>
                                    <p className="text-sm text-white/40">Customize your navigation bar appearance and links.</p>
                                </div>

                                <div className="space-y-8">
                                    {/* Logo Section */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Logo</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <label className="text-sm font-bold text-white">Logo Image</label>
                                                <p className="text-xs text-white/40">Displayed in the navbar header.</p>
                                                <div className="relative group aspect-video rounded-xl bg-background border border-white/10 overflow-hidden hover:border-brand/40 transition-colors">
                                                    {settings.branding?.logo_url ? (
                                                        <>
                                                            <img
                                                                src={settings.branding.logo_url}
                                                                alt="Logo"
                                                                className="w-full h-full object-contain p-4"
                                                            />
                                                            <button
                                                                onClick={() => setSettings({ ...settings, branding: { ...settings.branding, logo_url: "" } })}
                                                                className="absolute top-2 right-2 p-1.5 bg-background/60 rounded-lg text-white/60 hover:text-white hover:bg-red-500/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20 gap-2">
                                                            <ImageIcon className="w-8 h-8" />
                                                            <span className="text-xs font-bold uppercase tracking-wider">Upload</span>
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                                                        <div className="relative">
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                disabled={uploading === "logo_url"}
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0]
                                                                    if (file) handleUpload(file, 'branding', 'logo_url')
                                                                }}
                                                                className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                                                            />
                                                            <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 pointer-events-none">
                                                                {uploading === "logo_url" ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Upload className="w-3 h-3 mr-2" />}
                                                                Choose File
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Navigation Links */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Navigation Links</h3>
                                        <p className="text-xs text-white/40 mb-4">These are the default navigation links. You can customize them in your navbar component.</p>
                                        <div className="bg-background p-6 rounded-xl border border-white/10 space-y-4">
                                            {[
                                                { label: "Store", path: "/store" },
                                                { label: "About", path: "/about" },
                                                { label: "FAQ", path: "/faq" },
                                                { label: "Feedback", path: "/feedback" },
                                                { label: "Support", path: "/support" }
                                            ].map((link, index) => (
                                                <div key={index} className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                                                    <div className="flex-1">
                                                        <p className="text-sm font-bold text-white">{link.label}</p>
                                                        <p className="text-xs text-white/40 font-mono">{link.path}</p>
                                                    </div>
                                                    <div className="text-xs text-white/20 font-mono">Default</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Social Links */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Social Links</h3>
                                        <p className="text-xs text-white/40 mb-4">Configure social media links in the Socials tab under Configure section.</p>
                                        <div className="bg-brand/5 border border-brand/10 p-4 rounded-xl flex items-start gap-3">
                                            <Info className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                                            <div className="text-xs text-white/60">
                                                Social media icons in the navbar are automatically populated from your social media settings. Go to <strong className="text-white">Configure → Socials</strong> to manage them.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* HERO TAB */}
                        {activeTab === "hero" && (
                            <div className="space-y-12 max-w-4xl animate-in fade-in duration-500 pb-20">
                                {/* HERO SECTION */}
                                <div className="space-y-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
                                            <Store className="w-5 h-5 text-brand" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-white mb-1">Hero Section</h2>
                                            <p className="text-sm text-white/40">Customize the main hero section on your landing page.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4 col-span-full">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-white">Main Title</label>
                                                <Input
                                                    value={settings.hero.title}
                                                    onChange={e => setSettings({ ...settings, hero: { ...settings.hero, title: e.target.value } })}
                                                    className="bg-background border-white/10 h-11 text-lg font-bold"
                                                    placeholder="Digital Products, Redefined."
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-white">Description</label>
                                                <Textarea
                                                    value={settings.hero.description}
                                                    onChange={e => setSettings({ ...settings, hero: { ...settings.hero, description: e.target.value } })}
                                                    className="bg-background border-white/10 min-h-[100px]"
                                                    placeholder="Describe your platform..."
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-white">Badge Label</label>
                                            <Input
                                                value={settings.hero.badge_label}
                                                onChange={e => setSettings({ ...settings, hero: { ...settings.hero, badge_label: e.target.value } })}
                                                className="bg-background border-white/10 h-11"
                                                placeholder="New"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-white">Badge Text</label>
                                            <Input
                                                value={settings.hero.badge_text}
                                                onChange={e => setSettings({ ...settings, hero: { ...settings.hero, badge_text: e.target.value } })}
                                                className="bg-background border-white/10 h-11"
                                                placeholder="Generative Surfaces"
                                            />
                                        </div>

                                        <div className="p-6 bg-[#0c1218] rounded-2xl border border-white/5 space-y-6 col-span-full">
                                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                                <Store className="w-4 h-4 text-brand" />
                                                Call to Action Buttons
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Primary Button Text</label>
                                                        <Input
                                                            value={settings.hero.cta1_text}
                                                            onChange={e => setSettings({ ...settings, hero: { ...settings.hero, cta1_text: e.target.value } })}
                                                            className="bg-background border-white/5 h-10"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Primary Button Link</label>
                                                        <Input
                                                            value={settings.hero.cta1_href}
                                                            onChange={e => setSettings({ ...settings, hero: { ...settings.hero, cta1_href: e.target.value } })}
                                                            className="bg-background border-white/5 h-10 font-mono text-xs"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Secondary Button Text</label>
                                                        <Input
                                                            value={settings.hero.cta2_text}
                                                            onChange={e => setSettings({ ...settings, hero: { ...settings.hero, cta2_text: e.target.value } })}
                                                            className="bg-background border-white/5 h-10"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Secondary Button Link</label>
                                                        <Input
                                                            value={settings.hero.cta2_href}
                                                            onChange={e => setSettings({ ...settings, hero: { ...settings.hero, cta2_href: e.target.value } })}
                                                            className="bg-background border-white/5 h-10 font-mono text-xs"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STATISTICS TAB */}
                        {activeTab === "statistics" && (
                            <div className="space-y-10 max-w-3xl animate-in fade-in duration-500">
                                <div>
                                    <h2 className="text-lg font-bold text-white mb-1">Virtual Statistics</h2>
                                    <p className="text-sm text-white/40">These base numbers are added to your live store data to make it look established.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-white">Base Sales</label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                value={settings.statistics?.base_sales || 0}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    statistics: { ...settings.statistics, base_sales: parseInt(e.target.value) || 0 }
                                                })}
                                                className="bg-background border-white/10 h-11 pl-10"
                                            />
                                            <ShoppingCart className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                        </div>
                                        <p className="text-[10px] text-white/40">Number of orders to add to actual count.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-white">Base Buyers</label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                value={settings.statistics?.base_buyers || 0}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    statistics: { ...settings.statistics, base_buyers: parseInt(e.target.value) || 0 }
                                                })}
                                                className="bg-background border-white/10 h-11 pl-10"
                                            />
                                            <Heart className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                        </div>
                                        <p className="text-[10px] text-white/40">Number of unique customers to add.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-white">Base Rating</label>
                                        <div className="relative">
                                            <Input
                                                type="text"
                                                placeholder="4.98"
                                                value={settings.statistics?.base_rating || ""}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    statistics: { ...settings.statistics, base_rating: e.target.value }
                                                })}
                                                className="bg-background border-white/10 h-11 pl-10"
                                            />
                                            <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                        </div>
                                        <p className="text-[10px] text-white/40">Fallback rating if no feedback exists.</p>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-brand/5 border border-brand/10 flex gap-3">
                                    <div className="w-5 h-5 rounded-full bg-brand/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-[10px] font-bold text-brand italic">i</span>
                                    </div>
                                    <p className="text-xs text-brand/80 leading-relaxed italic">
                                        Example: If your actual store has 10 sales and you set Base Sales to 1000,
                                        the public navbar will show 1010 Sales.
                                    </p>
                                </div>
                            </div>
                        )}


                    </div>
                </div>

                {/* Save Toolbar */}
                <div className="fixed bottom-0 left-0 lg:left-64 right-0 p-4 sm:p-6 bg-background/80 backdrop-blur-md border-t border-white/5 z-50">
                    <div className="max-w-[100rem] mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
                        <Button
                            variant="ghost"
                            className="bg-background text-white/60 hover:text-white hover:bg-[#142442] h-12 px-6 rounded-xl border border-white/5 sm:flex-1 md:max-w-[200px]"
                            onClick={() => window.location.href = '/admin/dashboard'}
                        >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                        </Button>
                        <Button
                            variant="outline"
                            className="h-12 px-6 rounded-xl border-brand text-brand hover:bg-brand/10 bg-transparent sm:flex-1 md:max-w-[200px]"
                            onClick={async () => {
                                await handleSave()
                                window.location.href = '/admin/dashboard'
                            }}
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Save & Exit
                        </Button>
                        <Button
                            onClick={handleSave}
                            className="h-12 px-8 rounded-xl bg-brand text-black font-bold hover:bg-brand/90 shadow-lg shadow-brand/20 sm:flex-1 md:max-w-[200px]"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Save
                        </Button>
                    </div>
                </div>
            </div >
        </AdminLayout >
    )
}
