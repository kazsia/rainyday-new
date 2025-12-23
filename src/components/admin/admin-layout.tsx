"use client"

import { useState, useEffect } from "react"
import { AdminSidebar } from "./admin-sidebar"
import { Button } from "@/components/ui/button"
import { Settings, Menu } from "lucide-react"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { SalesNotifier } from "./sales-notifier"
import { NotificationBell } from "./notification-bell"
import { Logo } from "@/components/layout/logo"

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    return (
        <div className="flex min-h-screen bg-[var(--sa-bg)] text-[var(--sa-fg-muted)]">
            <SalesNotifier />

            {/* Desktop Sidebar */}
            <div className="hidden lg:block">
                <AdminSidebar />
            </div>

            <div className="flex-1 flex flex-col bg-[var(--sa-bg)] min-w-0">
                {/* Topbar */}
                <header className="h-14 sm:h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-[var(--sa-bg)]/80 backdrop-blur-xl sticky top-0 z-40 border-b border-[var(--sa-border)] transition-all">
                    <div className="flex items-center gap-3 overflow-hidden">
                        {/* Mobile Menu Trigger */}
                        <div className="lg:hidden shrink-0">
                            {mounted && (
                                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                                    <SheetTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-[var(--sa-fg-dim)] hover:text-[var(--sa-fg-bright)] hover:bg-[var(--sa-card-hover)]">
                                            <Menu className="w-5 h-5" />
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="left" className="p-0 border-r border-[var(--sa-border)] bg-[var(--sa-sidebar)] w-64">
                                        <SheetHeader className="sr-only">
                                            <SheetTitle>Admin Navigation</SheetTitle>
                                        </SheetHeader>
                                        <AdminSidebar
                                            className="w-full border-r-0"
                                            isDrawer
                                            onClose={() => setIsMobileMenuOpen(false)}
                                        />
                                    </SheetContent>
                                </Sheet>
                            )}
                        </div>

                        <div className="relative group flex items-center gap-2 shrink-0">
                            <Logo className="scale-[0.55] sm:scale-75 origin-left" />
                        </div>
                    </div>

                    <div className="flex items-center shrink-0">
                        <NotificationBell />
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
                    <div className="max-w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}

// Backward compatibility alias
export { AdminLayoutClient as AdminLayout }
