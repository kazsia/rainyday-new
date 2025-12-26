"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { motion } from "framer-motion"
import { LiquidButton } from "@/components/ui/liquid-button"

interface CTAProps {
    title?: string
    description?: string
    buttonText?: string
    buttonHref?: string
    className?: string
}

export function CTASection({
    title = "Ready to dive into crypto trading?",
    description = "Connect with our Discord community and experience hassle-free cryptocurrency exchanges today!",
    buttonText = "Get Started",
    buttonHref = "/store",
    className,
}: CTAProps) {
    return (
        <section className={cn("relative py-24 md:py-32 overflow-visible", className)}>
            {/* Content */}
            <div className="relative z-10 container mx-auto px-6 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center space-y-6"
                >
                    {/* Headline */}
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                        {title}
                    </h2>

                    {/* Description */}
                    <p className="text-white/60 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
                        {description}
                    </p>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="pt-4 flex justify-center"
                    >
                        <Link href={buttonHref}>
                            <LiquidButton
                                text={buttonText}
                                className="w-48 h-14" // Increased size for CTA
                            />
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    )
}
