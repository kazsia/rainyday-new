"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { NeonButton } from "@/components/ui/neon-button"
import { cn } from "@/lib/utils"

interface CTAProps {
    badge?: {
        text: string
    }
    title: string
    description?: string
    action: {
        text: string
        href: string
        variant?: "default" | "glow"
    }
    withGlow?: boolean
    className?: string
}

export function CTASection({
    badge,
    title,
    description,
    action,
    withGlow = true,
    className,
}: CTAProps) {
    return (
        <section className={cn("relative overflow-hidden pt-0 md:pt-0 bg-background", className)}>
            <div className="relative mx-auto flex max-w-container flex-col items-center gap-6 px-8 py-12 text-center sm:gap-8 md:py-24" suppressHydrationWarning>
                {/* Badge */}
                {badge && (
                    <Badge
                        variant="outline"
                        className="opacity-0 animate-fade-in-up delay-100"
                    >
                        <span className="text-[#a4f8ff]">{badge.text}</span>
                    </Badge>
                )}

                {/* Title */}
                <h2 className="text-4xl font-black sm:text-7xl opacity-0 animate-fade-in-up delay-200 tracking-tighter uppercase italic text-white leading-tight">
                    {title.split(' ').map((word, i) => (
                        <span key={i} className={i > 2 ? "text-[#a4f8ff]" : ""}>{word} </span>
                    ))}
                </h2>

                {/* Description */}
                {description && (
                    <p className="text-white/40 max-w-2xl text-lg font-medium opacity-0 animate-fade-in-up delay-300 leading-relaxed">
                        {description}
                    </p>
                )}

                {/* Action Button */}
                <Button
                    variant={(action.variant === "glow" ? "default" : action.variant) as any || "default"}
                    size="lg"
                    className="opacity-0 animate-fade-in-up delay-500 h-16 px-10 rounded-2xl text-lg font-black uppercase tracking-widest bg-[#a4f8ff] text-black hover:bg-[#a4f8ff]/90 transition-all hover:scale-105"
                    asChild
                >
                    <a href={action.href}>{action.text}</a>
                </Button>

                {/* Glow Effect */}
                {withGlow && (
                    <div className="fade-top-lg pointer-events-none absolute inset-0 rounded-2xl shadow-glow opacity-0 animate-scale-in delay-700" />
                )}
            </div>
        </section>
    )
}
