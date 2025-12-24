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
        <div className="flex min-h-screen bg-[var(--sa-bg)] text-[var(--sa-fg-muted)]" suppressHydrationWarning>
            <SalesNotifier />

            {/* Desktop Sidebar */}
            <div className="hidden lg:block" suppressHydrationWarning>
                <AdminSidebar />
            </div>

            <div className="flex-1 flex flex-col bg-[var(--sa-bg)] min-w-0" suppressHydrationWarning>
                {/* Topbar */}
                <header className="h-12 flex items-center justify-between px-4 sm:px-6 bg-[var(--sa-bg)]/80 backdrop-blur-xl sticky top-0 z-40 border-b border-[var(--sa-border)] transition-all">
                    <div className="flex items-center gap-3 overflow-hidden" suppressHydrationWarning>
                        {/* Mobile Menu Trigger */}
                        <div className="lg:hidden shrink-0" suppressHydrationWarning>
                            {mounted && (
                                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                                    <SheetTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--sa-fg-dim)] hover:text-[var(--sa-fg-bright)] hover:bg-[var(--sa-card-hover)]">
                                            <Menu className="w-4 h-4" />
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="left" className="p-0 border-r border-[var(--sa-border)] bg-[var(--sa-sidebar)] w-60">
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

                        <div className="relative group flex items-center gap-2 shrink-0" suppressHydrationWarning>
                            <Logo className="scale-[0.5] origin-left" />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0" suppressHydrationWarning>
                        <NotificationBell />
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
                    <div className="max-w-[120rem] mx-auto" suppressHydrationWarning>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}

// Backward compatibility alias
export { AdminLayoutClient as AdminLayout }
