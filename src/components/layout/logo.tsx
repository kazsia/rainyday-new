"use client"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useSiteSettingsWithDefaults } from "@/context/site-settings-context"

interface LogoProps {
    className?: string
    variant?: "default" | "footer"
}

export function Logo({ className, variant = "default" }: LogoProps) {
    const { settings } = useSiteSettingsWithDefaults()

    const logoUrl = variant === "footer"
        ? (settings?.branding.footer_logo_url || settings?.branding.logo_url)
        : settings?.branding.logo_url

    const siteName = settings?.general.name || "Rainyday"

    return (
        <Link href="/" className={cn("flex items-center gap-3 group", className)} suppressHydrationWarning>
            <div className="relative w-10 h-10 shrink-0" suppressHydrationWarning>
                {logoUrl ? (
                    <Image
                        src={logoUrl}
                        alt={siteName}
                        fill
                        sizes="40px"
                        className="object-contain transition-transform group-hover:scale-110 duration-500"
                    />
                ) : (
                    <Image
                        src="/logo.png"
                        alt={siteName}
                        fill
                        sizes="40px"
                        className="object-contain transition-transform group-hover:scale-110 duration-500"
                    />
                )}
                <div className="absolute inset-0 bg-brand-primary/20 blur-2xl rounded-full -z-10 group-hover:bg-brand-primary/40 transition-colors" suppressHydrationWarning />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase text-[#a4f8ff] truncate max-w-[200px]" suppressHydrationWarning>
                {siteName}
            </span>
        </Link>
    )
}
