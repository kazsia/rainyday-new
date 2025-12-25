"use client"

import { motion, useReducedMotion } from "framer-motion"

export function LandingBackground() {
    const shouldReduceMotion = useReducedMotion()

    // Breathing Animation Logic
    const getBreatheProps = (i: number) => ({
        animate: {
            opacity: shouldReduceMotion ? [0.15, 0.15] : [0.1, 0.25, 0.1],
            y: shouldReduceMotion ? 0 : [0, i % 2 === 0 ? 40 : -40, 0],
            x: shouldReduceMotion ? 0 : [0, i % 3 === 0 ? 30 : -30, 0],
        },
        transition: {
            duration: 12 + (i * 3),
            repeat: Infinity,
            ease: "easeInOut" as any,
            delay: i * 2,
        }
    })

    // Particle Logic
    const particles = Array.from({ length: 15 })

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
            {/* 1. Base Deep Atmosphere */}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black z-[-2]" />

            {/* 2. SVG Grain/Noise Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay z-[-1] pointer-events-none">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <filter id="noiseFilter">
                        <feTurbulence
                            type="fractalNoise"
                            baseFrequency="0.65"
                            numOctaves="3"
                            stitchTiles="stitch"
                        />
                    </filter>
                    <rect width="100%" height="100%" filter="url(#noiseFilter)" />
                </svg>
            </div>

            {/* 3. Volumetric Orbs - Using #a4f8ff */}
            {/* Top Left Layer */}
            <motion.div
                {...getBreatheProps(0)}
                className="absolute top-[5%] left-[10%] w-[1200px] h-[1000px] bg-[#a4f8ff]/[0.08] blur-[250px] rounded-full"
            >
                {/* Core Hotspot */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#a4f8ff]/10 blur-[100px] rounded-full" />
            </motion.div>

            {/* Middle Right Layer */}
            <motion.div
                {...getBreatheProps(1)}
                className="absolute top-1/3 -right-[15%] w-[1400px] h-[1100px] bg-[#a4f8ff]/[0.12] blur-[300px] rounded-full"
            >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#a4f8ff]/10 blur-[120px] rounded-full" />
            </motion.div>

            {/* Center Focus (Deeper) */}
            <motion.div
                {...getBreatheProps(2)}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1600px] h-[1200px] bg-[#a4f8ff]/[0.06] blur-[280px] rounded-full"
            />

            {/* Bottom Transition */}
            <motion.div
                {...getBreatheProps(3)}
                className="absolute bottom-0 left-[10%] w-[1400px] h-[900px] bg-[#a4f8ff]/[0.1] blur-[220px] rounded-full"
            >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#a4f8ff]/10 blur-[100px] rounded-full" />
            </motion.div>

            {/* 4. Atmospheric Floating Particles */}
            {!shouldReduceMotion && particles.map((_, i) => (
                <motion.div
                    key={i}
                    initial={{
                        x: Math.random() * 100 + "%",
                        y: Math.random() * 100 + "%",
                        opacity: 0
                    }}
                    animate={{
                        y: ["-5%", "5%"],
                        opacity: [0, 0.2, 0]
                    }}
                    transition={{
                        duration: 10 + Math.random() * 20,
                        repeat: Infinity,
                        delay: Math.random() * 10,
                        ease: "easeInOut"
                    }}
                    className="absolute w-1 h-1 bg-[#a4f8ff] blur-[1px] rounded-full"
                />
            ))}

            {/* Global Atmospheric Vignette/Tint */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-20 pointer-events-none" />
            <div className="absolute inset-0 bg-[#a4f8ff]/[0.01] pointer-events-none" />
        </div>
    )
}
