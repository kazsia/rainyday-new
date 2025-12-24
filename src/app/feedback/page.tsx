"use client"

import * as React from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Star, MessageSquareQuote, CheckCircle2, Package, Search } from "lucide-react"
import { getPublicFeedbacks, Feedback } from "@/lib/db/feedbacks"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

export default function FeedbackPage() {
    const [feedbacks, setFeedbacks] = React.useState<Feedback[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [visibleCount, setVisibleCount] = React.useState(6)
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
        async function loadFeedbacks() {
            try {
                const data = await getPublicFeedbacks()
                setFeedbacks(data)
            } finally {
                setIsLoading(false)
            }
        }
        loadFeedbacks()
    }, [])

    if (!mounted) return null

    const visibleFeedbacks = feedbacks.slice(0, visibleCount)
    const hasMore = feedbacks.length > visibleCount

    return (
        <MainLayout>
            <div className="container mx-auto px-4 pt-32 pb-48 max-w-6xl">
                {/* Header Section */}
                <div className="flex flex-col items-center mb-32 space-y-8">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-7xl md:text-9xl font-bold text-white tracking-tight"
                    >
                        Love.
                    </motion.h1>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-48 bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : feedbacks.length === 0 ? (
                    <div className="text-center py-32 space-y-4">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto text-white/10">
                            <MessageSquareQuote size={32} />
                        </div>
                        <p className="text-white/20 text-xs font-semibold uppercase tracking-widest text-center">No feedback recorded</p>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start"
                    >
                        {visibleFeedbacks.map((f, idx) => (
                            <motion.div
                                key={f.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group bg-zinc-900/40 border border-zinc-800/50 p-8 rounded-2xl hover:bg-zinc-800/40 transition-all duration-300"
                            >
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={cn(
                                                        "w-3.5 h-3.5",
                                                        i < f.rating ? "text-brand-primary fill-brand-primary" : "text-zinc-800"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-[10px] font-medium text-zinc-500 uppercase">
                                            {new Date(f.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </div>

                                    <div className="space-y-3">
                                        {f.title && (
                                            <h3 className="text-base font-semibold text-white tracking-tight">{f.title}</h3>
                                        )}
                                        <p className="text-sm text-zinc-400 leading-relaxed line-clamp-4 group-hover:line-clamp-none transition-all duration-300">
                                            {f.message}
                                        </p>
                                    </div>

                                    <div className="pt-6 border-t border-zinc-800/50 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                                                {f.email[0].toUpperCase()}
                                            </div>
                                            <span className="text-[12px] font-medium text-zinc-400">{f.email.split('@')[0]}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-brand-primary hover:text-brand-primary/80 transition-colors">
                                            <CheckCircle2 size={14} />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Verified Purchase</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {/* Footer Link matching image */}
                {!isLoading && hasMore && (
                    <div className="mt-24 text-center">
                        <button
                            onClick={() => setVisibleCount(feedbacks.length)}
                            className="text-brand-primary hover:text-brand-primary/80 text-sm font-semibold tracking-tight transition-all"
                        >
                            View All Reviews
                        </button>
                    </div>
                )}
            </div>
        </MainLayout>
    )
}
