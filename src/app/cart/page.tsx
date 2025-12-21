"use client"

import * as React from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { useCart } from "@/context/cart-context"
import { useCurrency } from "@/context/currency-context"
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import { SparklesText } from "@/components/ui/sparkles-text"

export default function CartPage() {
    const { cart, removeFromCart, addToCart, cartTotal, cartCount, isHydrated } = useCart()
    const { formatPrice } = useCurrency()

    const handleUpdateQuantity = (item: any, delta: number) => {
        if (item.quantity + delta > 0) {
            addToCart({ ...item, quantity: delta })
        } else {
            removeFromCart(item.id)
            toast.info(`Removed ${item.title} from cart`)
        }
    }

    if (!isHydrated) {
        return (
            <MainLayout>
                <div className="container mx-auto px-4 py-32 text-center max-w-lg">
                    <div className="inline-flex p-10 rounded-full bg-white/[0.02] border border-white/5 text-white/5 mb-8 animate-spin">
                        <ShoppingBag size={80} strokeWidth={1} />
                    </div>
                </div>
            </MainLayout>
        )
    }

    if (cart.length === 0) {
        return (
            <MainLayout>
                <div className="container mx-auto px-4 py-32 text-center max-w-lg">
                    <div className="inline-flex p-10 rounded-full bg-white/[0.02] border border-white/5 text-white/10 mb-8">
                        <ShoppingBag size={80} strokeWidth={1} />
                    </div>
                    <h1 className="text-4xl font-black text-white italic tracking-tighter mb-4 uppercase">Your Cart is Empty</h1>
                    <p className="text-white/40 mb-10 text-lg">Looks like you haven't added anything to your cart yet. Explore our store for the best digital goods.</p>
                    <Link href="/store">
                        <Button className="h-16 px-12 bg-brand-primary text-black font-black uppercase tracking-widest rounded-2xl hover:scale-105 transition-all shadow-xl shadow-brand-primary/20">
                            Back to Store
                        </Button>
                    </Link>
                </div>
            </MainLayout>
        )
    }

    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-16 max-w-6xl">
                <div className="flex flex-col lg:flex-row gap-16">
                    {/* Cart Items List */}
                    <div className="flex-1 space-y-8">
                        <div className="flex items-end gap-4 mb-4">
                            <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase">Shopping Cart</h1>
                            <span className="text-brand-primary font-black mb-1">({cartCount} items)</span>
                        </div>

                        <div className="space-y-4">
                            {cart.map((item) => (
                                <div key={item.id} className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row items-center gap-8 group hover:bg-white/[0.04] transition-all duration-300">
                                    <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-white/5 shadow-2xl flex-shrink-0">
                                        <Image
                                            src={item.image}
                                            alt={item.title}
                                            fill
                                            sizes="128px"
                                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                    </div>

                                    <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
                                        <h3 className="text-2xl font-black text-white truncate italic">{item.title}</h3>
                                        <SparklesText
                                            text={formatPrice(item.price)}
                                            className="text-brand-primary font-black text-xl italic"
                                            sparklesCount={5}
                                        />
                                    </div>

                                    <div className="flex flex-col items-center sm:items-end gap-6">
                                        <div className="flex items-center gap-4 bg-black/40 border border-white/5 p-1 rounded-xl">
                                            <button
                                                onClick={() => handleUpdateQuantity(item, -1)}
                                                className="w-11 h-11 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="w-8 text-center font-black text-white">{item.quantity}</span>
                                            <button
                                                onClick={() => handleUpdateQuantity(item, 1)}
                                                className="w-11 h-11 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="flex items-center gap-2 text-white/20 hover:text-red-500/80 text-[10px] font-black uppercase tracking-widest transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Remove Item
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="lg:w-[400px]">
                        <div className="p-10 rounded-[3rem] bg-[#0b1016] border border-white/5 sticky top-28 shadow-2xl space-y-8">
                            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Summary</h2>

                            <div className="space-y-4">
                                <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-white/40">
                                    <span>Subtotal</span>
                                    <span className="text-white">{formatPrice(cartTotal)}</span>
                                </div>
                                <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-white/40">
                                    <span>Shipping & Taxes</span>
                                    <span className="text-brand-primary">Free</span>
                                </div>
                                <div className="h-px bg-white/5 my-6" />
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-black text-white/20 uppercase tracking-[0.2em]">Total Amount</span>
                                    <SparklesText
                                        text={formatPrice(cartTotal)}
                                        className="text-4xl font-black text-brand-primary tracking-tighter italic"
                                        sparklesCount={10}
                                    />
                                </div>
                            </div>

                            <Link href="/checkout" target="_blank" className="block">
                                <Button className="w-full h-16 bg-brand-primary text-black font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-brand-primary/20 gap-3 group">
                                    Secure Checkout
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>

                            <div className="flex items-center justify-center gap-3 text-[9px] font-black text-white/10 uppercase tracking-widest italic text-center">
                                <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                                Instant delivery guaranteed
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    )
}
