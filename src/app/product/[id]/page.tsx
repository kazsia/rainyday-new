"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart } from "lucide-react"
import { ArrowLeft } from "lucide-react"
import { CheckCircle2 } from "lucide-react"
import { ArrowRight } from "lucide-react"
import { Minus } from "lucide-react"
import { Plus } from "lucide-react"
import { Zap } from "lucide-react"
import { Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { SparklesText } from "@/components/ui/sparkles-text"
import { createOrder } from "@/lib/db/orders"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import AnimatedGenerateButton from "@/components/ui/animated-generate-button"
import { Button as ThreeDButton } from "@/components/ui/3d-button"

import { useCart } from "@/context/cart-context"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/sonner"

import { getProduct } from "@/lib/db/products"

export default function ProductPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = React.use(paramsPromise)
  const { id } = params
  const [quantity, setQuantity] = React.useState(1)
  const [inputValue, setInputValue] = React.useState("1")
  const [activeTab, setActiveTab] = React.useState("description")
  const [product, setProduct] = React.useState<any>(null)
  const [selectedVariant, setSelectedVariant] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const { addToCart } = useCart()
  const router = useRouter()
  const [isBuyingNow, setIsBuyingNow] = React.useState(false)
  const [isAddingToCart, setIsAddingToCart] = React.useState(false)

  React.useEffect(() => {
    async function loadProduct() {
      try {
        const data = await getProduct(id)
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

  // Calculate effective stock based on payment_restrictions_enabled and variants
  const stockDeliveryEnabled = product?.payment_restrictions_enabled

  // When Stock & Delivery is enabled, always use product-level values (ignore variants)
  const effectiveVariant = stockDeliveryEnabled ? null : selectedVariant

  const minQty = effectiveVariant?.min_quantity || product?.min_quantity || 1
  const maxQty = effectiveVariant?.max_quantity || product?.max_quantity || 1000000
  const currentPrice = effectiveVariant ? effectiveVariant.price : product?.price
  const slashedPrice = effectiveVariant?.slashed_price || product?.slashed_price

  const hasVariants = product?.variants && product.variants.filter((v: any) => v.is_active).length > 0

  let currentStock = 0
  let isUnlimited = false

  if (stockDeliveryEnabled) {
    // Stock & Delivery is enabled - always use product-level stock (ignore variants)
    currentStock = product?.stock_count || 0
    isUnlimited = product?.is_unlimited || false
  } else if (selectedVariant) {
    // Stock & Delivery disabled + variant selected - use variant stock
    currentStock = selectedVariant.stock_count || 0
    isUnlimited = selectedVariant.is_unlimited || false
  } else if (hasVariants) {
    // Stock & Delivery disabled but has variants - sum of variant stock
    currentStock = product.variants.filter((v: any) => v.is_active).reduce((sum: number, v: any) => sum + (v.stock_count || 0), 0)
    isUnlimited = product.variants.some((v: any) => v.is_active && v.is_unlimited)
  } else {
    // Stock & Delivery disabled and no variants - stock is 0
    currentStock = 0
    isUnlimited = false
  }

  const isOutOfStock = !isUnlimited && (currentStock <= 0)
  const totalPrice = currentPrice * quantity

  // Synchronize initial quantity with min_quantity when variant changes (only on variant/product change)
  const prevVariantId = React.useRef(selectedVariant?.id)
  const prevProductId = React.useRef(product?.id)

  React.useEffect(() => {
    // Only run when variant or product actually changes (not on every stock recalc)
    if (prevVariantId.current === selectedVariant?.id && prevProductId.current === product?.id) {
      return
    }
    prevVariantId.current = selectedVariant?.id
    prevProductId.current = product?.id

    const currentMin = effectiveVariant?.min_quantity || product?.min_quantity || 1
    const newQty = Math.max(1, currentMin)
    setQuantity(newQty)
    setInputValue(String(newQty))
  }, [selectedVariant?.id, product?.id, effectiveVariant?.min_quantity, product?.min_quantity])

  const handleAddToCart = () => {
    if (!product) return
    if (isOutOfStock) {
      toast.error("This product is out of stock")
      return
    }
    if (quantity < minQty) {
      toast.error(`Minimum order quantity is ${minQty}`)
      return
    }
    if (!isUnlimited && quantity > Math.min(maxQty, currentStock)) {
      if (quantity > currentStock) {
        toast.error(`Only ${currentStock} items available in stock`)
      } else {
        toast.error(`Maximum order quantity is ${maxQty}`)
      }
      return
    }
    setIsAddingToCart(true)
    addToCart({
      id: product.id,
      title: product.name,
      price: currentPrice,
      quantity: quantity,
      image: product.image_url,
      variantId: effectiveVariant?.id,
      variantName: effectiveVariant?.name,
      min_quantity: minQty,
      max_quantity: maxQty,
      custom_fields: product.custom_fields,
      is_unlimited: isUnlimited,
      delivery_type: effectiveVariant?.delivery_type || product.delivery_type
    })
    toast.success(`Added ${quantity}x ${product.name}${effectiveVariant ? ` (${effectiveVariant.name})` : ''} to cart`)
    setTimeout(() => setIsAddingToCart(false), 600)
  }

  const handleBuyNow = async () => {
    if (!product) return
    if (isOutOfStock) {
      toast.error("This product is out of stock")
      return
    }
    if (quantity < minQty) {
      toast.error(`Minimum order quantity is ${minQty}`)
      return
    }
    if (!isUnlimited && quantity > Math.min(maxQty, currentStock)) {
      if (quantity > currentStock) {
        toast.error(`Only ${currentStock} items available in stock`)
      } else {
        toast.error(`Maximum order quantity is ${maxQty}`)
      }
      return
    }

    setIsBuyingNow(true)
    try {
      const order = await createOrder({
        total: currentPrice * quantity,
        items: [{
          product_id: product.id,
          variant_id: effectiveVariant?.id || null,
          quantity: quantity,
          price: currentPrice
        }],
        custom_fields: product.custom_fields ? {} : null // Initialize empty object for values if product has field definitions
      })
      router.push(`/checkout/${order.readable_id}`)
    } catch (error) {
      console.error("Failed to start checkout:", error)
      toast.error("Failed to start checkout. Please try again.")
      setIsBuyingNow(false)
    }
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
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Product Not Found</h1>
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

  const descriptionPoints = product.description
    ? product.description
      .replace(/<[^>]*>/g, '') // Strip HTML tags
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
    : [
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
            <div className="bg-background rounded-3xl border border-white/5 overflow-hidden">
              <div className="p-8 pb-4 flex items-center justify-between">
                <h1 className="text-2xl font-black text-white">{product.name}</h1>
                {product.status_label && (
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
                    )}>{product.status_label}</span>
                  </div>
                )}
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
                </div>
              </div>

              {/* Description */}
              <div className="px-8 pb-8">
                <div className="border-b border-white/5 mb-6 pb-3">
                  <h3 className="text-xs font-bold tracking-wider uppercase text-brand-primary">Description</h3>
                </div>

                <div className="space-y-3">
                  {descriptionPoints.map((item: string, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-primary/40" />
                      <span className="text-sm font-bold text-white/80">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Premium Purchase Card with Glow Effect */}
            <div className="relative rounded-[2rem]">
              <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={100}
                inactiveZone={0.5}
                borderWidth={2}
              />
              <Card className="bg-[#0a1214]/90 backdrop-blur-xl border-white/[0.08] p-8 rounded-[2rem] relative overflow-hidden shadow-2xl">
                {/* Gradient accent lines */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-primary/40 to-transparent" />
                <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-brand-primary/20 via-transparent to-transparent" />

                {/* Subtle mesh gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/[0.03] via-transparent to-transparent pointer-events-none" />

                {/* Price Display */}
                <div className="flex items-start justify-between mb-6 relative z-10">
                  <div>
                    <div className="flex items-baseline gap-3">
                      <SparklesText
                        text={`$${currentPrice.toFixed(2)}`}
                        className="text-4xl font-black text-white tracking-tighter"
                        sparklesCount={8}
                      />
                      {slashedPrice && slashedPrice > currentPrice && (
                        <span className="text-xl font-bold text-white/30 line-through decoration-red-500/60 decoration-2">
                          ${slashedPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">per item</p>
                  </div>
                  <div className="text-right">
                    {product.status_label ? (
                      <>
                        <span className="text-[10px] font-black text-brand-primary/40 uppercase tracking-[0.2em] block mb-1">Status</span>
                        <span className={cn(
                          "text-xs font-black",
                          product.status_color === 'red' ? "text-red-400" :
                            product.status_color === 'orange' ? "text-orange-400" :
                              product.status_color === 'yellow' ? "text-yellow-400" :
                                product.status_color === 'green' ? "text-green-400" :
                                  "text-brand-primary"
                        )}>{product.status_label}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-[10px] font-black text-brand-primary/40 uppercase tracking-[0.2em] block mb-1">Stock</span>
                        <span className="text-xs font-black text-brand-primary">
                          {isUnlimited ? "In Stock" : `${currentStock}`}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2.5 mb-8 relative z-10">
                  {product.badge_links?.map((link: any, idx: number) => {
                    const badge = link?.badge
                    if (!badge) return null
                    const Icon = (CheckCircle2) // Fallback to CheckCircle2 if dynamic icons cause issues
                    return (
                      <motion.div
                        key={idx}
                        whileHover={{ scale: 1.05 }}
                        className={cn(
                          "font-black text-[9px] rounded-lg px-3 py-1.5 gap-2 uppercase tracking-widest shadow-lg border flex items-center transition-all",
                          badge.color
                        )}
                      >
                        <Icon className="w-3 h-3" />
                        {badge.name}
                      </motion.div>
                    )
                  })}
                </div>

                {/* Variant Selection - only show if more than 1 active variant AND Stock & Delivery is disabled */}
                {!stockDeliveryEnabled && product.variants && product.variants.filter((v: any) => v.is_active).length > 1 && (
                  <div className="mb-8 relative z-10">
                    <p className="text-[10px] font-black text-white/20 mb-4 ml-1 uppercase tracking-[0.3em]">Select Option</p>
                    <div className="grid grid-cols-1 gap-2.5">
                      {product.variants
                        .filter((v: any) => v.is_active)
                        .sort((a: any, b: any) => a.sort_order - b.sort_order)
                        .map((variant: any) => (
                          <motion.button
                            key={variant.id}
                            onClick={() => setSelectedVariant(variant)}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className={cn(
                              "w-full p-4 rounded-2xl border transition-all text-left relative overflow-hidden",
                              selectedVariant?.id === variant.id
                                ? "bg-brand-primary/10 border-brand-primary/50 shadow-[0_0_30px_rgba(164,248,255,0.1)]"
                                : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10"
                            )}
                          >
                            <div className="flex items-center justify-between relative z-10">
                              <div className="space-y-0.5">
                                <p className={cn(
                                  "text-xs font-black uppercase tracking-wider",
                                  selectedVariant?.id === variant.id ? "text-brand-primary" : "text-white/60"
                                )}>{variant.name}</p>
                                <div className="flex items-center justify-between gap-1 mt-1">
                                  <span className="text-[14px] font-bold text-white tracking-tight">${variant.price.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                            {selectedVariant?.id === variant.id && (
                              <motion.div
                                layoutId="variant-glow"
                                className="absolute inset-0 bg-gradient-to-r from-brand-primary/5 to-transparent pointer-events-none"
                              />
                            )}
                          </motion.button>
                        ))}
                    </div>
                  </div>
                )}

                <div className="space-y-6 relative z-10">
                  {/* Enhanced Quantity Selector */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-black text-white/20 ml-1 uppercase tracking-[0.3em]">Quantity</p>
                      {!isUnlimited && (
                        <p className="text-[10px] font-bold text-white/30">
                          <span className="text-brand-primary">{currentStock}</span> available
                        </p>
                      )}
                    </div>

                    {/* Quantity Warning Messages */}
                    <AnimatePresence>
                      {quantity < minQty && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-2"
                        >
                          <div className="px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                            <p className="text-[10px] font-bold text-orange-400">
                              ⚠️ Minimum order quantity is {minQty}
                            </p>
                          </div>
                        </motion.div>
                      )}
                      {!isUnlimited && quantity > currentStock && currentStock > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-2"
                        >
                          <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                            <p className="text-[10px] font-bold text-red-400">
                              ⚠️ Only {currentStock} items available in stock
                            </p>
                          </div>
                        </motion.div>
                      )}
                      {quantity > maxQty && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-2"
                        >
                          <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                            <p className="text-[10px] font-bold text-red-400">
                              ⚠️ Maximum order quantity is {maxQty}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary/20 via-brand-primary/10 to-brand-primary/20 rounded-2xl opacity-0 group-hover:opacity-100 blur transition-opacity duration-300" />
                      <div className="relative flex items-center bg-[#0d1a1d] rounded-2xl border border-white/[0.08] overflow-hidden transition-all group-hover:border-brand-primary/30">
                        <motion.button
                          onClick={() => {
                            const newVal = Math.max(minQty, quantity - 1)
                            setQuantity(newVal)
                            setInputValue(String(newVal))
                          }}
                          whileTap={{ scale: 0.9 }}
                          disabled={quantity <= minQty}
                          className={cn(
                            "w-14 h-14 flex items-center justify-center transition-all",
                            quantity <= minQty
                              ? "text-white/10 cursor-not-allowed"
                              : "text-white/40 hover:text-brand-primary hover:bg-brand-primary/10"
                          )}
                        >
                          <Minus className="w-4 h-4" />
                        </motion.button>
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={inputValue}
                            onChange={(e) => {
                              const rawValue = e.target.value.replace(/[^0-9]/g, '')
                              if (rawValue === '') {
                                setInputValue('')
                                return
                              }

                              const val = parseInt(rawValue, 10)
                              const effectiveMax = isUnlimited ? maxQty : Math.min(maxQty, currentStock)

                              // Clamp immediately - don't allow typing beyond limits
                              const clampedVal = Math.min(Math.max(minQty, val), effectiveMax)
                              setInputValue(String(clampedVal))
                              setQuantity(clampedVal)
                            }}
                            onBlur={() => {
                              // If empty, reset to min
                              if (inputValue === '' || parseInt(inputValue, 10) < minQty) {
                                setQuantity(minQty)
                                setInputValue(String(minQty))
                              }
                            }}
                            className="w-full bg-transparent text-center text-xl font-black text-white outline-none py-3"
                          />
                        </div>
                        <motion.button
                          onClick={() => {
                            const effectiveMax = isUnlimited ? maxQty : Math.min(maxQty, currentStock)
                            if (quantity < effectiveMax) {
                              const newVal = quantity + 1
                              setQuantity(newVal)
                              setInputValue(String(newVal))
                            }
                          }}
                          whileTap={{ scale: 0.9 }}
                          disabled={quantity >= (isUnlimited ? maxQty : Math.min(maxQty, currentStock))}
                          className={cn(
                            "w-14 h-14 flex items-center justify-center transition-all",
                            quantity >= (isUnlimited ? maxQty : Math.min(maxQty, currentStock))
                              ? "text-white/10 cursor-not-allowed"
                              : "text-white/40 hover:text-brand-primary hover:bg-brand-primary/10"
                          )}
                        >
                          <Plus className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* Total Price (shown when quantity > 1) */}
                  <AnimatePresence>
                    {quantity > 1 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex items-center justify-between p-4 rounded-xl bg-brand-primary/5 border border-brand-primary/10">
                          <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Total</span>
                          <span className="text-xl font-black text-brand-primary">${totalPrice.toFixed(2)}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Enhanced Action Buttons */}
                  <div className="space-y-3">
                    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                        <ThreeDButton
                          onClick={handleAddToCart}
                          disabled={isOutOfStock || isAddingToCart}
                          isLoading={isAddingToCart}
                          variant="brand" // Using brand cyan variant matching site theme
                          className="w-full h-14 text-sm font-black uppercase tracking-[0.15em] rounded-2xl"
                        >
                          {!isAddingToCart && (
                            <>
                              {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                              {!isOutOfStock && <ShoppingCart className="w-5 h-5 ml-2" />}
                            </>
                          )}
                          {isAddingToCart && "Added!"}
                        </ThreeDButton>
                      </motion.div>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                      <div className="w-full">
                        <AnimatedGenerateButton
                          labelIdle={isOutOfStock ? "Unavailable" : "Buy Now"}
                          labelActive="Preparing..."
                          generating={isBuyingNow}
                          onClick={handleBuyNow}
                          disabled={isOutOfStock || isBuyingNow}
                          highlightHueDeg={45} // Gold hue
                          className="w-full h-14"
                        />
                      </div>
                    </motion.div>
                  </div>

                  {/* Enhanced Premium Trust Badges */}
                  <div className="pt-6 border-t border-white/5">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        {
                          icon: "/images/trust/secure.png",
                          label: "Secure Checkout"
                        },
                        {
                          icon: "/images/trust/delivery.png",
                          label: "Instant Delivery"
                        },
                        {
                          icon: "/images/trust/guaranteed.png",
                          label: "Guaranteed"
                        }
                      ].map((badge, i) => (
                        <motion.div
                          key={i}
                          whileHover={{ y: -4, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                          className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] transition-colors relative group/badge overflow-hidden"
                        >
                          {/* Animated background glow on hover */}
                          <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/[0.05] to-transparent opacity-0 group-hover/badge:opacity-100 transition-opacity" />

                          <div className="relative w-10 h-10 flex items-center justify-center transition-transform group-hover/badge:scale-110">
                            <Image
                              src={badge.icon}
                              alt={badge.label}
                              width={40}
                              height={40}
                              className="object-contain"
                            />
                            {/* Subtle glow behind the icon */}
                            <div className="absolute inset-0 bg-brand-primary/20 blur-md rounded-full opacity-0 group-hover/badge:opacity-40 transition-opacity" />
                          </div>
                          <span className="text-[10px] font-black text-white/30 group-hover/badge:text-white/60 uppercase text-center leading-tight tracking-[0.1em] transition-colors relative z-10">
                            {badge.label}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
