"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Home,
    Package,
    ShoppingCart,
    Wallet,
    Bitcoin,
    Store,
    Settings,
    CreditCard,
    UsersRound,
    Ban,
    Globe,
    Upload,
    User,
    ChevronDown,
    ExternalLink,
    Bell
} from "lucide-react"
import { useState, useEffect } from "react"
import { Logo } from "@/components/layout/logo"
import { SheetClose } from "@/components/ui/sheet"
import { useMediaQuery } from "@/components/ui/flickering-footer"
import * as React from "react"

const navigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: Home },

    {
        name: "Products",
        href: "/admin/products",
        icon: Package,
        children: [
            { name: "Products", href: "/admin/products" },
            { name: "Coupons", href: "/admin/products/coupons" },
        ]
    },
    {
        name: "Orders",
        href: "/admin/orders",
        icon: ShoppingCart,
        children: [
            { name: "Invoices", href: "/admin/invoices" },
            { name: "Customers", href: "/admin/customers" },
            { name: "Feedbacks", href: "/admin/feedbacks" },
        ]
    },
    {
        name: "Wallets",
        href: "/admin/wallets",
        icon: Wallet,
        children: [
            { name: "Crypto", href: "/admin/crypto" },
        ]
    },
    { name: "Storefront", href: "/admin/storefront", icon: Store },
    {
        name: "Settings",
        icon: Settings,
        children: [
            { name: "Team", href: "/admin/team" },
            { name: "Blacklist", href: "/admin/blacklist" },
            { name: "Domains", href: "/admin/domains" },
            { name: "Export", href: "/admin/export" },
        ]
    },
    { name: "Account", href: "/admin/account", icon: User },
]

export function AdminSidebar({ className, isDrawer, onClose }: { className?: string, isDrawer?: boolean, onClose?: () => void }) {
    const isMobile = useMediaQuery("(max-width: 1024px)")
    const pathname = usePathname()
    const router = useRouter()
    const [expandedItems, setExpandedItems] = useState<string[]>(["Products", "Orders"])
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        // Automatically expand the group containing the current page
        navigation.forEach(item => {
            if (item.children) {
                const isChildActive = item.children.some(child => pathname === child.href)
                if (isChildActive || pathname === item.href) {
                    setExpandedItems(prev => {
                        if (!prev.includes(item.name)) {
                            return [...prev, item.name]
                        }
                        return prev
                    })
                }
            }
        })
    }, [pathname])

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
        <aside className={cn("w-64 min-h-screen bg-[var(--sa-sidebar)] border-r border-[var(--sa-border)] flex flex-col font-sans", className)} />
    )

    return (
        <aside className={cn("w-64 min-h-screen bg-[var(--sa-sidebar)] border-r border-[var(--sa-border)] flex flex-col font-sans", className)}>
            {/* Logo */}
            <div className="h-16 px-6 border-b border-[var(--sa-border)] flex items-center">
                <Logo />
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
                {navigation.map((item) => {
                    const isActive = pathname === item.href || (item.children ? item.children.some(c => pathname === c.href) : false)
                    const isExpanded = expandedItems.includes(item.name)
                    const Icon = item.icon

                    return (
                        <div key={item.name}>
                            <button
                                type="button"
                                onClick={(e) => {
                                    if (item.children) {
                                        toggleExpand(e, item.name)
                                    } else {
                                        router.push(item.href!)
                                        if (isDrawer && onClose) onClose()
                                    }
                                }}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                                    isActive && !item.children
                                        ? "bg-[var(--sa-accent-muted)] text-[var(--sa-accent)] shadow-[0_0_15px_-3px_var(--sa-accent-glow)]"
                                        : "text-[var(--sa-fg-muted)] hover:text-[var(--sa-fg-bright)] hover:bg-[var(--sa-card-hover)]"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon
                                        strokeWidth={2}
                                        className={cn(
                                            "w-4 h-4 transition-colors",
                                            isActive && !item.children ? "text-[var(--sa-accent)]" : "text-[var(--sa-fg-dim)] group-hover:text-[var(--sa-fg-muted)]"
                                        )}
                                    />
                                    {item.name}
                                </div>
                                {item.children && (
                                    <ChevronDown className={cn(
                                        "w-4 h-4 transition-transform text-[var(--sa-fg-dim)]",
                                        isExpanded && "rotate-180"
                                    )} />
                                )}
                            </button>

                            {/* Children */}
                            {item.children && isExpanded && (
                                <div className="mt-1 space-y-0.5 pl-4 mb-2 relative before:content-[''] before:absolute before:left-[17px] before:top-1 before:bottom-1 before:w-[1px] before:bg-[var(--sa-border-hover)]">
                                    {item.children.map((child) => {
                                        const isChildActive = pathname === child.href
                                        return (
                                            <Link
                                                key={child.name}
                                                href={child.href}
                                                onClick={() => {
                                                    if (isDrawer && onClose) onClose()
                                                }}
                                                className={cn(
                                                    "block pl-8 pr-3 py-2 text-[13px] font-medium transition-all relative rounded-md",
                                                    isChildActive
                                                        ? "text-[var(--sa-accent)]"
                                                        : "text-[var(--sa-fg-muted)] hover:text-[var(--sa-fg-bright)]"
                                                )}
                                            >
                                                {child.name}
                                                {isChildActive && (
                                                    <div className="absolute left-[15px] top-1/2 -translate-y-1/2 w-1 h-1 bg-[var(--sa-accent)] rounded-full shadow-[0_0_8px_var(--sa-accent)]" />
                                                )}
                                            </Link>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )
                })}
            </nav>
        </aside>
    )
}
