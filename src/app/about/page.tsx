"use client"

import { ProximaLayout } from "@/components/layout/proxima-layout"
import { motion } from "framer-motion"
import { SparklesText } from "@/components/ui/sparkles-text"

export default function AboutPage() {
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
                        <h2 className="text-brand text-sm font-black uppercase tracking-[0.3em]">Our Story</h2>
                        <SparklesText
                            text="Empowering Digital Creators"
                            className="text-5xl md:text-7xl font-black tracking-tight"
                            colors={{ first: "#a4f8ff", second: "#26bcc4" }}
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-12 text-white/60 leading-relaxed text-lg">
                        <div className="space-y-6">
                            <p>
                                Rainyday was founded with a simple mission: to bridge the gap between
                                digital creators and their global audience. We believe that digital
                                assets should be as secure and tangible as physical ones.
                            </p>
                            <p>
                                Our platform leverages cutting-edge Web3 technology to ensure that
                                every transaction is transparent, secure, and instantaneous.
                                No more waiting for manual approvals or dealing with complex delivery systems.
                            </p>
                        </div>
                        <div className="space-y-6">
                            <p>
                                Since our inception, we've helped thousands of creators monetize their
                                work and reach customers in over 150 countries. Our commitment to
                                innovation drives us to constantly improve our infrastructure.
                            </p>
                            <p>
                                Whether you're a seasoned developer or a first-time collector,
                                Rainyday provides the tools you need to succeed in the digital economy.
                            </p>
                        </div>
                    </div>

                    <div className="pt-12 border-t border-white/5">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                            {[
                                { label: "Creators", value: "10k+" },
                                { label: "Transactions", value: "1M+" },
                                { label: "Countries", value: "150+" },
                                { label: "Uptime", value: "99.9%" },
                            ].map((stat, i) => (
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
