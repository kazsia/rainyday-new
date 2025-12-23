"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, ShieldCheck, Zap, ArrowLeft, CheckCircle2, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { SparklesText } from "@/components/ui/sparkles-text"
import * as Icons from "lucide-react"

import { useCart } from "@/context/cart-context"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { getProduct } from "@/lib/db/products"
import { Loader2 } from "lucide-react"

export default function ProductPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = React.use(paramsPromise)
    const { id } = params
    const [quantity, setQuantity] = React.useState(1)
    const [activeTab, setActiveTab] = React.useState("description")
    const [product, setProduct] = React.useState<any>(null)
    const [selectedVariant, setSelectedVariant] = React.useState<any>(null)
    const [isLoading, setIsLoading] = React.useState(true)
    const { addToCart } = useCart()
    const router = useRouter()

    React.useEffect(() => {
        async function loadProduct() {
            try {
                const data = await getProduct(id)
                console.log("[CLIENT_DIAGNOSTIC] Product data:", data)
                setProduct(data)

                // If product has variants, select the first one by default
                if (data?.variants && data.variants.length > 0) {
                    const activeVariants = data.variants
                        .filter((v: any) => v.is_active)
                        .sort((a: any, b: any) => a.sort_order - b.sort_order)

                    if (activeVariants.length > 0) {
                        // Priority: first variant with stock, otherwise the first one
                        const withStock = activeVariants.find((v: any) => v.stock_count > 0)
                        setSelectedVariant(withStock || activeVariants[0])
                    }
                }
            } catch (error) {
                console.error("Failed to load product:", error)
                toast.error("Failed to load product details")
            } finally {
                setIsLoading(false)
            }
        }
        loadProduct()
    }, [id])

    const currentPrice = selectedVariant ? selectedVariant.price : product?.price
    const currentStock = selectedVariant ? selectedVariant.stock_count : product?.stock_count
    const isOutOfStock = currentStock <= 0

    const handleAddToCart = () => {
        if (!product) return
        if (isOutOfStock) {
            toast.error("This product is out of stock")
            return
        }
        if (quantity > currentStock) {
            toast.error(`Only ${currentStock} items available in stock`)
            return
        }
        addToCart({
            id: product.id,
            title: product.name,
            price: currentPrice,
            quantity: quantity,
            image: product.image_url,
            variantId: selectedVariant?.id,
            variantName: selectedVariant?.name
        })
        toast.success(`Added ${quantity}x ${product.name}${selectedVariant ? ` (${selectedVariant.name})` : ''} to cart`)
    }

    const handleBuyNow = () => {
        if (!product) return
        if (isOutOfStock) {
            toast.error("This product is out of stock")
            return
        }
        if (quantity > currentStock) {
            toast.error(`Only ${currentStock} items available in stock`)
            return
        }
        addToCart({
            id: product.id,
            title: product.name,
            price: currentPrice,
            quantity: quantity,
            image: product.image_url,
            variantId: selectedVariant?.id,
            variantName: selectedVariant?.name
        })
        router.push("/checkout")
    }

    if (isLoading) {
        return (
            <MainLayout>
                <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4" suppressHydrationWarning>
                    <Loader2 className="w-10 h-10 text-brand-primary animate-spin" suppressHydrationWarning />
                    <p className="text-white/40 font-bold uppercase tracking-widest text-xs" suppressHydrationWarning>Loading Product...</p>
                </div>
            </MainLayout>
        )
    }

    if (!product) {
        return (
            <MainLayout>
                <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
                    <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-white/20">
                        <ShoppingCart size={40} />
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">Product Not Found</h1>
                        <p className="text-white/40 text-sm mt-2">The product you're looking for doesn't exist.</p>
                    </div>
                    <Link href="/store">
                        <Button className="bg-brand-primary text-black font-black uppercase tracking-widest px-8">
                            Back to Store
                        </Button>
                    </Link>
                </div>
            </MainLayout>
        )
    }

    const descriptionPoints = product.description?.split('\n') || [
        "Instant Delivery",
        "Lifetime Warranty",
        "24/7 Support",
        "High Quality"
    ]

    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Product Image & Tabs */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-[#0a1628] rounded-3xl border border-white/5 overflow-hidden">
                            <div className="p-8 pb-4 flex items-center justify-between">
                                <h1 className="text-2xl font-black text-white">{product.name}</h1>
                                <div className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors",
                                    product.status_color === 'red' ? "bg-red-500/10 border border-red-500/20" :
                                        product.status_color === 'orange' ? "bg-orange-500/10 border border-orange-500/20" :
                                            product.status_color === 'yellow' ? "bg-yellow-500/10 border border-yellow-500/20" :
                                                product.status_color === 'green' ? "bg-green-500/10 border border-green-500/20" :
                                                    "bg-brand-primary/10 border border-brand-primary/20"
                                )}>
                                    <div className={cn(
                                        "w-2 h-2 rounded-full animate-pulse",
                                        product.status_color === 'red' ? "bg-[#ff4b4b]" :
                                            product.status_color === 'orange' ? "bg-[#ff8c00]" :
                                                product.status_color === 'yellow' ? "bg-[#ffcc00]" :
                                                    product.status_color === 'green' ? "bg-[#00e676]" :
                                                        "bg-[#00e5ff]"
                                    )} />
                                    <span className={cn(
                                        "text-[11px] font-bold",
                                        product.status_color === 'red' ? "text-red-400" :
                                            product.status_color === 'orange' ? "text-orange-400" :
                                                product.status_color === 'yellow' ? "text-yellow-400" :
                                                    product.status_color === 'green' ? "text-green-400" :
                                                        "text-brand-primary"
                                    )}>{product.status_label || (currentStock > 0 ? "In Stock!" : "Out of Stock")}</span>
                                </div>
                            </div>

                            <div className="px-8 pb-8">
                                <Link href="/store" className="inline-flex items-center gap-2 text-xs font-bold text-white/20 hover:text-brand-primary transition-colors mb-6 group">
                                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                    Back to Store
                                </Link>
                                <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border-[1.5px] border-white/5 group shadow-2xl">
                                    <Image
                                        src={product.image_url || "/logo.png"}
                                        alt={product.name}
                                        fill
                                        sizes="(max-width: 1024px) 100vw, 66vw"
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                                    {/* Purchase Overlay */}

                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="px-8 pb-8">
                                <div className="flex gap-4 border-b border-white/5 mb-6">
                                    <button
                                        onClick={() => setActiveTab("description")}
                                        className={cn(
                                            "pb-3 text-xs font-bold tracking-wider uppercase transition-colors relative",
                                            activeTab === "description" ? "text-brand-primary" : "text-white/20 hover:text-white/40"
                                        )}
                                    >
                                        Description
                                        {activeTab === "description" && (
                                            <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("tos")}
                                        className={cn(
                                            "pb-3 text-xs font-bold tracking-wider uppercase transition-colors relative",
                                            activeTab === "tos" ? "text-brand-primary" : "text-white/20 hover:text-white/40"
                                        )}
                                    >
                                        <span className="flex items-center gap-2">
                                            🔒 Terms Of Service
                                        </span>
                                        {activeTab === "tos" && (
                                            <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
                                        )}
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {activeTab === "description" ? (
                                        descriptionPoints.map((item: string, i: number) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-brand-primary/40" />
                                                <span className="text-sm font-bold text-white/80">{item}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                                            <p className="text-sm text-white/40 leading-relaxed italic">
                                                By purchasing this product, you agree to our Terms of Service. All sales are final due to the digital nature of the product.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="space-y-6">
                        <Card className="bg-glass border-white/5 p-8 rounded-[2rem] relative overflow-hidden group shadow-2xl">
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent" />

                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <SparklesText
                                    text={`$${currentPrice.toFixed(2)}`}
                                    className="text-4xl font-black text-white tracking-tighter"
                                    sparklesCount={8}
                                />
                                <div className="text-right">
                                    <span className="text-[10px] font-black text-brand-primary/40 uppercase tracking-[0.2em] block mb-1">Status</span>
                                    <span className={cn(
                                        "text-xs font-black",
                                        product.status_color === 'red' ? "text-red-400" :
                                            product.status_color === 'orange' ? "text-orange-400" :
                                                product.status_color === 'yellow' ? "text-yellow-400" :
                                                    product.status_color === 'green' ? "text-green-400" :
                                                        "text-brand-primary"
                                    )}>{product.status_label || (currentStock > 0 ? "In Stock" : "Out of Stock")}</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2.5 mb-10 relative z-10">
                                {product.badge_links?.map((link: any, idx: number) => {
                                    const badge = link?.badge
                                    if (!badge) return null
                                    const Icon = (Icons as any)[badge.icon] || Icons.Zap
                                    return (
                                        <div
                                            key={idx}
                                            className={cn(
                                                "font-black text-[9px] rounded-lg px-3 py-1.5 gap-2 uppercase tracking-widest shadow-lg border flex items-center transition-all hover:scale-105",
                                                badge.color
                                            )}
                                        >
                                            <Icon className="w-3 h-3" />
                                            {badge.name}
                                        </div>
                                    )
                                })}
                                {(!product.badge_links || product.badge_links.length === 0) && (
                                    <div className="bg-brand-primary/10 text-brand-primary border-brand-primary/20 font-black text-[9px] rounded-lg px-3 py-1.5 gap-2 uppercase tracking-widest border flex items-center shadow-lg">
                                        <ShieldCheck className="w-3 h-3" />
                                        AUTHENTIC PRODUCT
                                    </div>
                                )}
                            </div>

                            {/* Variant Selection */}
                            {product.variants && product.variants.length > 0 && (
                                <div className="mb-10 relative z-10">
                                    <p className="text-[10px] font-black text-white/20 mb-4 ml-1 uppercase tracking-[0.3em]">Select Option</p>
                                    <div className="grid grid-cols-1 gap-2.5">
                                        {product.variants
                                            .filter((v: any) => v.is_active)
                                            .sort((a: any, b: any) => a.sort_order - b.sort_order)
                                            .map((variant: any) => (
                                                <button
                                                    key={variant.id}
                                                    onClick={() => setSelectedVariant(variant)}
                                                    className={cn(
                                                        "w-full p-4 rounded-2xl border transition-all text-left group/var relative overflow-hidden",
                                                        selectedVariant?.id === variant.id
                                                            ? "bg-brand-primary/10 border-brand-primary shadow-[0_0_20px_rgba(var(--brand-rgb),0.1)]"
                                                            : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10"
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between relative z-10">
                                                        <div className="space-y-0.5">
                                                            <p className={cn(
                                                                "text-xs font-black uppercase tracking-wider",
                                                                selectedVariant?.id === variant.id ? "text-brand-primary" : "text-white/60"
                                                            )}>{variant.name}</p>
                                                            <p className="text-[10px] text-white/20 font-bold">{variant.stock_count} in stock</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className={cn(
                                                                "text-sm font-black",
                                                                selectedVariant?.id === variant.id ? "text-white" : "text-white/40"
                                                            )}>${variant.price.toFixed(2)}</p>
                                                        </div>
                                                    </div>
                                                    {selectedVariant?.id === variant.id && (
                                                        <motion.div
                                                            layoutId="variant-glow"
                                                            className="absolute inset-0 bg-brand-primary/5 blur-xl pointer-events-none"
                                                        />
                                                    )}
                                                </button>
                                            ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-8 relative z-10">
                                <div>
                                    <p className="text-[10px] font-black text-white/20 mb-4 ml-1 uppercase tracking-[0.3em]">Quantity</p>
                                    <div className="flex items-center bg-white/[0.02] rounded-2xl border border-white/5 p-1 transition-colors group-hover:border-white/10">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="w-12 h-12 flex items-center justify-center text-white/20 hover:text-brand-primary hover:bg-white/5 rounded-xl transition-all"
                                        >
                                            —
                                        </button>
                                        <input
                                            type="number"
                                            value={quantity}
                                            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                            className="flex-1 bg-transparent text-center text-base font-black text-white outline-none"
                                        />
                                        <button
                                            onClick={() => setQuantity(quantity + 1)}
                                            className="w-12 h-12 flex items-center justify-center text-white/20 hover:text-brand-primary hover:bg-white/5 rounded-xl transition-all"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Button
                                        onClick={handleAddToCart}
                                        disabled={isOutOfStock}
                                        className={cn(
                                            "w-full h-16 font-black text-sm uppercase tracking-[0.2em] gap-3 rounded-2xl shadow-xl transition-all active:scale-[0.98]",
                                            isOutOfStock
                                                ? "bg-white/10 text-white/40 cursor-not-allowed shadow-none"
                                                : "bg-brand-primary hover:bg-brand-accent text-black shadow-brand-primary/20"
                                        )}
                                    >
                                        {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                                        <ShoppingCart className="w-5 h-5" />
                                    </Button>
                                    <Button
                                        onClick={handleBuyNow}
                                        disabled={isOutOfStock}
                                        variant="outline"
                                        className={cn(
                                            "w-full h-16 font-black text-sm uppercase tracking-[0.2em] gap-3 rounded-2xl transition-all active:scale-[0.98]",
                                            isOutOfStock
                                                ? "bg-white/5 border-white/5 text-white/20 cursor-not-allowed"
                                                : "bg-white/[0.02] border border-white/5 text-white/60 hover:text-white hover:bg-white/[0.05]"
                                        )}
                                    >
                                        {isOutOfStock ? "Unavailable" : "Buy Now"}
                                        <ArrowRight className="w-5 h-5 opacity-40 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </div>


                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </MainLayout>
    )
}
