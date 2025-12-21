"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const neonButtonVariants = cva(
    "relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group overflow-hidden",
    {
        variants: {
            variant: {
                solid: "bg-brand text-black hover:bg-brand/90",
                outline: "bg-transparent border-2 border-brand text-brand hover:bg-brand/10",
                ghost: "bg-transparent text-brand hover:bg-brand/10",
            },
            size: {
                sm: "h-9 px-4 text-xs rounded-lg",
                default: "h-11 px-6 text-sm rounded-xl",
                lg: "h-14 px-8 text-base rounded-2xl",
            },
        },
        defaultVariants: {
            variant: "solid",
            size: "default",
        },
    }
)

export interface NeonButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof neonButtonVariants> {
    asChild?: boolean
}

const NeonButton = React.forwardRef<HTMLButtonElement, NeonButtonProps>(
    ({ className, variant, size, asChild = false, children, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(neonButtonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            >
                {/* Neon glow effect */}
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-brand/20 via-brand/40 to-brand/20 blur-xl" />

                {/* Top shine */}
                <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Content */}
                <span className="relative z-10 flex items-center gap-2">
                    {children}
                </span>
            </Comp>
        )
    }
)
NeonButton.displayName = "NeonButton"

export { NeonButton, neonButtonVariants }
