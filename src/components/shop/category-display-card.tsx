"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Layers, ChevronRight, FolderTree } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCurrency } from "@/context/currency-context"

interface CategoryDisplayCardProps {
    name: string
    productCount: number
    minPrice: number
    maxPrice: number
    onClick: () => void
}

export function CategoryDisplayCard({ name, productCount, minPrice, maxPrice, onClick }: CategoryDisplayCardProps) {
    const { formatPrice } = useCurrency()

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="group relative cursor-pointer"
            onClick={onClick}
        >
            <div className="flex flex-col h-full bg-[#0a0a0b]/80 backdrop-blur-xl border border-white/[0.05] hover:border-brand-primary/20 rounded-md overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-2xl min-h-[300px]">
                {/* Visual Header */}
                <div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-brand-primary/20 via-brand-primary/5 to-transparent flex items-center justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-brand-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                        <FolderTree className="w-12 h-12 text-brand-primary relative z-10 opacity-40 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="px-2 py-0.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-[9px] font-black uppercase tracking-widest text-brand-primary">
                            Collection
                        </div>
                    </div>

                    <h3 className="text-2xl font-black text-white leading-tight group-hover:text-brand-primary transition-colors line-clamp-2 mb-4">
                        {name}
                    </h3>

                    <div className="mt-auto space-y-4">
                        <div className="flex items-end justify-between">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">
                                    {productCount} Products available
                                </span>
                                <div className="text-xl font-black text-white tracking-tighter flex items-center gap-1">
                                    {minPrice === maxPrice ? (
                                        <>
                                            <span className="text-brand-primary">$</span>
                                            {formatPrice(minPrice).replace('$', '')}
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-brand-primary">$</span>
                                            {formatPrice(minPrice).replace('$', '')} - ${formatPrice(maxPrice).replace('$', '')}
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-brand-primary group-hover:border-brand-primary transition-all duration-300">
                                <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-black transition-colors" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
