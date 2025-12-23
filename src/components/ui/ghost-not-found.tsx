'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FlowButton } from "@/components/ui/flow-button";
import { Ghost } from 'lucide-react';

const easing = [0.43, 0.13, 0.23, 0.96] as const;

const containerVariants = {
    hidden: {
        opacity: 0,
        y: 30
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.7,
            ease: easing,
            delayChildren: 0.1,
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: {
        opacity: 0,
        y: 20
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: easing
        }
    }
};

const numberVariants = {
    hidden: (direction: number) => ({
        opacity: 0,
        x: direction * 40,
        y: 15,
        rotate: direction * 5
    }),
    visible: {
        opacity: 0.7,
        x: 0,
        y: 0,
        rotate: 0,
        transition: {
            duration: 0.8,
            ease: easing
        }
    }
};

const ghostVariants: any = {
    hidden: {
        scale: 0.8,
        opacity: 0,
        y: 15,
        rotate: -5
    },
    visible: {
        scale: 1,
        opacity: 1,
        y: 0,
        rotate: 0,
        transition: {
            duration: 0.6,
            ease: easing
        }
    },
    hover: {
        scale: 1.1,
        y: -10,
        rotate: [0, -5, 5, -5, 0],
        transition: {
            duration: 0.8,
            ease: "easeInOut",
            rotate: {
                duration: 2,
                ease: "linear",
                repeat: Infinity,
                repeatType: "reverse"
            }
        }
    },
    floating: {
        y: [-5, 5],
        transition: {
            y: {
                duration: 2,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "reverse"
            }
        }
    }
};

export function GhostNotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#030303] px-4">
            <AnimatePresence mode="wait">
                <motion.div
                    className="text-center"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                >
                    <div className="flex items-center justify-center gap-4 md:gap-6 mb-8 md:mb-12">
                        <motion.span
                            className="text-[80px] md:text-[120px] font-bold text-white opacity-20 font-signika select-none"
                            variants={numberVariants}
                            custom={-1}
                        >
                            4
                        </motion.span>
                        <motion.div
                            variants={ghostVariants}
                            whileHover="hover"
                            animate={["visible", "floating"]}
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-[80px] h-[80px] md:w-[120px] md:h-[120px]"
                            >
                                <path
                                    d="M12 2C7.58172 2 4 5.58172 4 10V22L8 20L12 22L16 20L20 22V10C20 5.58172 16.4183 2 12 2Z"
                                    fill="white"
                                />
                                <path
                                    d="M9 11C9.55228 11 10 10.5523 10 10C10 9.44772 9.55228 9 9 9C8.44772 9 8 9.44772 8 10C8 10.5523 8.44772 11 9 11Z"
                                    fill="black"
                                    fillOpacity="0.8"
                                />
                                <path
                                    d="M15 11C15.5523 11 16 10.5523 16 10C16 9.44772 15.5523 9 15 9C14.4477 9 14 9.44772 14 10C14 10.5523 14.4477 11 15 11Z"
                                    fill="black"
                                    fillOpacity="0.8"
                                />
                            </svg>
                        </motion.div>
                        <motion.span
                            className="text-[80px] md:text-[120px] font-bold text-white opacity-20 font-signika select-none"
                            variants={numberVariants}
                            custom={1}
                        >
                            4
                        </motion.span>
                    </div>

                    <motion.h1
                        className="text-3xl md:text-5xl font-bold text-white mb-4 md:mb-6 opacity-90 font-dm-sans select-none"
                        variants={itemVariants}
                    >
                        Boo! Page missing!
                    </motion.h1>

                    <motion.p
                        className="text-lg md:text-xl text-white/50 mb-8 md:mb-12 font-dm-sans select-none"
                        variants={itemVariants}
                    >
                        Whoops! This page must be a ghost - it&apos;s not here!
                    </motion.p>

                    <motion.div
                        variants={itemVariants}
                        whileHover={{
                            scale: 1.05,
                            transition: {
                                duration: 0.3,
                                ease: [0.43, 0.13, 0.23, 0.96]
                            }
                        }}
                        className="flex justify-center"
                    >
                        <Link href="/">
                            <FlowButton text="Find shelter" />
                        </Link>
                    </motion.div>

                    <motion.div
                        className="mt-12"
                        variants={itemVariants}
                    >
                        <Link
                            href="#"
                            className="text-white/30 hover:text-white/60 transition-opacity underline font-dm-sans select-none"
                        >
                            What means 404?
                        </Link>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
