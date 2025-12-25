"use client"

import * as React from "react"
import { ProximaNavbar } from "./proxima-navbar"
import { ShaderBackground } from "@/components/ui/shader-background"

export function ProximaLayout({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    return (
        <div className="min-h-screen selection:bg-primary/30 selection:text-primary relative overflow-hidden bg-black" suppressHydrationWarning>
            {/* Global Shader Background - Starts after hero section */}
            {mounted && (
                <div className="fixed top-[100vh] left-0 right-0 bottom-0 w-full z-0 pointer-events-none">
                    <ShaderBackground />
                </div>
            )}

            <div className="relative z-10" suppressHydrationWarning>
                <ProximaNavbar />

                <main suppressHydrationWarning>
                    {children}
                </main>
            </div>
        </div>
    )
}
