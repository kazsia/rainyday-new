"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

export type CurrencyCode = "USD" | "EUR" | "GBP"

interface CurrencyData {
    code: CurrencyCode
    symbol: string
    rate: number // Exchange rate relative to USD
}

export const CURRENCIES: Record<CurrencyCode, CurrencyData> = {
    USD: { code: "USD", symbol: "$", rate: 1 },
    EUR: { code: "EUR", symbol: "€", rate: 0.92 },
    GBP: { code: "GBP", symbol: "£", rate: 0.79 },
}

interface CurrencyContextType {
    currency: CurrencyCode
    setCurrency: (code: CurrencyCode) => void
    symbol: string
    formatPrice: (amountInUSD: number) => string
    isHydrated: boolean
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
    const [currency, setCurrencyState] = useState<CurrencyCode>("USD")
    const [isHydrated, setIsHydrated] = useState(false)

    // Load currency from localStorage on mount
    useEffect(() => {
        const savedCurrency = localStorage.getItem("rainyday-currency") as CurrencyCode
        if (savedCurrency && CURRENCIES[savedCurrency]) {
            setCurrencyState(savedCurrency)
        }
        setIsHydrated(true)
    }, [])

    // Save currency to localStorage on change
    useEffect(() => {
        if (isHydrated) {
            localStorage.setItem("rainyday-currency", currency)
        }
    }, [currency, isHydrated])

    const setCurrency = (code: CurrencyCode) => {
        setCurrencyState(code)
    }

    const formatPrice = (amountInUSD: number) => {
        const { symbol, rate } = CURRENCIES[currency]
        const value = amountInUSD * rate
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value)
    }

    const value = {
        currency,
        setCurrency,
        symbol: CURRENCIES[currency].symbol,
        formatPrice,
        isHydrated
    }

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    )
}

export function useCurrency() {
    const context = useContext(CurrencyContext)
    if (context === undefined) {
        throw new Error("useCurrency must be used within a CurrencyProvider")
    }
    return context
}
