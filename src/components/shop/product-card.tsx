"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { ShoppingCart } from "lucide-react"
import * as Icons from "lucide-react"
import { SparklesText } from "@/components/ui/sparkles-text"
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

const ProductCard = React.memo(({ id, title, price, category, image, productCount = 1, priceRange, badge_links, status_label, status_color }: ProductCardProps) => {
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

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="group relative"
        >
            <Link href={`/product/${id}`} className="block h-full">
                <div className="flex flex-col h-full bg-card hover:bg-accent/20 border border-border hover:border-brand-primary/30 rounded-2xl p-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-primary/5">
                    {/* Image Container */}
                    <div className="relative aspect-[16/9] rounded-xl overflow-hidden mb-3 bg-black/20">
                        {/* Badges Overlay */}
                        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1.5">
                            {badge_links?.map((link, idx) => {
                                const badge = link?.badge
                                if (!badge) return null
                                const Icon = (Icons as any)[badge.icon] || Icons.Zap
                                return (
                                    <div key={idx} className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 bg-background/90 backdrop-blur border border-white/10 text-white shadow-sm")}>
                                        <Icon className="w-3 h-3 text-brand-primary" />
                                        {badge.name}
                                    </div>
                                )
                            })}
                        </div>

                        <Image
                            src={image}
                            alt={title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                    </div>

                    {/* Content */}
                    <div className="flex flex-col flex-1 gap-2 px-1">
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="text-base font-bold text-white leading-tight group-hover:text-brand-primary transition-colors line-clamp-2">
                                {title}
                            </h3>
                        </div>

                        <div className="mt-auto flex items-end justify-between">
                            <div className="flex flex-col">
                                <span className={cn("text-[10px] font-bold uppercase tracking-wider mb-0.5", isOutOfStock ? "text-red-400" : "text-muted-foreground")}>
                                    {isOutOfStock ? "Sold Out" : "Instant Delivery"}
                                </span>
                                <div className="text-lg font-black text-brand-primary tracking-tight">
                                    {priceRange || formatPrice(price)}
                                </div>
                            </div>

                            {!isOutOfStock && (
                                <button
                                    onClick={handleQuickAdd}
                                    className="w-8 h-8 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center hover:bg-brand-primary hover:text-black transition-all"
                                >
                                    <ShoppingCart className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    )
})
ProductCard.displayName = "ProductCard"

export { ProductCard }
