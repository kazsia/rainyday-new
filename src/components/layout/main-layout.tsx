"use client"

import { ProximaNavbar } from "./proxima-navbar"
import { FlickeringFooter } from "@/components/ui/flickering-footer"

export function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative min-h-screen flex flex-col bg-proxima-gradient">
            <ProximaNavbar />
            <main className="flex-grow">
                {children}
            </main>
            <FlickeringFooter />
        </div>
    )
}
