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
        <section className="pt-8 md:pt-12 pb-16 md:pb-24 relative overflow-hidden">
            {/* Background with gradient glow effects */}
            <div className="absolute inset-0">
                {/* Left cyan gradient orb */}
                <motion.div
                    initial={{ opacity: 0.2 }}
                    animate={{ opacity: [0.2, 0.35, 0.2] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/4 left-[10%] w-[500px] h-[400px] bg-[#a4f8ff]/15 blur-[120px] rounded-full"
                />

                {/* Right cyan orb */}
                <motion.div
                    initial={{ opacity: 0.15 }}
                    animate={{ opacity: [0.15, 0.3, 0.15] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                    className="absolute top-1/2 right-[10%] w-[450px] h-[450px] bg-cyan-500/15 blur-[110px] rounded-full"
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
