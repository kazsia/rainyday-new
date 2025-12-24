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

            <div className="container mx-auto px-6 max-w-5xl">
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
