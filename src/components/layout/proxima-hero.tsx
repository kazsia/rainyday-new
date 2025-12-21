"use client"

import { NeonButton } from "@/components/ui/neon-button"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { motion } from "framer-motion"
import { FloatingPaths } from "@/components/ui/background-paths"
import { SparklesText } from "@/components/ui/sparkles-text"
import Link from "next/link"

export function ProximaHero() {
    return (
        <section className="relative pt-56 md:pt-72 pb-48 md:pb-64 flex flex-col items-center justify-center text-center overflow-hidden">
            {/* Animated Background Paths (Contained in Section) */}
            <div className="absolute inset-x-0 top-0 h-[600px] pointer-events-none max-w-7xl mx-auto overflow-hidden" suppressHydrationWarning>
                <FloatingPaths position={1} />
                <FloatingPaths position={-1} />
            </div>

            {/* Background Wave Effect (Subtle Overlay) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full wave-gradient pointer-events-none opacity-20" suppressHydrationWarning />

            <div className="relative z-10 max-w-5xl mx-auto px-4" suppressHydrationWarning>
                <div className="space-y-10" suppressHydrationWarning>
                    <SparklesText
                        text="Digital Products, Redefined."
                        className="text-4xl md:text-6xl font-black tracking-tight font-heading leading-[1.1] text-white"
                        colors={{ first: "#a4f8ff", second: "#26bcc4" }}
                        sparklesCount={15}
                    />

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2, duration: 1 }}
                        className="text-base md:text-lg text-white/40 max-w-2xl mx-auto leading-relaxed font-medium"
                    >
                        Rainyday connects digital creators with a global audience through secure,
                        scalable Web3 architecture and instant delivery.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.5, duration: 0.8 }}
                        className="flex flex-col items-center pt-8"
                        suppressHydrationWarning
                    >
                        <Link href="/store" className="relative rounded-full p-1 md:p-1.5 transition-transform hover:scale-105 active:scale-95 duration-300 block">
                            <GlowingEffect
                                spread={60}
                                glow={true}
                                disabled={false}
                                proximity={100}
                                inactiveZone={0.01}
                                borderWidth={3}
                            />
                            <NeonButton
                                size="lg"
                                variant="solid"
                                className="h-20 px-20 rounded-full text-2xl font-black bg-[#0a1628] border-2 border-brand/20 text-white hover:bg-brand/5 hover:border-brand/40 transition-all duration-500 tracking-widest uppercase group relative z-10"
                            >
                                EXPLORE STORE
                            </NeonButton>
                        </Link>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
