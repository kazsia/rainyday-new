"use client"

import { motion } from "framer-motion"
import { GooeyText } from "@/components/ui/gooey-text-morphing"


interface HowItWorksProps {
    title?: string
    texts?: string[]
    steps?: {
        title: string
        description: string
    }[]
}

export function HowItWorks({
    title = "Shopping made simple in three easy steps!",
    texts = ["How It Works", "Simple Process", "Easy Steps"],
    steps = [
        {
            title: "Select a product",
            description: "Explore a wide range of products, tailored to meet your needs. Simply click on the item you desire to learn more."
        },
        {
            title: "Pay the invoice",
            description: "Proceed to checkout where you can review your selected items and total cost. Choose from multiple payment options."
        },
        {
            title: "Receive Product",
            description: "Once your payment is confirmed, we'll process and ship your order promptly. Enjoy your new purchase!"
        }
    ]
}: HowItWorksProps) {
    return (
        <section className="py-16 md:py-24 relative overflow-hidden">
            {/* Background with gradient glow effects */}
            <div className="absolute inset-0">
                {/* Center cyan gradient orb */}
                <motion.div
                    initial={{ opacity: 0.25 }}
                    animate={{ opacity: [0.25, 0.4, 0.25] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-teal-500/15 blur-[130px] rounded-full"
                />

                {/* Left accent */}
                <motion.div
                    initial={{ opacity: 0.2 }}
                    animate={{ opacity: [0.2, 0.3, 0.2] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute bottom-1/4 left-[15%] w-[400px] h-[350px] bg-[#a4f8ff]/10 blur-[100px] rounded-full"
                />
            </div>

            <div className="container mx-auto px-4 max-w-6xl relative z-10">
                <div className="text-center space-y-4 mb-16">
                    <GooeyText
                        texts={texts}
                        morphTime={1.5}
                        cooldownTime={2}
                        className="h-16 md:h-20"
                        textClassName="font-heading tracking-tight"
                    />
                    <p className="text-white/30 text-base font-medium pt-4">
                        {title}
                    </p>
                </div>

                <div className="relative">
                    {/* Connection Line (SVG) */}
                    <div className="absolute top-12 left-0 w-full hidden md:block pointer-events-none">
                        <svg width="100%" height="100" viewBox="0 0 1000 100" fill="none" preserveAspectRatio="none">
                            <motion.path
                                d="M 100 50 Q 250 10, 400 50 T 700 50 T 900 50"
                                stroke="currentColor"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeDasharray="0 15"
                                className="text-brand-primary/20"
                                initial={{ pathLength: 0, opacity: 0 }}
                                whileInView={{ pathLength: 1, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 2, ease: "easeInOut" }}
                            />
                        </svg>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
                        {steps.map((step, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.2, duration: 0.8 }}
                                className="flex flex-col items-center text-center space-y-8"
                            >
                                {/* Number Circle */}
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full bg-brand-primary flex items-center justify-center text-black text-3xl font-black">
                                        {i + 1}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-2xl font-bold tracking-tight text-white/90">
                                        {step.title}
                                    </h3>
                                    <p className="text-white/30 leading-relaxed font-medium text-sm md:text-base">
                                        {step.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
