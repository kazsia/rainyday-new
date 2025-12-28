"use client"

// Sidebar component for administration panel - Enhanced Premium Edition
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    Home, Package, ShoppingCart, Settings, User, CreditCard,
    ChevronDown, ChevronRight, ExternalLink, Layout,
    MessageSquare, Store, BarChart3, Zap
} from "lucide-react"

import { useState, useEffect, Suspense } from "react"
import { Logo } from "@/components/layout/logo"
import { SheetClose } from "@/components/ui/sheet"
import { useMediaQuery } from "@/components/ui/flickering-footer"
import * as React from "react"

const navigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: Home, badge: null },
    {
        name: "Products",
        href: "/admin/products",
        icon: Package,
        children: [
            { name: "All Products", href: "/admin/products" },
            { name: "Groups", href: "/admin/groups" },
            { name: "Coupons", href: "/admin/products/coupons" },
        ]
    },
    {
        name: "Orders",
        href: "/admin/orders",
        icon: ShoppingCart,
        children: [
            { name: "All Orders", href: "/admin/orders" },
            { name: "Invoices", href: "/admin/invoices" },
            { name: "Customers", href: "/admin/customers" },
            { name: "Feedbacks", href: "/admin/feedbacks" },
            { name: "Tickets", href: "/admin/tickets" },
        ]
    },
    { name: "Configure", href: "/admin/storefront?tab=identity", icon: Settings },
    { name: "Payments", href: "/admin/payment-methods", icon: CreditCard },
    { name: "Editor", href: "/admin/storefront?tab=hero", icon: Layout },
    {
        name: "Settings",
        icon: Settings,
        children: [
            { name: "Team", href: "/admin/team" },
            { name: "Blacklist", href: "/admin/blacklist" },
            { name: "Export", href: "/admin/export" },
        ]
    },
    { name: "Account", href: "/admin/account", icon: User },
]

