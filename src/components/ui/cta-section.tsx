"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { motion } from "framer-motion"

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
        <section className={cn("relative py-24 md:py-32 overflow-hidden", className)}>
            {/* Background with gradient glow effects in brand cyan color */}
            <div className="absolute inset-0">
                {/* Main cyan gradient orb - left */}
                <motion.div
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/2 left-[15%] -translate-y-1/2 w-[600px] h-[500px] bg-[#a4f8ff]/20 blur-[150px] rounded-full"
                />

                {/* Secondary cyan orb - right */}
                <motion.div
                    initial={{ opacity: 0.25 }}
                    animate={{ opacity: [0.25, 0.4, 0.25] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute top-1/2 right-[15%] -translate-y-1/2 w-[500px] h-[450px] bg-cyan-500/20 blur-[130px] rounded-full"
                />

                {/* Center accent glow */}
                <motion.div
                    initial={{ opacity: 0.2 }}
                    animate={{ opacity: [0.2, 0.35, 0.2] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-teal-500/15 blur-[100px] rounded-full"
                />
            </div>

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

                    {/* Button with glow effect */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="pt-4"
                    >
                        <Link href={buttonHref}>
                            <Button
                                size="lg"
                                className="px-10 py-6 rounded-lg text-base font-medium bg-zinc-900 hover:bg-zinc-800 text-white border border-white/10 transition-all duration-300"
                            >
                                {buttonText}
                            </Button>
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    )
}
