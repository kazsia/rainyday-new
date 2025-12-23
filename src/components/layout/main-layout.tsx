"use client"

import { BgGradient } from "@/components/ui/hero-animated"
import { ProximaNavbar } from "./proxima-navbar"
import { FlickeringFooter } from "@/components/ui/flickering-footer"

export function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative min-h-screen flex flex-col" suppressHydrationWarning>
            <BgGradient
                gradientColors="rainyday"
                gradientSize="lg"
                className="fixed inset-0 z-0 opacity-40 min-h-screen"
            />
            <div className="relative z-10 flex flex-col flex-grow">
                <ProximaNavbar />
                <main className="flex-grow">
                    {children}
                </main>
                <FlickeringFooter />
            </div>
        </div>
    )
}
