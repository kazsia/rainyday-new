"use client"

import { ProximaNavbar } from "./proxima-navbar"

export function ProximaLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-proxima-gradient selection:bg-primary/30 selection:text-primary relative overflow-hidden" suppressHydrationWarning>
            <div className="relative z-10" suppressHydrationWarning>
                <ProximaNavbar />

                <main suppressHydrationWarning>
                    {children}
                </main>
            </div>
        </div>
    )
}