const NavItem = ({
    item,
    level = 0,
    currentHref,
    expandedItems,
    toggleExpand,
    router,
    isDrawer,
    onClose
}: {
    item: any,
    level?: number,
    currentHref: string,
    expandedItems: string[],
    toggleExpand: (e: React.MouseEvent, name: string) => void,
    router: any,
    isDrawer?: boolean,
    onClose?: () => void
}) => {
    const isLinkActive = (href?: string) => {
        if (!href) return false
        return currentHref === href
    }

    const hasActiveDescendant = (items: any[]): boolean => {
        return items.some(child => {
            if (isLinkActive(child.href)) return true
            if (child.children) return hasActiveDescendant(child.children)
            return false
        })
    }

    const isExactActive = isLinkActive(item.href)
    const isActive = isExactActive || (item.children && hasActiveDescendant(item.children))
    const isExpanded = expandedItems.includes(item.name)
    const Icon = item.icon

    // Child items (no icon)
    if (level > 0) {
        return (
            <button
                type="button"
                onClick={(e) => {
                    if (item.href) {
                        router.push(item.href)
                        if (isDrawer && onClose) onClose()
                    }
                }}
                className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-all duration-200 group relative",
                    isExactActive
                        ? "text-[#a4f8ff] bg-[#a4f8ff]/[0.08]"
                        : "text-white/40 hover:text-white/80 hover:bg-white/[0.03]"
                )}
                style={{ marginLeft: `${level * 8}px` }}
            >
                <div className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all duration-200",
                    isExactActive ? "bg-[#a4f8ff] shadow-[0_0_8px_rgba(164,248,255,0.5)]" : "bg-white/20 group-hover:bg-white/40"
                )} />
                {item.name}
            </button>
        )
    }

    // Parent items (with icon)
    return (
        <div key={item.name} className="relative">
            <button
                type="button"
                onClick={(e) => {
                    if (item.children) {
                        toggleExpand(e, item.name)
                    } else if (item.href) {
                        router.push(item.href)
                        if (isDrawer && onClose) onClose()
                    }
                }}
                className={cn(
                    "w-full flex items-center justify-between px-2.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 group relative",
                    isActive && !item.children
                        ? "text-white bg-gradient-to-r from-[#a4f8ff]/15 to-[#a4f8ff]/5 shadow-[inset_0_0_0_1px_rgba(164,248,255,0.15)]"
                        : "text-white/60 hover:text-white hover:bg-white/[0.03]"
                )}
            >
                {/* Active left accent bar */}
                {isActive && !item.children && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-[#a4f8ff] shadow-[0_0_12px_rgba(164,248,255,0.6)]" />
                )}

                <div className="flex items-center gap-3">
                    {Icon && (
                        <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 relative",
                            isActive && !item.children
                                ? "bg-[#a4f8ff]/20"
                                : "bg-white/[0.04] group-hover:bg-white/[0.08]"
                        )}>
                            <Icon
                                strokeWidth={1.8}
                                className={cn(
                                    "w-[18px] h-[18px] transition-all duration-200",
                                    isActive && !item.children ? "text-[#a4f8ff]" : "text-white/50 group-hover:text-white/80"
                                )}
                            />
                            {/* Icon glow for active */}
                            {isActive && !item.children && (
                                <div className="absolute inset-0 rounded-lg bg-[#a4f8ff]/10 blur-sm" />
                            )}
                        </div>
                    )}
                    <span className="tracking-tight">{item.name}</span>
                </div>

                {item.children && (
                    <ChevronRight className={cn(
                        "w-4 h-4 transition-all duration-300 text-white/20 group-hover:text-white/40",
                        isExpanded && "rotate-90 text-white/50"
                    )} />
                )}
            </button>

            {/* Children with animated container */}
            {item.children && (
                <div className={cn(
                    "overflow-hidden transition-all duration-300 ease-out",
                    isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                )}>
                    <div className="py-1 pl-4 space-y-0.5 relative">
                        {/* Vertical connector line */}
                        <div className="absolute left-[22px] top-2 bottom-2 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent" />

                        {item.children.map((child: any) => (
                            <NavItem
                                key={child.name}
                                item={child}
                                level={level + 1}
                                currentHref={currentHref}
                                expandedItems={expandedItems}
                                toggleExpand={toggleExpand}
                                router={router}
                                isDrawer={isDrawer}
                                onClose={onClose}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

function SidebarContent({ className, isDrawer, onClose }: { className?: string, isDrawer?: boolean, onClose?: () => void }) {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const router = useRouter()

    const currentHref = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "")

    const [expandedItems, setExpandedItems] = useState<string[]>(["Products", "Orders"])
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        const getActivePath = (items: any[], currentPath: string[] = []): string[] => {
            for (const item of items) {
                const hasActiveChild = (children: any[]): boolean => {
                    return children.some(child => {
                        if (currentHref === child.href) return true
                        if (child.children) return hasActiveChild(child.children)
                        return false
                    })
                }

                if (currentHref === item.href || (item.children && hasActiveChild(item.children))) {
                    const newPath = [...currentPath, item.name]
                    if (item.children) {
                        return getActivePath(item.children, newPath)
                    }
                    return newPath
                }
            }
            return currentPath
        }

        const activePath = getActivePath(navigation)

        setExpandedItems(prev => {
            const defaults = ["Products", "Orders"]
            const nextExpanded = new Set([...defaults, ...activePath])
            return Array.from(nextExpanded)
        })
    }, [currentHref])

    const toggleExpand = (e: React.MouseEvent, name: string) => {
        e.preventDefault()
        e.stopPropagation()
        setExpandedItems(prev =>
            prev.includes(name)
                ? prev.filter(item => item !== name)
                : [...prev, name]
        )
    }

    if (!mounted) return (
        <aside className={cn("w-[260px] min-h-screen bg-[#050709] border-r border-white/[0.04] flex flex-col font-sans", className)} />
    )

    return (
        <aside className={cn("w-[260px] min-h-screen bg-[#050709] border-r border-white/[0.04] flex flex-col font-sans relative overflow-hidden", className)}>
            {/* Background effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-60 bg-gradient-to-b from-[#a4f8ff]/[0.015] to-transparent" />
                <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-[#0a0c10] to-transparent" />
                <div className="absolute top-20 -left-20 w-40 h-40 bg-[#a4f8ff]/[0.03] rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <div className="h-[72px] px-5 border-b border-white/[0.04] flex items-center relative z-10">
                <Logo className="scale-[0.7] origin-left" />
            </div>

            <div className="flex-1 px-3 py-6 space-y-8 overflow-y-auto custom-scrollbar relative z-10">
                {/* Store Management Group */}
                <div>
                    <div className="flex items-center gap-2.5 px-2.5 mb-3">
                        <div className="w-5 h-5 rounded-md bg-[#a4f8ff]/10 flex items-center justify-center">
                            <BarChart3 className="w-3 h-3 text-[#a4f8ff]/60" />
                        </div>
                        <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em]">Store</h3>
                    </div>
                    <div className="space-y-1">
                        {navigation.slice(0, 3).map((item) => (
                            <NavItem
                                key={item.name}
                                item={item}
                                currentHref={currentHref}
                                expandedItems={expandedItems}
                                toggleExpand={toggleExpand}
                                router={router}
                                isDrawer={isDrawer}
                                onClose={onClose}
                            />
                        ))}
                    </div>
                </div>

                {/* Configuration Group */}
                <div>
                    <div className="flex items-center gap-2.5 px-2.5 mb-3">
                        <div className="w-5 h-5 rounded-md bg-white/[0.04] flex items-center justify-center">
                            <Settings className="w-3 h-3 text-white/30" />
                        </div>
                        <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em]">Configure</h3>
                    </div>
                    <div className="space-y-1">
                        {navigation.slice(3, 6).map((item) => (
                            <NavItem
                                key={item.name}
                                item={item}
                                currentHref={currentHref}
                                expandedItems={expandedItems}
                                toggleExpand={toggleExpand}
                                router={router}
                                isDrawer={isDrawer}
                                onClose={onClose}
                            />
                        ))}
                    </div>
                </div>

                {/* System Settings Group */}
                <div>
                    <div className="flex items-center gap-2.5 px-2.5 mb-3">
                        <div className="w-5 h-5 rounded-md bg-white/[0.04] flex items-center justify-center">
                            <Zap className="w-3 h-3 text-white/30" />
                        </div>
                        <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em]">System</h3>
                    </div>
                    <div className="space-y-1">
                        {navigation.slice(6, 7).map((item) => (
                            <NavItem
                                key={item.name}
                                item={item}
                                currentHref={currentHref}
                                expandedItems={expandedItems}
                                toggleExpand={toggleExpand}
                                router={router}
                                isDrawer={isDrawer}
                                onClose={onClose}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer section */}
            <div className="relative z-10 p-3 space-y-2 border-t border-white/[0.04] bg-gradient-to-t from-[#0a0c10] to-transparent">
                {/* Visit Store Button */}
                <button
                    onClick={() => window.open('/store', '_blank')}
                    className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] hover:border-white/[0.08] transition-all duration-200 group"
                >
                    <Store className="w-4 h-4 text-white/40 group-hover:text-white/70 transition-colors" />
                    <span className="text-[12px] font-bold text-white/50 group-hover:text-white/90 transition-colors">Visit Store</span>
                    <ExternalLink className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 transition-colors ml-auto" />
                </button>

                {/* Account Button */}
                <button
                    onClick={() => router.push('/admin/account')}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-gradient-to-r from-[#a4f8ff]/[0.06] to-transparent hover:from-[#a4f8ff]/[0.1] transition-all duration-300 group border border-[#a4f8ff]/[0.08] hover:border-[#a4f8ff]/15"
                >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#a4f8ff]/25 to-[#a4f8ff]/5 border border-[#a4f8ff]/20 flex items-center justify-center shadow-[0_0_20px_rgba(164,248,255,0.08)] relative overflow-hidden">
                        <User className="w-5 h-5 text-[#a4f8ff] relative z-10" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#a4f8ff]/10 to-transparent" />
                    </div>
                    <div className="flex-1 text-left">
                        <p className="text-[13px] font-bold text-white/90">Account</p>
                        <p className="text-[10px] text-white/30 group-hover:text-white/50 transition-colors">Manage settings</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:translate-x-0.5 group-hover:text-white/40 transition-all" />
                </button>
            </div>
        </aside>
    )
}

export function AdminSidebar(props: { className?: string, isDrawer?: boolean, onClose?: () => void }) {
    return (
        <Suspense fallback={<aside className={cn("w-[260px] min-h-screen bg-[#050709] border-r border-white/[0.04] flex flex-col font-sans", props.className)} />}>
            <SidebarContent {...props} />
        </Suspense>
    )
}
