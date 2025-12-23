import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function FloatingPaths({ position }: { position: number }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const paths = useMemo(() => [
        {
            id: 1,
            d: "M0,128L48,144C96,160,192,192,288,192C384,192,480,160,576,144C672,128,768,128,864,144C960,160,1056,192,1152,192C1248,192,1344,160,1392,144L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
            color: "rgba(164, 248, 255, 0.05)",
            duration: 20 + Math.random() * 10,
        },
        {
            id: 2,
            d: "M0,160L48,176C96,192,192,224,288,224C384,224,480,192,576,176C672,160,768,160,864,176C960,192,1056,224,1152,224C1248,224,1344,192,1392,176L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
            color: "rgba(38, 188, 196, 0.03)",
            duration: 25 + Math.random() * 10,
        }
    ], []);

    if (!mounted) return <div className="absolute inset-0 w-full h-full pointer-events-none" />;

    return (
        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
            <svg
                viewBox="0 0 1440 320"
                className="w-full h-full preserve-3d"
                style={{
                    transform: `translateY(${position * 20}%) scaleY(${position})`,
                    filter: "blur(10px)"
                }}
            >
                {paths.map((path: any) => (
                    <motion.path
                        key={path.id}
                        d={path.d}
                        fill={path.color}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{
                            duration: path.duration,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </svg>
        </div>
    );
}

const fadeUpVariants: any = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 1,
            ease: [0.25, 0.4, 0.25, 1],
        },
    },
};

function ElegantShape({
    className,
    delay = 0,
    width = 400,
    height = 100,
    rotate = 0,
    gradient = "from-white/[0.08]",
}: {
    className?: string;
    delay?: number;
    width?: number;
    height?: number;
    rotate?: number;
    gradient?: string;
}) {
    return (
        <motion.div
            initial={{
                opacity: 0,
                y: -150,
                rotate: rotate - 15,
            }}
            animate={{
                opacity: 1,
                y: 0,
                rotate: rotate,
            }}
            transition={{
                duration: 2.4,
                delay,
                ease: [0.23, 0.86, 0.39, 0.96],
                opacity: { duration: 1.2 },
            } as any}
            className={cn("absolute", className)}
        >
            <motion.div
                animate={{
                    y: [0, 15, 0],
                }}
                transition={{
                    duration: 12,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                }}
                style={{
                    width,
                    height,
                }}
                className="relative"
            >
                <div
                    className={cn(
                        "absolute inset-0 rounded-full",
                        "bg-gradient-to-r to-transparent",
                        gradient,
                        "backdrop-blur-[2px] border-2 border-white/[0.15]",
                        "shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]",
                        "after:absolute after:inset-0 after:rounded-full",
                        "after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]"
                    )}
                />
            </motion.div>
        </motion.div>
    );
}

export function BackgroundPaths({
    title = "Digital Products, Redefined.",
}: {
    title?: string;
}) {
    return (
        <div className="relative min-h-[85vh] w-full flex flex-col justify-center overflow-hidden bg-[#030303]">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05] blur-3xl" />

            <div className="absolute inset-0 overflow-hidden">
                <ElegantShape
                    delay={0.3}
                    width={600}
                    height={140}
                    rotate={12}
                    gradient="from-indigo-500/[0.15]"
                    className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
                />

                <ElegantShape
                    delay={0.5}
                    width={500}
                    height={120}
                    rotate={-15}
                    gradient="from-rose-500/[0.15]"
                    className="right-[-5%] md:right-[0%] top-[70%] md:top-[75%]"
                />

                <ElegantShape
                    delay={0.4}
                    width={300}
                    height={80}
                    rotate={-8}
                    gradient="from-violet-500/[0.15]"
                    className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]"
                />

                <ElegantShape
                    delay={0.6}
                    width={200}
                    height={60}
                    rotate={20}
                    gradient="from-amber-500/[0.15]"
                    className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]"
                />

                <ElegantShape
                    delay={0.7}
                    width={150}
                    height={40}
                    rotate={-25}
                    gradient="from-cyan-500/[0.15]"
                    className="left-[20%] md:left-[25%] top-[5%] md:top-[10%]"
                />
            </div>

            <div className="relative z-10 container mx-auto px-4 md:px-6 max-w-[90rem] mt-[-5vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <motion.div
                        custom={0}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                        className="max-w-5xl flex flex-col items-start text-left"
                    >
                        <div className="space-y-2">
                            <h1 className="text-6xl sm:text-7xl md:text-8xl font-bold tracking-tighter text-white leading-[0.9] -ml-1">
                                Digital Products, <br />
                                <span className="text-[#333333]">Redefined.</span>
                            </h1>
                            <p className="text-lg md:text-xl text-white/40 max-w-xl font-normal leading-relaxed pt-8">
                                Experience the future of digital assets with our secure, instant, and premium delivery platform. No code, no hassle.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 md:mt-10">
                            <Link href="/store">
                                <Button
                                    className="h-14 px-8 rounded-full text-base font-medium bg-[#1F1F1F] text-white hover:bg-[#252525] border border-white/5 transition-all"
                                >
                                    Get Started
                                </Button>
                            </Link>
                        </div>
                    </motion.div>

                    {/* Floating Hero Logo */}
                    <div className="hidden md:flex justify-center items-center relative h-[400px]">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
                            className="relative"
                        >
                            <motion.div
                                animate={{ y: [-15, 15, -15], rotate: [-2, 2, -2] }}
                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                className="relative w-[300px] h-[300px] flex items-center justify-center p-8"
                            >
                                <div className="absolute inset-0 bg-[#a4f8ff]/5 rounded-full blur-3xl" />
                                <div className="absolute inset-0 bg-gradient-to-tr from-[#a4f8ff]/10 to-transparent rounded-full opacity-50" />
                                <img
                                    src="/logo.png"
                                    alt="RainyDay Logo"
                                    className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_25px_rgba(164,248,255,0.2)]"
                                />
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-[#030303]/80 pointer-events-none" />
        </div>
    );
}
