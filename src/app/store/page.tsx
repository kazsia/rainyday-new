"use client"

import * as React from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { ProductCard } from "@/components/shop/product-display-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, ShoppingCart, Loader2, ChevronDown, Package2, FolderTree, X, ShoppingBag, Hash } from "lucide-react"
import { cn } from "@/lib/utils"
import { getProducts, getCategories } from "@/lib/db/products"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CategoryDisplayCard } from "@/components/shop/category-display-card"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

export default function StorePage() {
    const [searchQuery, setSearchQuery] = React.useState("")
    const [products, setProducts] = React.useState<any[]>([])
    const [categories, setCategories] = React.useState<any[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [sortBy, setSortBy] = React.useState("default")
    const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | "all">("all")
    const [activeGroup, setActiveGroup] = React.useState<any | null>(null)
    const [isMounted, setIsMounted] = React.useState(false)

    React.useEffect(() => {
        setIsMounted(true)
    }, [])

    React.useEffect(() => {
        async function loadData() {
            try {
                const [productsData, categoriesData] = await Promise.all([
                    getProducts(),
                    getCategories()
                ])
                setProducts(productsData)
                setCategories(categoriesData)
            } catch (error) {
                console.error("Failed to load store data:", error)
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [])

    const { standaloneProducts, aggregatedCategories } = React.useMemo(() => {
        let filtered = [...products]

        // Search Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter((product) => {
                const matchName = product.name?.toLowerCase().includes(query)
                const matchDesc = product.description?.toLowerCase().includes(query)
                const matchCategory = product.category?.name?.toLowerCase().includes(query)
                return matchName || matchDesc || matchCategory
            })
        }
        // Category Filter
        if (selectedCategoryId !== "all") {
            filtered = filtered.filter(p => p.category_id === selectedCategoryId)
        }

        // Sorting
        filtered.sort((a, b) => {
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
                    return 0
            }
        })

        const standalone = filtered.filter(p => !p.category_id)

        const categoriesWithData = categories
            .map(cat => {
                const catProducts = filtered.filter(p => p.category_id === cat.id)
                if (catProducts.length === 0) return null

                const prices = catProducts.map(p => p.price)
                return {
                    ...cat,
                    products: catProducts,
                    minPrice: Math.min(...prices),
                    maxPrice: Math.max(...prices),
                    count: catProducts.length
                }
            })
            .filter(Boolean) as any[]

        return {
            standaloneProducts: standalone,
            aggregatedCategories: categoriesWithData
        }
    }, [products, categories, searchQuery, sortBy, selectedCategoryId])


    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8" suppressHydrationWarning={true}>
                {/* Search & Filter Row */}
                <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
                    {/* Search Bar */}
                    <div className="relative flex-1 group">
                        <Input
                            placeholder="Search for a product..."
                            className="h-12 pl-12 pr-4 bg-[#0f1219] border-[#1e232d] rounded-lg focus-visible:ring-1 focus-visible:ring-brand-primary focus-visible:border-brand-primary placeholder:text-muted-foreground/50 text-white font-medium transition-all group-hover:border-white/10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-brand-primary/60 transition-colors" />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                        {/* Sort Dropdown */}
                        <div className="w-full sm:w-56 relative">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="w-full h-12 px-4 bg-[#0f1219] border border-[#1e232d] rounded-lg flex items-center justify-between text-muted-foreground hover:border-brand-primary/50 hover:text-white transition-all text-sm font-medium focus:outline-none focus:ring-1 focus:ring-brand-primary/20">
                                        <span className="flex items-center gap-2">
                                            <span className="opacity-50">Sort:</span>
                                            <span className="text-white capitalize">{sortBy.replace("-", " ")}</span>
                                        </span>
                                        <Filter className="w-4 h-4 opacity-50" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 bg-[#0f1219] border-[#1e232d] text-white p-1">
                                    {[
                                        { id: "default", label: "Default" },
                                        { id: "price-asc", label: "Price: Low to High" },
                                        { id: "price-desc", label: "Price: High to Low" },
                                        { id: "name", label: "Name (A-Z)" },
                                        { id: "newest", label: "Newest Arrivals" }
                                    ].map((opt) => (
                                        <DropdownMenuItem
                                            key={opt.id}
                                            onClick={() => setSortBy(opt.id)}
                                            className={cn(
                                                "rounded-lg cursor-pointer transition-colors",
                                                sortBy === opt.id ? "bg-brand-primary/10 text-brand-primary" : "hover:bg-white/5"
                                            )}
                                        >
                                            {opt.label}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>

                {/* Categories Navigation */}
                {!isLoading && categories.length > 0 && (
                    <>
                        {/* Mobile Category Grid */}
                        <div className="grid grid-cols-2 gap-3 md:hidden mb-8">
                            <Button
                                onClick={() => setSelectedCategoryId("all")}
                                className={cn(
                                    "col-span-2 h-14 rounded-xl text-sm font-black uppercase tracking-widest transition-all relative overflow-hidden group border",
                                    selectedCategoryId === "all"
                                        ? "bg-brand-primary text-black border-brand-primary shadow-[0_0_30px_rgba(var(--brand-primary-rgb),0.3)]"
                                        : "bg-[#0f1219] border-[#1e232d] text-muted-foreground hover:text-white hover:border-white/20"
                                )}
                            >
                                <div className="relative z-10 flex items-center justify-center gap-2">
                                    <ShoppingBag className="w-4 h-4" />
                                    All Products
                                </div>
                                {selectedCategoryId === "all" && (
                                    <div className="absolute inset-0 bg-white/20 blur-xl group-hover:bg-white/30 transition-colors" />
                                )}
                            </Button>

                            {categories.map((cat) => (
                                <Button
                                    key={cat.id}
                                    onClick={() => setSelectedCategoryId(cat.id)}
                                    className={cn(
                                        "h-12 rounded-xl text-xs font-bold uppercase tracking-wider transition-all relative overflow-hidden group border",
                                        selectedCategoryId === cat.id
                                            ? "bg-brand-primary/10 text-brand-primary border-brand-primary shadow-[0_0_20px_rgba(var(--brand-primary-rgb),0.2)]"
                                            : "bg-[#0f1219] border-[#1e232d] text-muted-foreground hover:text-white hover:border-white/20"
                                    )}
                                >
                                    <div className="relative z-10 flex items-center justify-center gap-2">
                                        {/* Since we don't have icons in DB, we'll use a generic icon or nothing for now, 
                                            but to match the reference 'Tools', 'SMM', etc style, text is key. 
                                            The reference has icons, so let's try to infer or just use a generic one. */}
                                        <Hash className="w-3 h-3 opacity-50" />
                                        {cat.name}
                                    </div>
                                    {selectedCategoryId === cat.id && (
                                        <div className="absolute inset-0 bg-brand-primary/5 blur-md" />
                                    )}
                                </Button>
                            ))}
                        </div>

                        {/* Desktop Horizontal List */}
                        <div className="hidden md:flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                            <Button
                                onClick={() => setSelectedCategoryId("all")}
                                className={cn(
                                    "h-10 px-6 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
                                    selectedCategoryId === "all"
                                        ? "bg-brand-primary text-black shadow-[0_0_20px_rgba(var(--brand-primary-rgb),0.3)]"
                                        : "bg-[#0f1219] border border-[#1e232d] text-muted-foreground hover:text-white hover:border-white/10"
                                )}
                            >
                                All Products
                            </Button>
                            {categories.map((cat) => (
                                <Button
                                    key={cat.id}
                                    onClick={() => setSelectedCategoryId(cat.id)}
                                    className={cn(
                                        "h-10 px-6 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                                        selectedCategoryId === cat.id
                                            ? "bg-brand-primary text-black shadow-[0_0_20px_rgba(var(--brand-primary-rgb),0.3)]"
                                            : "bg-[#0f1219] border border-[#1e232d] text-muted-foreground hover:text-white hover:border-white/10"
                                    )}
                                >
                                    {cat.name}
                                </Button>
                            ))}
                        </div>
                    </>
                )}

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-brand-primary/20 blur-2xl rounded-full scale-150 animate-pulse" />
                            <Loader2 className="w-12 h-12 text-brand-primary animate-spin relative" />
                        </div>
                        <p className="text-white/40 font-black uppercase tracking-widest text-[10px]">Filtering through digital inventory...</p>
                    </div>
                ) : (standaloneProducts.length > 0 || aggregatedCategories.length > 0) ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-700">
                        {/* Render Categories first */}
                        {aggregatedCategories.map((cat) => (
                            <CategoryDisplayCard
                                key={cat.id}
                                name={cat.name}
                                productCount={cat.count}
                                minPrice={cat.minPrice}
                                maxPrice={cat.maxPrice}
                                onClick={() => setActiveGroup(cat)}
                            />
                        ))}

                        {/* Render Standalone Products */}
                        {standaloneProducts.map((product) => (
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
                    <div className="py-32 text-center animate-in zoom-in-95 duration-500">
                        <div className="inline-flex p-8 rounded-[2.5rem] bg-[#0f1219] border border-[#1e232d] mb-8 relative group">
                            <div className="absolute inset-0 bg-brand-primary/5 blur-3xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                            <Search className="w-16 h-16 text-white/5 relative" />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">No products found</h3>
                        <p className="text-muted-foreground/40 text-sm max-w-sm mx-auto font-medium">We couldn't find anything matching your search criteria.</p>

                        <Button
                            variant="ghost"
                            onClick={() => {
                                setSearchQuery("")
                                setSortBy("default")
                            }}
                            className="mt-8 text-brand-primary hover:text-brand-primary hover:bg-brand-primary/5 font-black uppercase tracking-widest text-[10px]"
                        >
                            Reset filters
                        </Button>
                    </div>
                )}
            </div>

            <Dialog open={!!activeGroup} onOpenChange={(open) => !open && setActiveGroup(null)}>
                <DialogContent
                    showCloseButton={false}
                    className="fixed inset-0 z-[100] !w-[100vw] !h-[100vh] !max-w-none !max-h-none bg-[#0a0a0b] border-none text-white overflow-hidden flex flex-col p-0 gap-0 rounded-none !m-0 !translate-x-0 !translate-y-0 !top-0 !left-0"
                >
                    <DialogHeader className="p-8 lg:p-12 border-b border-white/5 flex flex-row items-center justify-between shrink-0">
                        <div className="space-y-1">
                            <DialogTitle className="text-3xl font-black tracking-tight uppercase">{activeGroup?.name}</DialogTitle>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                                    {activeGroup?.count} Products Available
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => setActiveGroup(null)}
                            className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group"
                        >
                            <X className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
                        </button>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 lg:gap-10">
                            {activeGroup?.products.map((product: any) => (
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
                    </div>

                </DialogContent>
            </Dialog>
        </MainLayout>
    )
}

