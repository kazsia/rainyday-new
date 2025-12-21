"use client"

import * as React from "react"
import Link from "next/link"
import { Logo } from "./logo"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ShoppingCart, Menu } from "lucide-react"
import { usePathname } from "next/navigation"

import { useCart } from "@/context/cart-context"
import { useCurrency } from "@/context/currency-context"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetTitle,
    SheetHeader,
    SheetClose,
} from "@/components/ui/sheet"

import { getStoreStats } from "@/lib/db/stats"

const navLinks = [
    { name: "Products", href: "/store" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/support" },
    { name: "F.A.Q", href: "/faq" },
    { name: "Feedback", href: "/feedback" },
    { name: "Terms", href: "/terms" },
]

function formatNumber(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + "M"
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(2) + "K"
    }
    return num.toString()
}

export function ProximaNavbar() {
    const pathname = usePathname()
    const { cartCount } = useCart()
    const { currency, setCurrency, symbol } = useCurrency()
    const [stats, setStats] = React.useState({
        sales: 1460,
        buyers: 162,
        rating: "4.98"
    })

    React.useEffect(() => {
        getStoreStats().then(setStats)
    }, [])

    return (
        <header className="w-full bg-[#05090b] z-50" suppressHydrationWarning>
            <div className="container mx-auto px-4 pt-2 pb-4 max-w-7xl" suppressHydrationWarning>
                {/* Brand & Stats Section */}
                <div className="bg-[#0b1016] rounded-2xl border border-white/5 overflow-hidden mb-3 shadow-2xl" suppressHydrationWarning>
                    <div className="flex flex-col lg:flex-row items-stretch" suppressHydrationWarning>
                        {/* Logo & Slogan */}
                        <div className="flex-1 p-5 lg:p-6 flex items-center gap-6 border-b lg:border-b-0 lg:border-r border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent" suppressHydrationWarning>
                            <Logo />
                            <div className="w-px h-8 bg-white/5 hidden lg:block" />
                            <p className="text-xs text-white/30 font-medium hidden lg:block">Quality you can trust, prices that make sense.</p>
                        </div>

                        {/* Stats Section */}
                        <div className="flex flex-wrap items-center justify-around lg:justify-end gap-x-4 gap-y-2 px-4 md:px-8 lg:px-12 py-4 lg:py-0 bg-black/40 backdrop-blur-md" suppressHydrationWarning>
                            <div className="text-center group/stat" suppressHydrationWarning>
                                <p className="text-xl md:text-2xl font-extrabold text-white tracking-tight transition-colors group-hover/stat:text-brand-primary" style={{ fontFamily: 'var(--font-manrope)' }}>
                                    {formatNumber(stats.sales)}
                                </p>
                                <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.25em] mt-1 transition-colors group-hover/stat:text-white/40">Sales</p>
                            </div>
                            <div className="text-center group/stat" suppressHydrationWarning>
                                <p className="text-xl md:text-2xl font-extrabold text-white tracking-tight transition-colors group-hover/stat:text-brand-primary" style={{ fontFamily: 'var(--font-manrope)' }} suppressHydrationWarning>
                                    {formatNumber(stats.buyers)}
                                </p>
                                <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.25em] mt-1 transition-colors group-hover/stat:text-white/40">Buyers</p>
                            </div>
                            <div className="text-center group/stat" suppressHydrationWarning>
                                <p className="text-xl md:text-2xl font-extrabold text-white tracking-tight transition-colors group-hover/stat:text-brand-primary" style={{ fontFamily: 'var(--font-manrope)' }} suppressHydrationWarning>
                                    {stats.rating}
                                </p>
                                <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.25em] mt-1 transition-colors group-hover/stat:text-white/40">Rating</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Toolbar Section */}
                <div className="flex items-center justify-between gap-4">
                    {/* Desktop Navigation */}
                    <div className="hidden md:flex flex-wrap items-center gap-2">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href
                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={cn(
                                        "h-11 px-6 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center border",
                                        isActive
                                            ? "bg-brand-primary/10 text-brand-primary border-brand-primary/20 shadow-glow"
                                            : "bg-[#0b1016] border-white/5 text-white/40 hover:text-white hover:border-white/20"
                                    )}
                                >
                                    {link.name}
                                </Link>
                            )
                        })}
                    </div>

                    {/* Mobile Menu Trigger */}
                    <div className="flex md:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-11 w-11 bg-[#0b1016] border border-white/5 rounded-xl text-white/40 hover:text-white">
                                    <Menu className="w-6 h-6" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="bg-[#05090b] border-white/5 p-0 w-80">
                                <SheetHeader className="p-6 border-b border-white/5">
                                    <SheetTitle>
                                        <Logo />
                                    </SheetTitle>
                                </SheetHeader>
                                <div className="flex flex-col p-4 gap-2">
                                    {navLinks.map((link) => {
                                        const isActive = pathname === link.href
                                        return (
                                            <SheetClose asChild key={link.name}>
                                                <Link
                                                    href={link.href}
                                                    className={cn(
                                                        "h-14 px-6 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center border",
                                                        isActive
                                                            ? "bg-brand-primary/10 text-brand-primary border-brand-primary/20"
                                                            : "bg-[#0b1016]/50 border-white/5 text-white/40 hover:bg-white/5"
                                                    )}
                                                >
                                                    {link.name}
                                                </Link>
                                            </SheetClose>
                                        )
                                    })}
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Currency Selector */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div className="h-11 px-4 md:px-6 bg-[#0b1016] border border-white/5 rounded-xl flex items-center gap-2 md:gap-3 cursor-pointer hover:border-white/10 transition-all hover:bg-white/[0.02] group/currency">
                                    <span className="text-[10px] md:text-[11px] font-black text-white/40 tracking-widest group-hover/currency:text-white/60 transition-colors">{symbol} {currency}</span>
                                    <div className="w-px h-3 bg-white/10" />
                                    <svg className="w-3 h-3 md:w-4 md:h-4 text-white/20 group-hover/currency:text-white transition-transform duration-300 group-hover/currency:translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-[#0b1016] border-white/5 text-white/60">
                                <DropdownMenuItem onClick={() => setCurrency("USD")} className={cn("focus:bg-white/5 focus:text-white cursor-pointer", currency === "USD" && "text-white bg-white/5")}>$ USD</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setCurrency("EUR")} className={cn("focus:bg-white/5 focus:text-white cursor-pointer", currency === "EUR" && "text-white bg-white/5")}>€ EUR</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setCurrency("GBP")} className={cn("focus:bg-white/5 focus:text-white cursor-pointer", currency === "GBP" && "text-white bg-white/5")}>£ GBP</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Link
                            href="/cart"
                            className="w-11 h-11 bg-[#0b1016] border border-white/5 rounded-xl flex items-center justify-center text-white/40 hover:text-brand-primary hover:border-brand-primary/20 transition-all shadow-xl shadow-black/60 relative group"
                        >
                            <ShoppingCart className="w-5 h-5 transition-transform group-hover:scale-110" />
                            {cartCount > 0 && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-primary rounded-full flex items-center justify-center text-[10px] font-black text-black animate-in zoom-in duration-300">
                                    {cartCount}
                                </div>
                            )}
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    )
}
