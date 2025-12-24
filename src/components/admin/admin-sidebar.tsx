"use client"

// Sidebar component for administration panel
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    Home,
    Package,
    ShoppingCart,
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
    Bell,
    Sliders,
    Palette,
    Layout,
} from "lucide-react"
import { useState, useEffect, Suspense } from "react"
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
    { name: "Configure", href: "/admin/storefront?tab=identity", icon: Settings },
    { name: "Editor", href: "/admin/storefront?tab=hero", icon: Layout },
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
    // Helper to check if this item or any of its descendants match currentHref
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

    return (
        <div key={item.name}>
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
                    "w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-all group relative",
                    level > 0 && "py-1.5 px-3 text-[12px]",
                    isActive && !item.children
                        ? "text-[var(--sa-accent)] bg-[var(--sa-accent-muted)] shadow-[inset_0_0_0_1px_var(--sa-accent-glow)]"
                        : "text-[var(--sa-fg-muted)] hover:text-[var(--sa-fg-bright)] hover:bg-[var(--sa-card-hover)]"
                )}
                style={{ paddingLeft: level > 0 ? `${(level + 1) * 12}px` : undefined }}
            >
                <div className="flex items-center gap-2.5">
                    {Icon && (
                        <Icon
                            strokeWidth={2.5}
                            className={cn(
                                "w-3.5 h-3.5 transition-colors",
                                isActive && !item.children ? "text-[var(--sa-accent)]" : "text-[var(--sa-fg-dim)] group-hover:text-[var(--sa-fg-muted)]"
                            )}
                        />
                    )}
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
                <div className={cn(
                    "mt-1 space-y-0.5 mb-2 relative",
                    level === 0 && "pl-4 before:content-[''] before:absolute before:left-[17px] before:top-1 before:bottom-1 before:w-[1px] before:bg-[var(--sa-border-hover)]"
                )}>
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
        <aside className={cn("w-60 min-h-screen bg-[var(--sa-sidebar)] border-r border-[var(--sa-border)] flex flex-col font-sans", className)} />
    )

    return (
        <aside className={cn("w-60 min-h-screen bg-[var(--sa-sidebar)] border-r border-[var(--sa-border)] flex flex-col font-sans", className)}>
            <div className="h-14 px-5 border-b border-[var(--sa-border)] flex items-center bg-black/50 backdrop-blur-md">
                <Logo className="scale-[0.65] origin-left" />
            </div>

            <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto custom-scrollbar">
                {/* Store Management Group */}
                <div>
                    <h3 className="px-3 mb-2 text-[10px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest">Store Management</h3>
                    <div className="space-y-0.5">
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
                    <h3 className="px-3 mb-2 text-[10px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest">Configuration</h3>
                    <div className="space-y-0.5">
                        {navigation.slice(3, 5).map((item) => (
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

            {/* Account Button */}
            <div className="mt-auto p-3 border-t border-[var(--sa-border)] bg-black/20">
                <button
                    onClick={() => router.push('/admin/account')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.05] transition-all group border border-transparent hover:border-[var(--sa-border-hover)]"
                >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--sa-accent-glow)] to-transparent border border-[var(--sa-border)] flex items-center justify-center">
                        <User className="w-4 h-4 text-[var(--sa-accent)]" />
                    </div>
                    <div className="flex-1 text-left">
                        <p className="text-xs font-bold text-white">Account</p>
                        <p className="text-[10px] text-[var(--sa-fg-dim)] group-hover:text-[var(--sa-fg-muted)] transition-colors">Manage settings</p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-[var(--sa-fg-dim)] group-hover:text-white transition-colors" />
                </button>
            </div>
        </aside>
    )
}

export function AdminSidebar(props: { className?: string, isDrawer?: boolean, onClose?: () => void }) {
    return (
        <Suspense fallback={<aside className={cn("w-64 min-h-screen bg-[var(--sa-sidebar)] border-r border-[var(--sa-border)] flex flex-col font-sans", props.className)} />}>
            <SidebarContent {...props} />
        </Suspense>
    )
}
