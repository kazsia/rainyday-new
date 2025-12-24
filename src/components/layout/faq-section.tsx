"use client"

import { HelpCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { getSiteSettings, type SiteSettings } from "@/lib/db/settings"

export function FAQSection() {
    const [settings, setSettings] = useState<SiteSettings | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const data = await getSiteSettings()
                setSettings(data)
            } catch (error) {
                console.error("Failed to load FAQ settings:", error)
            } finally {
                setIsLoading(false)
            }
        }
        loadSettings()
    }, [])

    const faqs = (settings?.faq?.items || []).slice(0, 4) // Show only first 4 on landing page
    return (
        <section id="faq" className="py-16 md:py-24 relative overflow-hidden">
            {/* Background with gradient glow effects */}
            <div className="absolute inset-0 bg-black">
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

            <div className="container mx-auto px-6 max-w-5xl relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-white/40 text-sm">
                        Explore the common questions and answers about Rainyday
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 min-h-[200px]">
                    {isLoading ? (
                        <div className="col-span-full flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="w-6 h-6 animate-spin text-white/10" />
                        </div>
                    ) : faqs.length > 0 ? (
                        faqs.map((faq, i) => (
                            <motion.div
                                key={i}
                                className="flex gap-4"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <div
                                    className="flex-shrink-0 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
                                >
                                    <HelpCircle className="w-5 h-5 text-white/40" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white mb-2">{faq.q}</h4>
                                    <p className="text-white/40 text-sm leading-relaxed">{faq.a}</p>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-8 opacity-40">
                            <p className="text-white/40 text-sm">No questions found.</p>
                        </div>
                    )}
                </div>

                <div className="text-center">
                    <p className="text-white/40 text-sm">
                        Didn't find the answer you are looking for?{" "}
                        <Link href="/support" className="text-brand hover:underline font-medium">
                            Contact our support
                        </Link>
                    </p>
                </div>
            </div>
        </section>
    )
}
