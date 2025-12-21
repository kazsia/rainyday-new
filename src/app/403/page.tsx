"use client"

import Link from "next/link"
import { ShieldAlert, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ForbiddenPage() {
    return (
        <div className="min-h-screen bg-[#0a1628] flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/10 via-black to-black">
            <div className="max-w-md w-full text-center space-y-8">
                <div className="relative inline-block">
                    <div className="absolute inset-0 bg-red-500 blur-[60px] opacity-20" />
                    <div className="relative bg-[#0a1628]/40 border border-red-500/20 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                        <ShieldAlert className="w-12 h-12 text-red-500" />
                    </div>
                </div>

                <div className="space-y-4 relative">
                    <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase sm:text-5xl">
                        Access <span className="text-red-500">Denied</span>
                    </h1>
                    <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-xs leading-relaxed">
                        You do not have the required administrative permissions to access this restricted sector.
                    </p>
                </div>

                <div className="pt-8">
                    <Link href="/">
                        <Button className="bg-white text-black font-black uppercase tracking-widest italic px-10 h-14 rounded-2xl hover:bg-white/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                            <ArrowLeft className="w-4 h-4 mr-3" />
                            Return to Base
                        </Button>
                    </Link>
                </div>

                <div className="pt-10 border-t border-white/5">
                    <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.3em] italic">
                        Security Protocol Error 403
                    </p>
                </div>
            </div>
        </div>
    )
}
