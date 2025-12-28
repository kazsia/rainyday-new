"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { ShoppingCart, Check, TrendingUp, ShieldAlert, Zap, Loader2 } from "lucide-react"
import { useCart } from "@/context/cart-context"
import { toast } from "sonner"
import { useCurrency } from "@/context/currency-context"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import AnimatedGenerateButton from "@/components/ui/animated-generate-button"
import { Button as ThreeDButton } from "@/components/ui/3d-button"

interface ProductCardProps {
    id: string
    title: string
    price: number
    category: string
    image: string
    slug?: string
    productCount?: number
    priceRange?: string
    badge_links?: any[]
    status_label?: string
    status_color?: string
    delivery_type?: string
    is_unlimited?: boolean
}

const ProductCard = React.memo(({ id, title, price, category, image, slug, productCount = 1, priceRange, badge_links, status_label, status_color, delivery_type, is_unlimited, description }: ProductCardProps & { description?: string }) => {
    const { addToCart } = useCart()
    const { formatPrice } = useCurrency()
    const [imageLoaded, setImageLoaded] = React.useState(false)

    // Use slug for URL if available, otherwise use id
    const productUrl = slug ? `/product/${slug}` : `/product/${id}`

    const isNitro = title.toLowerCase().includes('nitro')
    const isBoost = title.toLowerCase().includes('boost')
    const isToken = title.toLowerCase().includes('token')
    const hasDefaultImage = image === '/logo.png' || !image

    const effectiveIsUnlimited = is_unlimited || (delivery_type !== 'serials' && is_unlimited === undefined) // Fallback for transition
    const isOutOfStock = !effectiveIsUnlimited && (productCount <= 0)

    const [isBuyingNow, setIsBuyingNow] = React.useState(false)
    const router = useRouter()

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

    const handleBuyNow = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (isOutOfStock) {
            toast.error("This product is out of stock")
            return
        }
        router.push(productUrl)
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
            <Link href={productUrl} className="block h-full">
                <div className="flex flex-col h-full bg-[#0a0a0b]/80 backdrop-blur-xl border border-white/[0.05] hover:border-brand-primary/20 rounded-md overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-2xl">
                    {/* Banner Section */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                        {!imageLoaded && (
                            <div className="absolute inset-0 bg-white/5 animate-pulse" />
                        )}

                        {(hasDefaultImage && (isNitro || isBoost || isToken)) ? (
                            <div className={cn(
                                "absolute inset-0 flex items-center justify-center bg-gradient-to-br transition-transform duration-700 group-hover:scale-110",
                                isNitro ? "from-[#5865F2]/20 via-[#43b581]/10 to-transparent" :
                                    isBoost ? "from-[#ff73fa]/20 via-[#5865F2]/10 to-transparent" :
                                        "from-brand-primary/20 via-brand-primary/5 to-transparent"
                            )}>
                                <div className="relative">
                                    <div className={cn(
                                        "absolute inset-0 blur-3xl rounded-full scale-150 animate-pulse",
                                        isNitro ? "bg-[#43b581]/20" : isBoost ? "bg-[#ff73fa]/20" : "bg-brand-primary/20"
                                    )} />
                                    <div className="font-black text-4xl tracking-tighter opacity-20 group-hover:opacity-40 transition-opacity">
                                        {isNitro ? "NITRO" : isBoost ? "BOOST" : "TOKEN"}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <Image
                                src={image || "/logo.png"}
                                alt={title}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className={cn(
                                    "object-cover transition-transform duration-700 group-hover:scale-110",
                                    !imageLoaded && "opacity-0"
                                )}
                                onLoad={() => setImageLoaded(true)}
                            />
                        )}

                        {/* Status Badge */}
                        <div className="absolute top-4 right-4 z-10">
                            <div className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border",
                                isOutOfStock
                                    ? "bg-red-500/10 border-red-500/20 text-red-400"
                                    : "bg-brand-primary/10 border-brand-primary/20 text-brand-primary"
                            )}>
                                {isOutOfStock ? "Out of Stock" : (status_label || (effectiveIsUnlimited ? "In Stock" : `${productCount} In Stock`))}
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

                        <div className="mt-auto space-y-3">
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

                            </div>

                            <div className="grid grid-cols-2 gap-3 items-center">
                                {isOutOfStock ? (
                                    <div className="col-span-2">
                                        <ThreeDButton
                                            disabled
                                            variant="destructive"
                                            className="w-full h-11 text-[10px] uppercase font-black tracking-widest opacity-50"
                                        >
                                            <ShieldAlert className="w-4 h-4 mr-2" />
                                            Out of Stock
                                        </ThreeDButton>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-full h-11">
                                            <AnimatedGenerateButton
                                                labelIdle="Add to Cart"
                                                labelActive="Adding..."
                                                onClick={handleQuickAdd}
                                                disabled={isBuyingNow}
                                                highlightHueDeg={210} // Cyan highlight
                                                Icon={ShoppingCart}
                                                hFull
                                                className="text-[9px]"
                                            />
                                        </div>

                                        <div className="w-full h-11">
                                            <AnimatedGenerateButton
                                                labelIdle="Buy Now"
                                                labelActive="Processing..."
                                                generating={isBuyingNow}
                                                onClick={handleBuyNow}
                                                disabled={isBuyingNow}
                                                highlightHueDeg={45} // Gold highlight
                                                hFull
                                                className="text-[9px]"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    )
})
ProductCard.displayName = "ProductCard"

export { ProductCard }
