"use client"

import * as React from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { ProductCard } from "@/components/shop/product-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, ShoppingCart, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getProducts } from "@/lib/db/products"

export default function StorePage() {
    const [searchQuery, setSearchQuery] = React.useState("")
    const [products, setProducts] = React.useState<any[]>([])
    const [isLoading, setIsLoading] = React.useState(true)

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

    const filteredProducts = products.filter((product) => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesSearch
    })

    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Store Header Section */}
                <div className="space-y-6 mb-12">
                    <div className="flex items-center gap-4">
                        <div className="w-1.5 h-10 bg-brand-primary rounded-full shadow-[0_0_20px_rgba(38,188,196,0.5)]" />
                        <h2 className="text-5xl font-black text-white tracking-tighter">Shop</h2>
                    </div>

                    {/* Search Bar - Integrated in flow */}
                    <div className="relative group">
                        <Input
                            placeholder="Search for products..."
                            className="h-14 pl-12 pr-12 bg-white/[0.02] border-white/5 rounded-xl focus:ring-1 focus:ring-brand-primary/20 placeholder:text-white/10 text-white font-medium transition-all group-hover:border-white/10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/10 group-focus-within:text-brand-primary/40 transition-colors" />
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <Loader2 className="w-10 h-10 text-brand-primary animate-spin" />
                        <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Loading Products...</p>
                    </div>
                ) : filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                        {filteredProducts.map((product) => (
                            <ProductCard
                                key={product.id}
                                id={product.id}
                                title={product.name}
                                price={product.price}
                                category={product.category?.name || "General"}
                                image={product.image_url || "/logo.png"}
                                productCount={product.stock_count}
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
