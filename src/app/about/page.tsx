"use client"

import { ProximaLayout } from "@/components/layout/proxima-layout"
import { motion } from "framer-motion"
import { SparklesText } from "@/components/ui/sparkles-text"
import { useEffect, useState } from "react"
import { getSiteSettings, SiteSettings } from "@/lib/db/settings"

export default function AboutPage() {
    const [settings, setSettings] = useState<SiteSettings | null>(null)

    useEffect(() => {
        async function loadSettings() {
            const s = await getSiteSettings()
            setSettings(s)
        }
        loadSettings()
    }, [])

    if (!settings) return null // Or a loading skeleton

    const { about } = settings

    return (
        <ProximaLayout>
            <div className="container mx-auto px-6 py-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-4xl mx-auto space-y-12"
                >
                    <div className="space-y-4">
                        <h2 className="text-brand text-sm font-black uppercase tracking-[0.3em]">{about.subtitle}</h2>
                        <SparklesText
                            text={about.title}
                            className="text-5xl md:text-7xl font-black tracking-tight"
                            colors={{ first: "#a4f8ff", second: "#26bcc4" }}
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-12 text-white/60 leading-relaxed text-lg whitespace-pre-line">
                        <div className="space-y-6">
                            <p>{about.content_left}</p>
                        </div>
                        <div className="space-y-6">
                            <p>{about.content_right}</p>
                        </div>
                    </div>

                    <div className="pt-12 border-t border-white/5">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                            {about.stats.map((stat, i) => (
                                <div key={i} className="space-y-2">
                                    <p className="text-3xl font-black text-white">{stat.value}</p>
                                    <p className="text-xs font-bold text-white/20 uppercase tracking-widest">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </ProximaLayout>
    )
}
