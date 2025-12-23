"use client"

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

export function ProductCard({ id, title, price, category, image, productCount = 1, priceRange, badge_links, status_label, status_color }: ProductCardProps) {
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
            className="group"
        >
            <Link href={`/product/${id}`} className="block">
                <div className="space-y-4">
                    {/* Image Container with Glow */}
                    <div className="relative aspect-[16/9] rounded-[1.5rem] overflow-hidden border border-brand-primary/10 group-hover:border-brand-primary/30 transition-all duration-500 shadow-2xl">
                        {/* The Glow Effect - specifically on the image box */}
                        <div className="absolute inset-0 z-10 pointer-events-none border-[1.5px] border-brand-primary/20 rounded-[1.5rem] shadow-[0_0_20px_rgba(38,188,196,0.15)] group-hover:shadow-[0_0_30px_rgba(38,188,196,0.25)] transition-all duration-500" />

                        <Image
                            src={image}
                            alt={title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100"
                        />

                        {/* Dark Overlay for better text separation */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover:opacity-20 transition-all duration-500" />

                        {/* Green Glow Vignette (inspired by reference) */}
                        <div className="absolute inset-0 bg-brand-primary/5 group-hover:bg-brand-primary/10 transition-colors duration-500" />

                        {/* Real Badges */}
                        <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2">
                            {badge_links?.map((link, idx) => {
                                const badge = link?.badge
                                if (!badge) return null
                                const Icon = (Icons as any)[badge.icon] || Icons.Zap
                                return (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter flex items-center gap-1.5 border shadow-lg backdrop-blur-md",
                                            badge.color
                                        )}
                                    >
                                        <Icon className="w-2.5 h-2.5" />
                                        {badge.name}
                                    </div>
                                )
                            })}
                        </div>

                        {/* Quick Add Button / Sold Out Badge */}
                        {isOutOfStock ? (
                            <div className="absolute bottom-4 right-4 z-20 px-4 py-2 bg-red-500/90 text-white rounded-xl flex items-center justify-center shadow-lg">
                                <span className="text-xs font-black uppercase tracking-wider">Sold Out</span>
                            </div>
                        ) : (
                            <button
                                onClick={handleQuickAdd}
                                className="absolute bottom-4 right-4 z-20 w-11 h-11 bg-brand-primary text-black rounded-xl flex items-center justify-center shadow-lg lg:translate-y-12 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 transition-all duration-500 hover:scale-110 active:scale-95"
                            >
                                <ShoppingCart className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {/* Metadata Section */}
                    <div className="px-2 space-y-1">
                        <h3 className="text-xl font-black text-white tracking-tight group-hover:text-brand-primary transition-colors duration-300">
                            {title}
                        </h3>
                        <p className={cn(
                            "text-[13px] font-bold uppercase tracking-widest",
                            status_color === 'red' ? "text-red-400" :
                                status_color === 'orange' ? "text-orange-400" :
                                    status_color === 'yellow' ? "text-yellow-400" :
                                        status_color === 'green' ? "text-green-400" :
                                            status_color === 'blue' ? "text-brand-primary" :
                                                isOutOfStock ? "text-red-400" : "text-white/20"
                        )}>
                            {status_label || (isOutOfStock ? 'Out of Stock' : `${productCount} In Stock`)}
                        </p>
                        <SparklesText
                            text={priceRange || formatPrice(price)}
                            className="text-[15px] font-black text-brand-primary mt-1"
                            sparklesCount={5}
                        />
                    </div>
                </div>
            </Link>
        </motion.div>
    )
}
