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
        <section id="faq" className="-mt-16 md:-mt-24 pb-16 md:pb-24 relative overflow-hidden">
            {/* Background with gradient glow effects */}
            <div className="absolute inset-0">
                {/* Right cyan gradient orb */}
                <motion.div
                    initial={{ opacity: 0.35 }}
                    animate={{ opacity: [0.35, 0.55, 0.35] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/3 right-[12%] w-[650px] h-[550px] bg-cyan-400/22 blur-[140px] rounded-full"
                />

                {/* Left cyan accent */}
                <motion.div
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: [0.3, 0.48, 0.3] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-1/4 left-[8%] w-[600px] h-[550px] bg-[#26bcc4]/18 blur-[130px] rounded-full"
                />

                {/* Center teal glow */}
                <motion.div
                    initial={{ opacity: 0.25 }}
                    animate={{ opacity: [0.25, 0.42, 0.25] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[500px] bg-teal-500/17 blur-[150px] rounded-full"
                />

                {/* Top left purple gradient */}
                <motion.div
                    initial={{ opacity: 0.22 }}
                    animate={{ opacity: [0.22, 0.38, 0.22] }}
                    transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
                    className="absolute top-[10%] left-[15%] w-[520px] h-[480px] bg-purple-500/14 blur-[125px] rounded-full"
                />

                {/* Bottom right blue gradient */}
                <motion.div
                    initial={{ opacity: 0.2 }}
                    animate={{ opacity: [0.2, 0.36, 0.2] }}
                    transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut", delay: 3.5 }}
                    className="absolute bottom-[8%] right-[18%] w-[500px] h-[450px] bg-blue-500/13 blur-[115px] rounded-full"
                />

                {/* Top right pink accent */}
                <motion.div
                    initial={{ opacity: 0.18 }}
                    animate={{ opacity: [0.18, 0.32, 0.18] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                    className="absolute top-[15%] right-[8%] w-[480px] h-[480px] bg-pink-500/11 blur-[110px] rounded-full"
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
