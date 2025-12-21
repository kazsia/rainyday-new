"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { getOrder } from "@/lib/db/orders"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    CheckCircle2,
    Copy,
    Download,
    ChevronDown,
    Globe2,
    ExternalLink,
    Clock,
    User,
    Mail,
    CreditCard,
    Search,
    ShieldCheck,
    ArrowRight,
    Lock
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Logo } from "@/components/layout/logo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { SparklesText } from "@/components/ui/sparkles-text"

function InvoiceContent() {
    const searchParams = useSearchParams()
    const orderId = searchParams.get("id")
    const [order, setOrder] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isDeliveredItemsOpen, setIsDeliveredItemsOpen] = useState(true)

    useEffect(() => {
        if (!orderId) {
            setIsLoading(false)
            return
        }

        loadOrder()
    }, [orderId])

    useEffect(() => {
        if (!order?.id) return

        // Realtime subscription using the actual UUID
        const supabase = createClient()
        const channel = supabase
            .channel(`order_${order.id}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${order.id}` },
                () => {
                    loadOrder(false)
                }
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'payments', filter: `order_id=eq.${order.id}` },
                () => {
                    loadOrder(false)
                }
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'deliveries', filter: `order_id=eq.${order.id}` },
                () => {
                    loadOrder(false)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [order?.id])

    async function loadOrder(showLoader = true) {
        if (showLoader) setIsLoading(true)
        try {
            const data = await getOrder(orderId!)
            setOrder(data)
        } catch (error) {
            console.error("Failed to load order:", error)
            toast.error("Failed to load order details")
        } finally {
            setIsLoading(false)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success("Copied to clipboard!")
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#020406]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-white/40 text-xs font-black uppercase tracking-widest">Loading Order...</p>
                </div>
            </div>
        )
    }

    if (!order) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#020406] p-8 text-center space-y-6">
                <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-white/20">
                    <Search size={40} />
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-black italic text-white uppercase tracking-tighter">Order Not Found</h1>
                    <p className="text-white/40 max-w-xs mx-auto text-sm">We couldn't find an order with this ID. Please check your link or contact support.</p>
                </div>
                <Link href="/store">
                    <Button className="bg-brand-primary text-black font-black uppercase tracking-widest rounded-xl px-8 h-12">
                        Back to Store
                    </Button>
                </Link>
            </div>
        )
    }

    const payment = order.payments?.[0]
    const deliverables = order.deliveries?.flatMap((d: any) => d.data || []) || []
    const isPaid = ['paid', 'delivered', 'completed'].includes(order.status)

    return (
        <div className="min-h-screen bg-[#020406] text-white selection:bg-brand-primary/30 antialiased overflow-x-hidden">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/5 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-accent/5 blur-[120px] rounded-full animate-pulse delay-700" />
            </div>

            <div className="relative flex flex-col lg:flex-row min-h-screen">
                <div className="w-full lg:w-[35%] p-8 lg:p-12 lg:sticky lg:top-0 h-fit lg:h-screen flex flex-col justify-between border-r border-white/5 bg-black/20 backdrop-blur-3xl">
                    <div className="space-y-12">
                        <div className="flex items-center justify-between">
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                                <Logo />
                            </motion.div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/5 rounded-xl cursor-pointer hover:bg-white/[0.06] transition-all group">
                                <Globe2 className="w-3.5 h-3.5 text-white/40 group-hover:text-brand-primary transition-colors" />
                                <span className="text-[10px] font-black text-white/60 tracking-widest uppercase">English</span>
                                <ChevronDown className="w-3.5 h-3.5 text-white/20" />
                            </div>
                        </div>

                        <div className="space-y-10">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-brand-primary/40 uppercase tracking-[0.4em] translate-x-1">Order Total</p>
                                <div className="flex items-baseline gap-2">
                                    <SparklesText
                                        text={`$${order.total.toFixed(2)}`}
                                        className="text-4xl font-black italic tracking-tighter"
                                        colors={{ first: "#a4f8ff", second: "#ffffff" }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                                {order.order_items?.map((item: any, idx: number) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center gap-5 group hover:bg-white/[0.04] transition-all hover:border-white/10"
                                    >
                                        <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-white/10 bg-black/40 group-hover:border-brand-primary/30 transition-colors shadow-2xl">
                                            <Image src={item.product?.image_url || "https://images.unsplash.com/photo-1614680376250-13f9f468202f?auto=format&fit=crop&q=80&w=200"} alt={item.product?.name} fill sizes="56px" className="object-cover group-hover:scale-110 transition-transform duration-700" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-black text-white italic truncate group-hover:text-brand-primary transition-colors">{item.product?.name}</h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[10px] text-white/20 font-black uppercase tracking-widest">{item.quantity}x</span>
                                                <span className="text-[10px] text-white/40 font-bold">${item.price.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-white/5 space-y-4 bg-gradient-to-t from-black/20 to-transparent">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/20">
                                <span className="flex items-center gap-2 italic">Status</span>
                                <span className={cn(
                                    "tracking-normal uppercase",
                                    order.status === 'pending' ? "text-yellow-500" :
                                        isPaid ? "text-green-500" : "text-red-500"
                                )}>{order.status}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-xs font-black italic tracking-widest text-white uppercase opacity-40">Total Settled</span>
                                <div className="text-right">
                                    <SparklesText
                                        text={`$${order.total.toFixed(2)}`}
                                        className="block text-2xl font-black text-brand-primary tracking-tighter drop-shadow-[0_0_15px_rgba(164,248,255,0.2)]"
                                        sparklesCount={8}
                                    />
                                    <span className="text-[8px] font-black text-white/10 uppercase tracking-[0.2em]">Transaction Reference: {order.id.slice(0, 8)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 p-8 lg:p-12 lg:px-20 bg-[#030607]/40 backdrop-blur-md relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(38,188,196,0.05),transparent_60%)] pointer-events-none" />

                    <div className="grid grid-cols-3 gap-6 relative z-10 mb-12">
                        {[
                            { step: 1, label: "Order Info", icon: User, complete: true },
                            { step: 2, label: "Confirm & Pay", icon: CreditCard, complete: isPaid },
                            { step: 3, label: "Receive Goods", icon: CheckCircle2, complete: order.status === 'delivered' || order.status === 'completed' }
                        ].map((s) => (
                            <div key={s.step} className="space-y-3">
                                <div className={cn(
                                    "h-1 rounded-full transition-all duration-700 relative z-10",
                                    s.complete ? "bg-brand-primary shadow-[0_0_20px_rgba(38,188,196,0.4)]" : "bg-white/10"
                                )} />
                                <div className="flex items-center gap-2.5">
                                    <div className={cn(
                                        "w-6 h-6 rounded-lg flex items-center justify-center transition-colors",
                                        s.complete ? "bg-brand-primary/10 text-brand-primary" : "bg-white/5 text-white/10"
                                    )}>
                                        <s.icon className="w-3 h-3" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className={cn("text-[8px] font-black uppercase tracking-[0.2em]", s.complete ? "text-brand-primary" : "text-white/20")}>Step 0{s.step}</p>
                                        <p className={cn("text-[10px] font-bold tracking-tight", s.complete ? "text-white" : "text-white/20")}>{s.label}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex-1 max-w-xl w-full mx-auto flex flex-col relative z-10">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-8 pb-12"
                        >
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 p-6 rounded-3xl bg-white/[0.03] border border-white/10 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 to-transparent" />
                                    <div className="w-14 h-14 rounded-xl bg-black border border-white/10 flex items-center justify-center relative z-10 shadow-2xl">
                                        <CreditCard className="w-6 h-6 text-brand-primary" />
                                    </div>
                                    <div className="relative z-10 space-y-0.5">
                                        <h2 className="text-xl font-black text-white italic capitalize tracking-tight">Order {order.status}</h2>
                                        <div className="flex items-center gap-2 text-[8px] font-black text-brand-primary/60 tracking-[0.2em] uppercase">
                                            <ShieldCheck className="w-2.5 h-2.5" />
                                            Order ID: {order.id}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-1.5 p-6 rounded-3xl bg-white/[0.01] border border-white/5">
                                    {[
                                        { label: "Invoice ID", value: order.id, copy: true },
                                        { label: "Delivery Email", value: order.email },
                                        { label: "Payment Method", value: payment?.provider || "N/A" },
                                        { label: "Created At", value: new Date(order.created_at).toLocaleString() },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/[0.02] transition-colors group/item">
                                            <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] italic">{item.label}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-black tracking-tight text-white/80">{item.value}</span>
                                                {item.copy && (
                                                    <button onClick={() => copyToClipboard(item.value)} className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center hover:bg-brand-primary/20 hover:text-brand-primary transition-all opacity-0 group-hover/item:opacity-100">
                                                        <Copy className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {isPaid ? (
                                    <motion.div
                                        initial={{ scale: 0.95, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="p-6 rounded-3xl bg-brand-primary/5 border border-brand-primary/10 flex flex-col items-center justify-center gap-3 relative overflow-hidden group shadow-[0_0_50px_rgba(38,188,196,0.05)]"
                                    >
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(38,188,196,0.1),transparent_70%)] animate-pulse" />
                                        <CheckCircle2 className="w-8 h-8 text-brand-primary drop-shadow-[0_0_15px_rgba(38,188,196,0.4)] relative z-10" />
                                        <div className="text-center relative z-10 space-y-0.5">
                                            <p className="text-lg font-black italic tracking-tighter text-white uppercase">Your order has been completed successfully!</p>
                                            <p className="text-[8px] font-black text-brand-primary uppercase tracking-[0.4em]">Transaction Verified by Rainyday Secure</p>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="p-8 rounded-3xl bg-yellow-500/5 border border-yellow-500/10 flex flex-col items-center justify-center gap-4 text-center">
                                        <Clock className="w-8 h-8 text-yellow-500 animate-pulse" />
                                        <div className="space-y-1">
                                            <p className="text-lg font-black italic tracking-tighter text-white uppercase">Awaiting payment verification...</p>
                                            <p className="text-[8px] font-black text-yellow-500/60 uppercase tracking-[0.4em]">Please do not close this page</p>
                                        </div>
                                    </div>
                                )}

                                {deliverables.length > 0 && (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <span className="w-1.5 h-1.5 rounded-full bg-brand-primary shadow-[0_0_10px_rgba(38,188,196,0.5)]" />
                                            <h2 className="text-xl font-black text-white italic tracking-tight">Access Your Goods</h2>
                                        </div>

                                        <Card className="bg-white/[0.02] border-white/5 overflow-hidden rounded-3xl transition-all group hover:bg-white/[0.04] hover:border-white/10">
                                            <button
                                                onClick={() => setIsDeliveredItemsOpen(!isDeliveredItemsOpen)}
                                                className="w-full p-6 flex items-center justify-between text-left group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center shrink-0">
                                                        <Search className="w-6 h-6 text-white/20" />
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <h3 className="text-base font-black text-white italic group-hover:text-brand-primary transition-colors">Deliverables</h3>
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-1.5 py-0.5 rounded-md bg-green-500/10 text-green-500 text-[8px] font-black uppercase tracking-widest border border-green-500/20">Ready for Download</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-brand-primary/10 transition-all">
                                                    <ChevronDown className={cn("w-4 h-4 text-white/20 group-hover:text-brand-primary transition-transform duration-500", isDeliveredItemsOpen && "rotate-180")} />
                                                </div>
                                            </button>

                                            <AnimatePresence>
                                                {isDeliveredItemsOpen && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="px-6 pb-6 pt-2 border-t border-white/5 space-y-6">
                                                            <div className="space-y-3">
                                                                <div className="flex items-center gap-2">
                                                                    <Lock className="w-2.5 h-2.5 text-brand-primary" />
                                                                    <h4 className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Secure Data</h4>
                                                                </div>
                                                                <div className="grid grid-cols-1 gap-2">
                                                                    {deliverables.map((d: any, i: number) => (
                                                                        <div key={i} className="p-4 rounded-xl bg-black border border-white/5 flex items-center justify-between group/code hover:border-brand-primary/20 transition-all">
                                                                            <code className="text-sm font-mono text-white/80 tracking-tight group-hover:text-white transition-colors">{d}</code>
                                                                            <button
                                                                                onClick={() => copyToClipboard(d)}
                                                                                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-brand-primary/20 hover:text-brand-primary transition-all opacity-0 group-hover/code:opacity-100"
                                                                            >
                                                                                <Copy className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </Card>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <Link href="/store" className="block">
                                    <Button className="w-full h-18 bg-brand-primary text-black font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_15px_30px_-10px_rgba(38,188,196,0.3)] flex items-center justify-center gap-4 group relative overflow-hidden italic">
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12" />
                                        <span className="text-lg relative z-10">Return to Store</span>
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                                    </Button>
                                </Link>
                                <div className="flex items-center justify-center gap-3 text-[8px] font-black text-white/10 uppercase tracking-widest italic pt-2">
                                    <span>Support: help@rainyday.dev</span>
                                    <Mail className="w-2.5 h-2.5" />
                                </div>
                            </div>
                        </motion.div>

                        <div className="mt-auto py-6 border-t border-white/5 flex justify-between items-center bg-gradient-to-t from-[#030607] to-transparent">
                            <div className="flex items-center gap-2.5 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">
                                <Logo className="w-3.5 h-3.5 opacity-20" />
                                Rainyday Fulfillment
                            </div>
                            <div className="flex items-center gap-3 text-[8px] font-black text-white/10 uppercase tracking-widest italic">
                                <span>Secured by Hansa Sentinel</span>
                                <Lock className="w-2.5 h-2.5" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(38, 188, 196, 0.2);
                }
            `}</style>
        </div>
    )
}

export default function InvoicePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#020406]">
                <div className="w-12 h-12 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <InvoiceContent />
        </Suspense>
    )
}
