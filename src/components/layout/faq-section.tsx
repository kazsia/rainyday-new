"use client"

import { HelpCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useSiteSettingsWithDefaults } from "@/context/site-settings-context"
import { HandWrittenTitle } from "@/components/ui/hand-writing-text"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { Card, CardContent } from "@/components/ui/card"

export function FAQSection() {
    const { settings, isLoading } = useSiteSettingsWithDefaults()

    const faqs = (settings?.faq?.items || []).slice(0, 4) // Show only first 4 on landing page
    return (
        <section id="faq" className="py-16 md:py-24 relative overflow-visible">
            <div className="container mx-auto px-4 max-w-6xl relative z-10">
                <div className="mb-12">
                    <HandWrittenTitle
                        title="Frequently Asked Questions"
                        subtitle="Got Questions?"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 min-h-[200px]">
                    {isLoading ? (
                        <div className="col-span-full flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="w-6 h-6 animate-spin text-white/10" />
                        </div>
                    ) : faqs.length > 0 ? (
                        faqs.map((faq, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-white/10 p-1 md:p-1.5">
                                    <GlowingEffect
                                        spread={40}
                                        glow={true}
                                        disabled={false}
                                        proximity={64}
                                        inactiveZone={0.01}
                                        borderWidth={2}
                                    />
                                    <Card className="proxima-card group h-full border-none bg-white/[0.02]">
                                        <CardContent className="p-8 space-y-5">
                                            <div className="flex gap-4">
                                                <div className="flex-shrink-0 relative">
                                                    <div className="absolute -inset-2 bg-brand-primary/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                                    <div className="relative w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-brand-primary/40 group-hover:shadow-[0_0_20px_rgba(38,188,196,0.15)] transition-all duration-500 shadow-xl">
                                                        <HelpCircle className="w-5 h-5 text-white/40 group-hover:text-brand-primary transition-colors" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <h4 className="font-bold text-white group-hover:text-brand-primary transition-colors">{faq.q}</h4>
                                                    <p className="text-white/40 text-sm leading-relaxed group-hover:text-white/60 transition-colors">{faq.a}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
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
