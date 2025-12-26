"use client"

import * as React from "react"
import { ProximaNavbar } from "./proxima-navbar"
import { FlickeringFooter } from "@/components/ui/flickering-footer"

export function MainLayout({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <div className="min-h-screen bg-black" />
    }

    return (
        <div className="relative min-h-screen flex flex-col bg-black">
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
