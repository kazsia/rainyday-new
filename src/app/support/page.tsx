"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MessageCircle, Mail, HelpCircle, FileText, ShieldCheck, ArrowRight, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { useSiteSettingsWithDefaults } from "@/context/site-settings-context"

// Custom icons for social platforms
function DiscordIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
    return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
    )
}

function TelegramIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
    return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
    )
}

function YouTubeIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
    return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
    )
}

export default function SupportPage() {
    const { settings } = useSiteSettingsWithDefaults()

    const socialLinks = [
        {
            name: "Discord",
            url: settings?.socials?.discord_url,
            icon: DiscordIcon,
            color: "#5865F2",
            description: "Join our community"
        },
        {
            name: "Telegram",
            url: settings?.socials?.telegram_url,
            icon: TelegramIcon,
            color: "#229ED9",
            description: "Get instant updates"
        },
        {
            name: "YouTube",
            url: settings?.socials?.youtube_url,
            icon: YouTubeIcon,
            color: "#FF0000",
            description: "Watch our content"
        },
    ].filter(link => link.url)

    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                <div className="text-center mb-12 space-y-4">
                    <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">Support Center</h1>
                    <p className="text-white/40 max-w-md mx-auto">We're here to help you with any questions or issues you may have.</p>
                </div>

                {/* Social Links Section */}
                {socialLinks.length > 0 && (
                    <div className="mb-16">
                        <h2 className="text-center text-sm font-black text-white/30 uppercase tracking-[0.3em] mb-6">Connect With Us</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.name}
                                    href={social.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-white/20 transition-all group flex items-center gap-4"
                                >
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center transition-all group-hover:scale-110"
                                        style={{ backgroundColor: `${social.color}20` }}
                                    >
                                        <social.icon className="w-6 h-6" style={{ color: social.color }} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-white">{social.name}</h3>
                                        <p className="text-xs text-white/30">{social.description}</p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/60 group-hover:translate-x-1 transition-all ml-auto" />
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex justify-center mb-16">
                    <Card className="bg-white/[0.02] border-white/5 hover:border-brand-primary/30 transition-all group rounded-[2.5rem] overflow-hidden max-w-md w-full">
                        <CardContent className="p-10 flex flex-col items-center text-center gap-6">
                            <div className="p-5 rounded-[1.5rem] bg-brand-primary/10 text-brand-primary group-hover:scale-110 transition-transform duration-500">
                                <Mail className="w-10 h-10" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white mb-2">Email Support</h3>
                                <p className="text-white/40 mb-8 text-sm leading-relaxed">Send us a ticket and our team will get back to you within 24 hours.</p>
                                <Link href="/support/ticket" className="w-full">
                                    <Button className="w-full h-14 font-black uppercase tracking-widest bg-brand-primary text-black hover:bg-brand-accent rounded-2xl shadow-xl shadow-brand-primary/20">
                                        Send Email
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                    <Link href="/faq" className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-brand-primary/30 transition-all group flex flex-col gap-4">
                        <HelpCircle className="w-8 h-8 text-brand-primary/40 group-hover:text-brand-primary transition-colors" />
                        <div>
                            <h3 className="text-xl font-black text-white">F.A.Q</h3>
                            <p className="text-white/30 text-xs font-medium leading-relaxed">Quick answers to the most common questions.</p>
                        </div>
                    </Link>
                    <Link href="/feedback" className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-brand-primary/30 transition-all group flex flex-col gap-4">
                        <MessageCircle className="w-8 h-8 text-brand-primary/40 group-hover:text-brand-primary transition-colors" />
                        <div>
                            <h3 className="text-xl font-black text-white">Feedback</h3>
                            <p className="text-white/30 text-xs font-medium leading-relaxed">Share your experience and suggestions with us.</p>
                        </div>
                    </Link>
                    <Link href="/cart" className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-brand-primary/30 transition-all group flex flex-col gap-4">
                        <ShoppingCart className="w-8 h-8 text-brand-primary/40 group-hover:text-brand-primary transition-colors" />
                        <div>
                            <h3 className="text-xl font-black text-white">Cart Overview</h3>
                            <p className="text-white/30 text-xs font-medium leading-relaxed">Review your items before proceeding to checkout.</p>
                        </div>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Link href="/terms" className="flex items-center justify-between p-8 rounded-[2rem] bg-background border border-white/5 hover:border-white/20 transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-white/40 group-hover:text-white transition-colors" />
                            </div>
                            <span className="font-bold text-white tracking-tight">Terms of Service</span>
                        </div>
                        <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
                    </Link>
                    <Link href="/privacy" className="flex items-center justify-between p-8 rounded-[2rem] bg-background border border-white/5 hover:border-white/20 transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                                <ShieldCheck className="w-6 h-6 text-white/40 group-hover:text-white transition-colors" />
                            </div>
                            <span className="font-bold text-white tracking-tight">Privacy Policy</span>
                        </div>
                        <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
                    </Link>
                </div>
            </div>
        </MainLayout>
    )
}
