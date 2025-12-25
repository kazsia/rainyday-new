"use client"

import * as React from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { ProductCard } from "@/components/shop/product-display-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, ShoppingCart, Loader2, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { getProducts } from "@/lib/db/products"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function StorePage() {
    const [searchQuery, setSearchQuery] = React.useState("")
    const [products, setProducts] = React.useState<any[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [sortBy, setSortBy] = React.useState("default")
    // Derived from screenshot
    // Tabs removed to avoid duplication with Main Navbar

    React.useEffect(() => {
        async function loadProducts() {
            try {
                const data = await getProducts()
                setProducts(data)
            } catch (error) {
                console.error("Failed to load products:", error)
            } finally {
                setIsLoading(false)
            }
        }
        loadProducts()
    }, [])

    const filteredProducts = products
        .filter((product) => {
            const query = searchQuery.toLowerCase()
            const matchName = product.name?.toLowerCase().includes(query)
            const matchDesc = product.description?.toLowerCase().includes(query)
            const matchCategory = product.category?.name?.toLowerCase().includes(query)

            return matchName || matchDesc || matchCategory
        })
        .sort((a, b) => {
            switch (sortBy) {
                case "price-asc":
                    return a.price - b.price
                case "price-desc":
                    return b.price - a.price
                case "name":
                    return a.name.localeCompare(b.name)
                case "newest":
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                default:
                    return 0 // Keep default order (by created_at usually as fetched)
            }
        })

    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Search & Filter Row */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    {/* Search Bar */}
                    <div className="relative flex-1 group">
                        <Input
                            placeholder="Search for a product..."
                            className="h-12 pl-12 pr-4 bg-[#0f1219] border-[#1e232d] rounded-xl focus-visible:ring-1 focus-visible:ring-brand-primary focus-visible:border-brand-primary placeholder:text-muted-foreground/50 text-white font-medium transition-all group-hover:border-white/10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-brand-primary/60 transition-colors" />
                    </div>

                    {/* Sort Dropdown */}
                    <div className="w-full md:w-64 relative">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="w-full h-12 px-4 bg-[#0f1219] border border-[#1e232d] rounded-xl flex items-center justify-between text-muted-foreground hover:border-brand-primary/50 hover:text-white transition-all text-sm font-medium focus:outline-none focus:ring-1 focus:ring-brand-primary/20">
                                    <span className="flex items-center gap-2">
                                        <span className="opacity-50">Index by:</span>
                                        <span className="text-white capitalize">{sortBy.replace("-", " ")}</span>
                                    </span>
                                    <Filter className="w-4 h-4 opacity-50" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64 bg-[#0f1219] border-[#1e232d] text-white">
                                <DropdownMenuItem onClick={() => setSortBy("default")} className="focus:bg-brand-primary/10 focus:text-brand-primary cursor-pointer">
                                    Default
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortBy("price-asc")} className="focus:bg-brand-primary/10 focus:text-brand-primary cursor-pointer">
                                    Price: Low to High
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortBy("price-desc")} className="focus:bg-brand-primary/10 focus:text-brand-primary cursor-pointer">
                                    Price: High to Low
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortBy("name")} className="focus:bg-brand-primary/10 focus:text-brand-primary cursor-pointer">
                                    Name (A-Z)
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortBy("newest")} className="focus:bg-brand-primary/10 focus:text-brand-primary cursor-pointer">
                                    Newest Arrivals
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <Loader2 className="w-10 h-10 text-brand-primary animate-spin" />
                        <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Loading Products...</p>
                    </div>
                ) : filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProducts.map((product) => (
                            <ProductCard
                                key={product.id}
                                id={product.id}
                                title={product.name}
                                price={product.price}
                                category={product.category?.name || "General"}
                                image={product.image_url || "/logo.png"}
                                productCount={product.stock_count}
                                badge_links={product.badge_links}
                                status_label={product.status_label}
                                status_color={product.status_color}
                                description={product.description}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="py-24 text-center">
                        <div className="inline-flex p-6 rounded-3xl bg-white/[0.02] border border-white/5 mb-6">
                            <Search className="w-12 h-12 text-white/10" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No results found</h3>
                        <p className="text-white/30 text-sm">Try searching for something else.</p>
                    </div>
                )}
            </div>
        </MainLayout>
    )
}
