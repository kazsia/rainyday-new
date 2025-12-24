"use client"

import { ProximaNavbar } from "./proxima-navbar"
import { ShaderBackground } from "@/components/ui/shader-background"

export function ProximaLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen selection:bg-primary/30 selection:text-primary relative overflow-hidden" suppressHydrationWarning>
            {/* Global Shader Background - Starts after hero section */}
            <div className="fixed top-[100vh] left-0 right-0 bottom-0 w-full z-0">
                <ShaderBackground />
            </div>

            <div className="relative z-10" suppressHydrationWarning>
                <ProximaNavbar />

                <main suppressHydrationWarning>
                    {children}
                </main>
            </div>
        </div>
    )
}
