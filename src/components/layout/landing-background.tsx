"use client"

import { useRef, useEffect, useState, memo } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"

export function LandingBackground() {
    const containerRef = useRef<HTMLDivElement>(null)
    const orbRefs = useRef<(HTMLDivElement | null)[]>([])
    const shouldReduceMotion = useReducedMotion()
    const [isVisible, setIsVisible] = useState(true)
    const [hasMounted, setHasMounted] = useState(false)

    // Initial mount check
    useEffect(() => {
        setHasMounted(true)
    }, [])

    // Visibility detection to pause animations when not on screen
    useEffect(() => {
        if (!containerRef.current) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting)
            },
            { threshold: 0.05 }
        )

        observer.observe(containerRef.current)
        return () => observer.disconnect()
    }, [])

    useGSAP(() => {
        if (!hasMounted || shouldReduceMotion || !isVisible) return

        orbRefs.current.forEach((orb, i) => {
            if (!orb) return

            // Complex breathing animation using GSAP for better performance than Framer Motion animate arrays
            gsap.to(orb, {
                opacity: 0.25,
                y: i % 2 === 0 ? 40 : -40,
                x: i % 3 === 0 ? 30 : -30,
                duration: 12 + (i * 3),
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
                delay: i * 2,
            })
        })
    }, { scope: containerRef, dependencies: [hasMounted, shouldReduceMotion, isVisible] })

    // Particle Logic
    const particles = Array.from({ length: 15 })

    const orbStyle = (color: string, opacity: number) => ({
        background: `radial-gradient(circle at center, ${color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
        willChange: 'transform, opacity'
    })

    return (
        <div ref={containerRef} className="absolute inset-0 pointer-events-none overflow-hidden select-none">
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

            {/* 3. Volumetric Orbs - Using #a4f8ff with Gradient instead of Blur for Performance */}
            {/* Top Left Layer */}
            <div
                ref={el => { orbRefs.current[0] = el }}
                style={orbStyle('#a4f8ff', 0.1)}
                className="absolute top-[5%] left-[10%] w-[1200px] h-[1000px] opacity-10"
            />

            {/* Middle Right Layer */}
            <div
                ref={el => { orbRefs.current[1] = el }}
                style={orbStyle('#a4f8ff', 0.15)}
                className="absolute top-1/3 -right-[15%] w-[1400px] h-[1100px] opacity-10"
            />

            {/* Center Focus (Deeper) */}
            <div
                ref={el => { orbRefs.current[2] = el }}
                style={orbStyle('#a4f8ff', 0.08)}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1600px] h-[1200px] opacity-10"
            />

            {/* Bottom Transition */}
            <div
                ref={el => { orbRefs.current[3] = el }}
                style={orbStyle('#a4f8ff', 0.12)}
                className="absolute bottom-0 left-[10%] w-[1400px] h-[900px] opacity-10"
            />

            {/* 4. Atmospheric Floating Particles - Only render on client to avoid hydration mismatch (Math.random) */}
            {hasMounted && !shouldReduceMotion && particles.map((_, i) => (
                <Particle key={i} />
            ))}

            {/* Global Atmospheric Vignette/Tint */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-20 pointer-events-none" />
            <div className="absolute inset-0 bg-[#a4f8ff]/[0.01] pointer-events-none" />
        </div>
    )
}

// Memoized particle to prevent unnecessary re-renders
const Particle = memo(() => {
    return (
        <motion.div
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
            className="absolute w-1 h-1 bg-[#a4f8ff] rounded-full"
            style={{ filter: 'blur(1px)' }} // Small blurs are fine
        />
    )
})

Particle.displayName = 'Particle'
