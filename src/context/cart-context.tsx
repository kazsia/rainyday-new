"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

export interface CartItem {
    id: string
    title: string
    price: number
    quantity: number
    image: string
}

interface CartContextType {
    cart: CartItem[]
    addToCart: (item: CartItem) => void
    removeFromCart: (id: string) => void
    clearCart: () => void
    cartCount: number
    cartTotal: number
    isHydrated: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([])
    const [isHydrated, setIsHydrated] = useState(false)

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem("rainyday-cart")
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart))
            } catch (e) {
                console.error("Failed to parse cart", e)
            }
        }
        setIsHydrated(true)
    }, [])

    // Save cart to localStorage on change
    useEffect(() => {
        if (isHydrated) {
            localStorage.setItem("rainyday-cart", JSON.stringify(cart))
        }
    }, [cart, isHydrated])

    const addToCart = (item: CartItem) => {
        setCart((prev) => {
            const existing = prev.find((i) => i.id === item.id)
            if (existing) {
                return prev.map((i) =>
                    i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
                )
            }
            return [...prev, item]
        })
    }

    const removeFromCart = (id: string) => {
        setCart((prev) => prev.filter((i) => i.id !== id))
    }

    const clearCart = () => {
        setCart([])
    }

    const cartCount = cart.reduce((count, item) => count + item.quantity, 0)
    const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, cartCount, cartTotal, isHydrated }}>
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider")
    }
    return context
}
