"use client"

import Link from "next/link"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Home, ArrowLeft } from "lucide-react"

export default function NotFound() {
    return (
        <MainLayout>
            <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-primary/10 blur-[120px] rounded-full -z-10" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center space-y-8"
                >
                    <div className="space-y-2">
                        <h1 className="text-[120px] font-black leading-none tracking-tighter text-white/5 italic">
                            404
                        </h1>
                        <h2 className="text-4xl font-black text-white uppercase tracking-widest">
                            Lost in the Void
                        </h2>
                    </div>

                    <p className="text-white/40 max-w-md mx-auto leading-relaxed">
                        The page you are looking for doesn't exist or has been moved to another dimension.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Link href="/">
                            <Button className="h-14 px-10 bg-brand-primary hover:bg-brand-accent text-black font-black uppercase tracking-widest rounded-2xl gap-3 shadow-xl shadow-brand-primary/20 transition-all active:scale-95">
                                <Home className="w-5 h-5" />
                                Go Home
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            onClick={() => window.history.back()}
                            className="h-14 px-10 bg-white/[0.02] border-white/5 text-white/60 hover:text-white hover:bg-white/[0.05] font-black uppercase tracking-widest rounded-2xl gap-3 transition-all active:scale-95"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Go Back
                        </Button>
                    </div>
                </motion.div>
            </div>
        </MainLayout>
    )
}
