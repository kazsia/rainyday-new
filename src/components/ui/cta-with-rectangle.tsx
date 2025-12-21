"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { SparklesText } from "@/components/ui/sparkles-text"
import { motion } from "framer-motion"
import { Vortex } from "@/components/ui/vortex"

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
    className?: string
}

export function CTASection({
    badge,
    title,
    description,
    action,
    className,
}: CTAProps) {
    return (
        <section className={cn("relative overflow-hidden bg-[#0a1628]", className)}>
            <Vortex
                backgroundColor="#0a1628"
                rangeY={120}
                particleCount={150}
                baseHue={180}
                baseSpeed={0.1}
                rangeSpeed={0.5}
                containerClassName="py-24 md:py-32"
                className="flex flex-col items-center justify-center px-4 md:px-10 w-full h-full"
            >
                {/* Border Frame - "The Rectangle thing" */}
                <div className="absolute inset-4 md:inset-8 rounded-[2.5rem] border border-[#a4f8ff]/10 pointer-events-none z-20" />

                <div className="relative z-10 container mx-auto px-4 max-w-4xl">
                    <div className="flex flex-col items-center gap-10 text-center" suppressHydrationWarning>
                        {/* Badge */}
                        {badge && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                            >
                                <Badge
                                    variant="outline"
                                    className="bg-[#a4f8ff]/5 border-[#a4f8ff]/20 text-[#a4f8ff] px-4 py-1.5 h-auto text-[10px] font-black uppercase tracking-[0.25em] rounded-full"
                                >
                                    {badge.text}
                                </Badge>
                            </motion.div>
                        )}

                        {/* Title */}
                        <div className="space-y-6">
                            <SparklesText
                                text={title.toUpperCase()}
                                className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-tight italic"
                                colors={{ first: "#a4f8ff", second: "#ffffff" }}
                            />

                            {/* Description */}
                            {description && (
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.1 }}
                                    className="text-white/40 max-w-2xl mx-auto text-base md:text-lg font-medium leading-relaxed"
                                >
                                    {description}
                                </motion.p>
                            )}
                        </div>

                        {/* Action Button */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                        >
                            <Button
                                asChild
                                variant="outline"
                                className="h-16 md:h-20 px-10 md:px-14 rounded-2xl text-base md:text-lg font-black uppercase tracking-[0.2em] bg-white/[0.02] text-white border-white/10 hover:bg-white/5 hover:border-[#a4f8ff]/30 hover:text-[#a4f8ff] transition-all hover:scale-105 shadow-2xl hover:shadow-[#a4f8ff]/10"
                            >
                                <Link href={action.href}>{action.text}</Link>
                            </Button>
                        </motion.div>
                    </div>
                </div>
            </Vortex>
        </section>
    )
}
