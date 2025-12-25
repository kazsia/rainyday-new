"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { ShoppingCart, Check, TrendingUp, ShieldAlert } from "lucide-react"
import { useCart } from "@/context/cart-context"
import { toast } from "sonner"
import { useCurrency } from "@/context/currency-context"
import { cn } from "@/lib/utils"

interface ProductCardProps {
    id: string
    title: string
    price: number
    category: string
    image: string
    productCount?: number
    priceRange?: string
    badge_links?: any[]
    status_label?: string
    status_color?: string
}

const ProductCard = React.memo(({ id, title, price, category, image, productCount = 1, priceRange, badge_links, status_label, status_color, description }: ProductCardProps & { description?: string }) => {
    const { addToCart } = useCart()
    const { formatPrice } = useCurrency()

    const isOutOfStock = productCount <= 0

    const handleQuickAdd = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (isOutOfStock) {
            toast.error("This product is out of stock")
            return
        }
        addToCart({
            id,
            title,
            price,
            quantity: 1,
            image
        })
        toast.success(`Added ${title} to cart`)
    }

    // Extract features from description (bullets)
    const features = React.useMemo(() => {
        if (!description) return ["Instant Delivery", "Secure Transaction", "24/7 Support"]
        return description.split('\n').filter(f => f.trim().length > 0).slice(0, 3)
    }, [description])

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="group relative"
        >
            <Link href={`/product/${id}`} className="block h-full">
                <div className="flex flex-col h-full bg-[#0a0a0b]/80 backdrop-blur-xl border border-white/[0.05] hover:border-brand-primary/20 rounded-[2rem] overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-2xl">
                    {/* Banner Section */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                        <Image
                            src={image}
                            alt={title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />

                        {/* Status Badge */}
                        <div className="absolute top-4 right-4 z-10">
                            <div className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border",
                                isOutOfStock
                                    ? "bg-red-500/10 border-red-500/20 text-red-400"
                                    : "bg-brand-primary/10 border-brand-primary/20 text-brand-primary"
                            )}>
                                {isOutOfStock ? "Out of Stock" : (status_label || "In Stock")}
                            </div>
                        </div>

                        {/* Bottom Gradient Fade */}
                        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/40 to-transparent" />
                    </div>

                    {/* Content Section */}
                    <div className="flex flex-col flex-1 p-6 -mt-4 relative z-10">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <h3 className="text-xl font-bold text-white leading-tight group-hover:text-brand-primary transition-colors line-clamp-2">
                                {title}
                            </h3>
                        </div>

                        {/* Feature List */}
                        <div className="flex flex-col gap-2.5 mb-8">
                            {features.map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-2.5 text-xs text-white/60 font-medium">
                                    <div className="w-4 h-4 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                                        <Check className="w-2.5 h-2.5 text-green-500" />
                                    </div>
                                    {feature}
                                </div>
                            ))}
                        </div>

                        {/* Price & Action Footer */}
                        <div className="mt-auto space-y-4">
                            <div className="flex items-end justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">
                                        Starting from
                                    </span>
                                    <div className="text-3xl font-black text-white tracking-tighter flex items-center gap-1">
                                        <span className="text-brand-primary">$</span>
                                        {formatPrice(price).replace('$', '')}
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-1">
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-brand-primary/5 border border-brand-primary/10 transition-transform group-hover:scale-105">
                                        <TrendingUp className="w-3 h-3 text-brand-primary" />
                                        <span className="text-[9px] font-bold text-brand-primary uppercase">Best Value</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleQuickAdd}
                                className={cn(
                                    "w-full h-12 rounded-xl flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-[11px] transition-all duration-300 relative overflow-hidden group/btn",
                                    isOutOfStock
                                        ? "bg-red-500/10 text-red-400 border border-red-500/20 cursor-not-allowed"
                                        : "bg-white text-black hover:bg-brand-primary hover:text-white"
                                )}
                            >
                                <div className="relative z-10 flex items-center gap-2">
                                    {isOutOfStock ? (
                                        <>
                                            <ShieldAlert className="w-4 h-4" />
                                            Currently Unavailable
                                        </>
                                    ) : (
                                        <>
                                            <ShoppingCart className="w-4 h-4" />
                                            Add to Cart
                                        </>
                                    )}
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    )
})
ProductCard.displayName = "ProductCard"

export { ProductCard }
