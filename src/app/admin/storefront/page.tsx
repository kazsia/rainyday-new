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
    HelpCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { getSiteSettings, updateSiteSettings, uploadAsset, type SiteSettings } from "@/lib/db/settings"
import { toast } from "sonner"
import Image from "next/image"

const TABS = [
    { id: "identity", label: "Identity", icon: Store },
    { id: "socials", label: "Socials", icon: Heart },
    { id: "checkout", label: "Checkout", icon: ShoppingCart },
    { id: "feedbacks", label: "Feedbacks", icon: Star },
    { id: "legal", label: "Legal Pages", icon: FileText },
    { id: "integrations", label: "Integrations", icon: Plug },
    { id: "notifications", label: "Notifications", icon: Bell },
]

export default function AdminStorefrontPage() {
    const [activeTab, setActiveTab] = useState("identity")
    const [isLoading, setIsLoading] = useState(true)
    const [settings, setSettings] = useState<SiteSettings>({
        general: { name: "", description: "" },
        branding: {},
        seo: { title_template: "" },
        socials: {},
        checkout: { show_coupon: true, show_terms: true, show_newsletter: false },
        feedbacks: { enable_automatic: true, hide_on_main: false },
        legal: { terms_of_service: "", privacy_policy: "" },
        integrations: {},
        notifications: { webhook_url: "", notify_on_sale: true, notify_on_ticket: true },
        dns: { records: [] }
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
                updateSiteSettings('notifications', settings.notifications)
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
                    <Button onClick={handleSave} className="bg-brand text-black font-bold hover:bg-brand/90 sm:w-auto w-full">
                        <Save className="w-4 h-4 mr-2" />
                        Save
                    </Button>
                </div>

                <div className="flex flex-col md:grid md:grid-cols-12 gap-6 lg:gap-8 pb-32">
                    {/* Sidebar / Tabs */}
                    <div className="col-span-12 md:col-span-3 lg:col-span-2">
                        <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                            {TABS.map((tab) => (
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
                                            className="bg-[#0a1628] border-white/10 h-11"
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
                                                <div className="relative group aspect-video rounded-xl bg-[#0a1628] border border-white/10 overflow-hidden hover:border-brand/40 transition-colors">
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
                                                                className="absolute top-2 right-2 p-1.5 bg-[#0a1628]/60 rounded-lg text-white/60 hover:text-white hover:bg-red-500/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
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
                                                    <div className="absolute inset-0 bg-[#0a1628]/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
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
                                            className="bg-[#0a1628] border-white/10 min-h-[100px]"
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
                                                className="bg-[#0a1628] border-white/10 h-11"
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
                                <div className="space-y-8 bg-[#0a1628] p-6 rounded-xl border border-white/5">
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

                                <div className="bg-[#0a1628] p-6 rounded-xl border border-white/5 space-y-8">
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
                                        <div className="bg-[#0a1628] border border-white/10 rounded-lg overflow-hidden">
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
                                                className="bg-[#0a1628] border-white/10 h-11"
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
                                                className="bg-[#0a1628] border-white/10 h-11 font-mono text-xs text-brand"
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
                            <div className="space-y-10 max-w-3xl animate-in fade-in duration-500">
                                <div>
                                    <h2 className="text-lg font-bold text-white mb-1">Notifications</h2>
                                    <p className="text-sm text-white/40">Integrate webhooks to receive real-time updates.</p>
                                </div>
                                <div className="space-y-8 bg-[#0a1628] p-6 rounded-xl border border-white/5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-white">Discord Webhook URL</label>
                                        <p className="text-xs text-white/40 mb-2">Receive notifications about sales and tickets directly in your Discord channel.</p>
                                        <Input
                                            value={settings.notifications.webhook_url}
                                            onChange={e => setSettings({ ...settings, notifications: { ...settings.notifications, webhook_url: e.target.value } })}
                                            className="bg-[#0a1628] border-white/10 h-11 font-mono text-xs"
                                            placeholder="https://discord.com/api/webhooks/..."
                                        />
                                    </div>

                                    <div className="pt-4 border-t border-white/5 space-y-6">
                                        {[
                                            { label: "Notify on Sale", desc: "Send a notification when a new order is paid.", field: "notify_on_sale" },
                                            { label: "Notify on Ticket", desc: "Send a notification when a new support ticket is created.", field: "notify_on_ticket" }
                                        ].map((item) => (
                                            <div key={item.field} className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <label className="text-sm font-bold text-white">{item.label}</label>
                                                    <p className="text-xs text-white/40">{item.desc}</p>
                                                </div>
                                                <Switch
                                                    checked={settings.notifications[item.field as "notify_on_sale" | "notify_on_ticket"]}
                                                    onCheckedChange={val => setSettings({ ...settings, notifications: { ...settings.notifications, [item.field]: val } })}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* OTHER TABS (Placeholder) */}
                        {!["identity", "socials", "checkout", "feedbacks", "legal", "integrations", "notifications"].includes(activeTab) && (
                            <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-4 animate-in fade-in zoom-in duration-300">
                                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                                    {(() => {
                                        const Icon = TABS.find(t => t.id === activeTab)?.icon
                                        return Icon ? <Icon className="w-8 h-8 text-white/20" /> : null
                                    })()}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Coming Soon</h3>
                                    <p className="text-sm text-white/40">The {TABS.find(t => t.id === activeTab)?.label} settings are under development.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Save Toolbar */}
                <div className="fixed bottom-0 left-0 lg:left-64 right-0 p-4 sm:p-6 bg-[#0a1628]/80 backdrop-blur-md border-t border-white/5 z-50">
                    <div className="max-w-[100rem] mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
                        <Button
                            variant="ghost"
                            className="bg-[#0a1628] text-white/60 hover:text-white hover:bg-[#142442] h-12 px-6 rounded-xl border border-white/5 sm:flex-1 md:max-w-[200px]"
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
            </div>
        </AdminLayout>
    )
}


