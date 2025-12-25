"use client"

import * as React from "react"
import Link from "next/link"
import { Logo } from "./logo"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ShoppingCart, Menu, Search, User, Star } from "lucide-react"
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

import { getAverageRating } from "@/lib/db/feedbacks"

const navLinks = [
    { name: "Products", href: "/store" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/support" },
    { name: "F.A.Q", href: "/faq" },
    { name: "Feedback", href: "/feedback" },
    { name: "Terms", href: "/terms" },
]

export function ProximaNavbar() {
    const pathname = usePathname()
    const { cartCount, isHydrated: cartHydrated } = useCart()
    const { currency, setCurrency, symbol, isHydrated: currencyHydrated } = useCurrency()
    const [mounted, setMounted] = React.useState(false)
    const [ratingData, setRatingData] = React.useState<{ average: number, count: number } | null>(null)

    React.useEffect(() => {
        setMounted(true)
        async function loadRating() {
            const data = await getAverageRating()
            setRatingData(data)
        }
        loadRating()
    }, [])

    return (
        <header className="w-full bg-background/20 backdrop-blur-md border-b border-white/5 sticky top-0 z-50 transition-all duration-300">
            <div className="container mx-auto px-4 md:px-6 h-20 flex items-center justify-between max-w-[90rem]">
                {/* Logo Section */}
                <div className="flex-shrink-0 mr-8">
                    <Logo />
                </div>

                {/* Desktop Navigation */}
                <div className="hidden lg:flex items-center gap-1">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href
                        const isFeedback = link.name === "Feedback"
                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={cn(
                                    "h-10 px-4 rounded-lg text-sm font-medium transition-all flex items-center gap-2 hover:bg-white/5",
                                    isActive
                                        ? "text-brand-primary"
                                        : "text-muted-foreground hover:text-white"
                                )}
                            >
                                {link.name}
                                {isFeedback && ratingData && ratingData.count > 0 && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-primary/10 text-[10px] font-bold text-brand-primary border border-brand-primary/20">
                                        <Star className="w-2.5 h-2.5 fill-current" />
                                        {ratingData.average}
                                    </span>
                                )}
                            </Link>
                        )
                    })}
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3 md:gap-4 ml-auto lg:ml-0">
                    {/* Currency Selector */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="h-9 px-4 rounded-full text-xs font-bold text-muted-foreground hover:text-white hover:bg-white/5 transition-colors uppercase tracking-wider hidden sm:flex items-center gap-2 border border-white/5">
                                {(mounted && currencyHydrated) ? symbol : "$"} <span className="opacity-50">{currency}</span>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-border">
                            <DropdownMenuItem onClick={() => setCurrency("USD")}>$ USD</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setCurrency("EUR")}>€ EUR</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setCurrency("GBP")}>£ GBP</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Link href="/cart" className="relative group">
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                            (mounted && cartCount > 0) ? "bg-brand-primary/10 text-brand-primary" : "bg-transparent border border-white/10 text-muted-foreground hover:text-white hover:border-white/20"
                        )}>
                            <ShoppingCart className="w-5 h-5" />
                        </div>
                        {(mounted && cartHydrated) && (
                            <span className={cn(
                                "absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-background shadow-lg shadow-brand-primary/20 animate-in zoom-in",
                                cartCount > 0 ? "bg-brand-primary" : "bg-muted-foreground/50"
                            )}>
                                {cartCount}
                            </span>
                        )}
                    </Link>

                    {/* Mobile Menu */}
                    <div className="lg:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl bg-card border border-border text-muted-foreground hover:text-white">
                                    <Menu className="w-5 h-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="bg-background border-border p-0 w-80">
                                <SheetHeader className="p-6 border-b border-border">
                                    <SheetTitle>
                                        <Logo />
                                    </SheetTitle>
                                </SheetHeader>
                                <div className="flex flex-col p-4 gap-1">
                                    {navLinks.map((link) => (
                                        <SheetClose key={link.name} asChild>
                                            <Link
                                                href={link.href}
                                                className={cn(
                                                    "h-12 px-4 rounded-lg flex items-center text-sm font-medium transition-colors justify-between",
                                                    pathname === link.href ? "bg-brand-primary/10 text-brand-primary" : "hover:bg-white/5 text-muted-foreground hover:text-white"
                                                )}
                                            >
                                                {link.name}
                                                {link.name === "Feedback" && ratingData && ratingData.count > 0 && (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-primary/10 text-[10px] font-bold text-brand-primary border border-brand-primary/20">
                                                        <Star className="w-2.5 h-2.5 fill-current" />
                                                        {ratingData.average}
                                                    </span>
                                                )}
                                            </Link>
                                        </SheetClose>
                                    ))}
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </header>
    )
}
