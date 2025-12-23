"use client"

import * as React from "react"
import { ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface StockInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    value: number
    onChange: (value: number) => void
    className?: string
}

export function StockInput({ value, onChange, className, ...props }: StockInputProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value)
        if (!isNaN(val)) {
            onChange(val)
        } else {
            onChange(0)
        }
    }

    const increment = () => onChange(value + 1)
    const decrement = () => onChange(Math.max(0, value - 1))

    return (
        <div className={cn("relative flex items-center group", className)}>
            <input
                type="number"
                value={value === 0 ? '' : value}
                onChange={handleChange}
                className={cn(
                    "w-full h-12 bg-[#0a1628]/40 border border-white/10 rounded-xl px-4 pr-12 text-sm text-white focus:outline-none focus:border-brand-primary/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-white/20",
                    props.disabled && "opacity-50 cursor-not-allowed"
                )}
                placeholder="0"
                {...props}
            />
            <div className="absolute right-2 flex flex-col gap-0.5">
                <button
                    type="button"
                    onClick={increment}
                    disabled={props.disabled}
                    className="p-1 rounded-md hover:bg-white/5 text-white/20 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                    type="button"
                    onClick={decrement}
                    disabled={props.disabled}
                    className="p-1 rounded-md hover:bg-white/5 text-white/20 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronDown className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    )
}
