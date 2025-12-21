"use client"

import * as React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { CartProvider } from "@/context/cart-context"
import { SiteSettingsProvider } from "@/context/site-settings-context"
import { CurrencyProvider } from "@/context/currency-context"

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
        >
            <SiteSettingsProvider>
                <CurrencyProvider>
                    <CartProvider>
                        {children}
                    </CartProvider>
                </CurrencyProvider>
            </SiteSettingsProvider>
            <Toaster position="top-center" expand={false} richColors />
        </ThemeProvider>
    )
}
