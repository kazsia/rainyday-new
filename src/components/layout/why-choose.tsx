"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Link2, Zap, ShieldCheck, Globe } from "lucide-react"
import { motion } from "framer-motion"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { HandWrittenTitle } from "@/components/ui/hand-writing-text"

const features = [
    {
        title: "Cross-Chain Interoperability",
        description: "Seamless integration between multiple blockchain networks.",
        icon: Link2,
    },
    {
        title: "Lightning-Fast Transactions",
        description: "Built for speed with ultra-low latency.",
        icon: Zap,
    },
    {
        title: "Smart Security Layer",
        description: "Enterprise-grade protection for all your digital assets.",
        icon: ShieldCheck,
    },
    {
        title: "Global Network",
        description: "A decentralized infrastructure spanning across the globe.",
        icon: Globe,
    },
]

export function WhyChoose() {
    return (
        <section className="py-2 relative overflow-hidden">
            <div className="container mx-auto px-4 max-w-5xl">
                <HandWrittenTitle
                    title="Why Choose Rainyday?"
                    subtitle="Built for creators, designed for scale"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {features.map((feature, i) => {
                        const Icon = feature.icon
                        return (
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
                                    <Card className="proxima-card group h-full border-none bg-black">
                                        <CardContent className="p-8 space-y-5">
                                            <div className="relative">
                                                <div className="absolute -inset-2 bg-brand-primary/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                                <motion.div
                                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                                    className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-primary/20 to-brand-accent/5 border border-brand-primary/20 flex items-center justify-center group-hover:border-brand-primary/40 group-hover:shadow-[0_0_20px_rgba(38,188,196,0.15)] transition-all duration-500 shadow-xl"
                                                >
                                                    <Icon
                                                        className="w-7 h-7 text-white"
                                                        fill="white"
                                                    />
                                                </motion.div>
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-xl font-bold tracking-tight text-white/70 group-hover:text-white transition-colors">{feature.title}</h3>
                                                <p className="text-sm text-white/30 leading-relaxed font-medium">
                                                    {feature.description}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
