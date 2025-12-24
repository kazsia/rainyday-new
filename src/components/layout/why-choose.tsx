import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { HandWrittenTitle } from "@/components/ui/hand-writing-text"
import {
    Zap,
    Shield,
    Globe,
    Star,
    Cpu,
    ZapOff,
    Activity,
    Clock,
    Lock,
    Rocket,
    Cloud,
    Download,
    Eye,
    LifeBuoy,
    MousePointer2,
    Palette,
    Settings,
    Smartphone,
    Trophy,
    Users
} from "lucide-react"

const ICON_MAP: Record<string, any> = {
    Zap,
    Shield,
    Globe,
    Star,
    Cpu,
    ZapOff,
    Activity,
    Clock,
    Lock,
    Rocket,
    Cloud,
    Download,
    Eye,
    LifeBuoy,
    MousePointer2,
    Palette,
    Settings,
    Smartphone,
    Trophy,
    Users
}

interface WhyChooseProps {
    title?: string
    subtitle?: string
    features?: {
        title: string
        description: string
        icon: string
    }[]
}

export function WhyChoose({
    title = "The Ultimate Ecosystem",
    subtitle = "Why Choose Rainyday?",
    features = []
}: WhyChooseProps) {
    return (
        <section className="py-16 md:py-24 relative overflow-hidden">
            {/* Background with gradient glow effects */}
            <div className="absolute inset-0">
                {/* Top left cyan gradient orb */}
                <motion.div
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[5%] left-[5%] w-[600px] h-[500px] bg-[#26bcc4]/20 blur-[140px] rounded-full"
                />

                {/* Center purple/pink gradient orb */}
                <motion.div
                    initial={{ opacity: 0.2 }}
                    animate={{ opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-500/15 blur-[130px] rounded-full"
                />

                {/* Right cyan orb */}
                <motion.div
                    initial={{ opacity: 0.25 }}
                    animate={{ opacity: [0.25, 0.45, 0.25] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute top-1/2 right-[8%] w-[550px] h-[550px] bg-cyan-400/20 blur-[120px] rounded-full"
                />

                {/* Bottom left teal gradient */}
                <motion.div
                    initial={{ opacity: 0.2 }}
                    animate={{ opacity: [0.2, 0.35, 0.2] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 3 }}
                    className="absolute bottom-[10%] left-[15%] w-[450px] h-[450px] bg-teal-500/15 blur-[110px] rounded-full"
                />

                {/* Bottom right blue gradient */}
                <motion.div
                    initial={{ opacity: 0.15 }}
                    animate={{ opacity: [0.15, 0.3, 0.15] }}
                    transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                    className="absolute bottom-[5%] right-[20%] w-[400px] h-[400px] bg-blue-500/12 blur-[100px] rounded-full"
                />

                {/* Top right pink gradient */}
                <motion.div
                    initial={{ opacity: 0.18 }}
                    animate={{ opacity: [0.18, 0.32, 0.18] }}
                    transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
                    className="absolute top-[15%] right-[12%] w-[480px] h-[480px] bg-pink-500/12 blur-[115px] rounded-full"
                />

                {/* Middle left emerald gradient */}
                <motion.div
                    initial={{ opacity: 0.16 }}
                    animate={{ opacity: [0.16, 0.28, 0.16] }}
                    transition={{ duration: 6.8, repeat: Infinity, ease: "easeInOut", delay: 3.5 }}
                    className="absolute top-1/2 left-[8%] w-[420px] h-[420px] bg-emerald-500/10 blur-[105px] rounded-full"
                />
            </div>

            <div className="container mx-auto px-4 max-w-6xl relative z-10">
                <HandWrittenTitle
                    title={subtitle}
                    subtitle={title}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {features.map((feature, i) => {
                        // Dynamically resolve icon from map
                        const IconComponent = ICON_MAP[feature.icon] || Zap

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
                                    <Card className="proxima-card group h-full border-none bg-white/[0.02]">
                                        <CardContent className="p-8 space-y-5">
                                            <div className="relative">
                                                <div className="absolute -inset-2 bg-brand-primary/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                                <motion.div
                                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                                    className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-primary/20 to-brand-accent/5 border border-brand-primary/20 flex items-center justify-center group-hover:border-brand-primary/40 group-hover:shadow-[0_0_20px_rgba(38,188,196,0.15)] transition-all duration-500 shadow-xl"
                                                >
                                                    <IconComponent
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
