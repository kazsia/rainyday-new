"use client"

import React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { Logo } from "@/components/layout/logo"
import { Button } from "@/components/ui/button"
import {
    Clock,
    ExternalLink,
    CheckCircle2,
    CircleAlert,
    Loader2,
    ArrowRight,
    Copy,
    RefreshCw
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Suspense } from "react"
import { useCart } from "@/context/cart-context"
import { SparklesText } from "@/components/ui/sparkles-text"

function PaymentWaitingContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const orderId = searchParams.get("orderId")
    const payUrl = searchParams.get("payUrl")
    const { clearCart } = useCart()

    const [status, setStatus] = React.useState<"pending" | "processing" | "completed" | "failed">("pending")
    const [order, setOrder] = React.useState<any>(null)
    const [timeLeft, setTimeLeft] = React.useState(60 * 60) // 60 minutes
    const [isPolling, setIsPolling] = React.useState(true)

    // Guard refs to prevent multiple executions
    const hasOpenedPaymentRef = React.useRef(false)
    const hasClearedCartRef = React.useRef(false)

    // Clear cart and open payment URL on mount - only once
    React.useEffect(() => {
        // Clear the cart only once
        if (!hasClearedCartRef.current) {
            hasClearedCartRef.current = true
            clearCart()
        }

        // Open payment URL only once
        if (payUrl && !hasOpenedPaymentRef.current) {
            hasOpenedPaymentRef.current = true
            const decodedUrl = decodeURIComponent(payUrl)
            window.open(decodedUrl, "_blank", "noopener,noreferrer")
        }
    }, [payUrl, clearCart])

    // Poll for payment status
    React.useEffect(() => {
        if (!orderId || !isPolling) return

        const supabase = createClient()

        // Initial fetch
        fetchOrder()

        // Realtime subscription for payment updates
        const channel = supabase
            .channel(`payment_waiting_${orderId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'payments', filter: `order_id=eq.${orderId}` },
                (payload) => {
                    if (payload.new && (payload.new as any).status) {
                        const newStatus = (payload.new as any).status
                        setStatus(newStatus)
                        if (newStatus === "completed") {
                            setIsPolling(false)
                            toast.success("Payment confirmed!")
                            setTimeout(() => {
                                router.push(`/invoice?id=${orderId}`)
                            }, 2000)
                        }
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
                () => {
                    fetchOrder()
                }
            )
            .subscribe()

        // Polling fallback every 10 seconds
        const pollInterval = setInterval(() => {
            fetchOrder()
        }, 10000)

        return () => {
            supabase.removeChannel(channel)
            clearInterval(pollInterval)
        }
    }, [orderId, isPolling, router])

    // Countdown timer
    React.useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 0) {
                    setStatus("failed")
                    setIsPolling(false)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    async function fetchOrder() {
        if (!orderId) return

        try {
            const { getOrder } = await import("@/lib/db/orders")
            const data = await getOrder(orderId)
            setOrder(data)

            // Check if order is already paid
            if (data.status === "paid" || data.status === "completed" || data.status === "delivered") {
                setStatus("completed")
                setIsPolling(false)
            }

            // Check payment status
            const payment = data.payments?.[0]
            if (payment) {
                if (payment.status === "completed") {
                    setStatus("completed")
                    setIsPolling(false)
                } else if (payment.status === "processing") {
                    setStatus("processing")
                }
            }
        } catch (error) {
            console.error("Failed to fetch order:", error)
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }

    const copyOrderId = () => {
        if (order?.readable_id || orderId) {
            navigator.clipboard.writeText(order?.readable_id || orderId || "")
            toast.success("Order ID copied!")
        }
    }

    const openPaymentPage = () => {
        if (payUrl) {
            window.open(decodeURIComponent(payUrl), "_blank", "noopener,noreferrer")
        }
    }

    const statusConfig = {
        pending: {
            icon: Clock,
            title: "Awaiting Payment",
            subtitle: "Complete your payment in the OxaPay window",
            color: "text-yellow-500",
            bgColor: "bg-yellow-500/10",
            borderColor: "border-yellow-500/20"
        },
        processing: {
            icon: Loader2,
            title: "Processing Payment",
            subtitle: "Your payment is being confirmed on the blockchain",
            color: "text-brand-primary",
            bgColor: "bg-brand-primary/10",
            borderColor: "border-brand-primary/20"
        },
        completed: {
            icon: CheckCircle2,
            title: "Payment Successful!",
            subtitle: "Redirecting you to your order...",
            color: "text-green-500",
            bgColor: "bg-green-500/10",
            borderColor: "border-green-500/20"
        },
        failed: {
            icon: CircleAlert,
            title: "Payment Expired",
            subtitle: "The payment window has expired",
            color: "text-red-500",
            bgColor: "bg-red-500/10",
            borderColor: "border-red-500/20"
        }
    }

    const currentStatus = statusConfig[status]
    const StatusIcon = currentStatus.icon

    return (
        <div className="min-h-screen bg-[#020406] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/5 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-accent/5 blur-[120px] rounded-full animate-pulse delay-700" />
            </div>

            <div className="relative z-10 w-full max-w-lg space-y-8">
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center"
                >
                    <Logo />
                </motion.div>

                {/* Status Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                        "p-8 rounded-3xl border relative overflow-hidden",
                        currentStatus.bgColor,
                        currentStatus.borderColor
                    )}
                >
                    {/* Animated background */}
                    <motion.div
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className={cn("absolute inset-0 opacity-10 bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none")}
                    />

                    <div className="relative z-10 flex flex-col items-center gap-4 text-center">
                        <motion.div
                            animate={status === "pending" || status === "processing" ? { scale: [1, 1.1, 1] } : {}}
                            transition={{ duration: 2, repeat: Infinity }}
                            className={cn("w-16 h-16 rounded-2xl flex items-center justify-center", currentStatus.bgColor)}
                        >
                            <StatusIcon className={cn("w-8 h-8", currentStatus.color, status === "processing" && "animate-spin")} />
                        </motion.div>

                        <div className="space-y-1">
                            <h1 className="text-2xl font-black italic tracking-tight uppercase">{currentStatus.title}</h1>
                            <p className="text-sm text-white/50">{currentStatus.subtitle}</p>
                        </div>

                        {status === "pending" && (
                            <div className="flex items-center gap-2 mt-2">
                                <Clock className="w-4 h-4 text-yellow-500" />
                                <span className="text-xl font-mono font-bold text-yellow-500">{formatTime(timeLeft)}</span>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Order Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-widest text-white/30">Order ID</span>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-mono text-brand-primary">{order?.readable_id || orderId?.slice(0, 8)}</span>
                            <button onClick={copyOrderId} className="p-1.5 rounded-md bg-white/5 hover:bg-brand-primary/20 transition-colors">
                                <Copy className="w-3 h-3 text-white/50" />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-widest text-white/30">Amount</span>
                        <SparklesText
                            text={`$${order?.total?.toFixed(2) || "0.00"}`}
                            className="text-lg font-black text-white"
                            sparklesCount={8}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-widest text-white/30">Email</span>
                        <span className="text-sm text-white/70">{order?.email || "..."}</span>
                    </div>
                </motion.div>

                {/* Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-3"
                >
                    {status === "pending" && payUrl && (
                        <Button
                            onClick={openPaymentPage}
                            className="w-full h-14 bg-brand-primary text-black font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                        >
                            <ExternalLink className="w-5 h-5" />
                            Open Payment Page
                        </Button>
                    )}

                    {status === "completed" && (
                        <Button
                            onClick={() => router.push(`/invoice?id=${orderId}`)}
                            className="w-full h-14 bg-green-500 text-black font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                        >
                            View Order
                            <ArrowRight className="w-5 h-5" />
                        </Button>
                    )}

                    {status === "failed" && (
                        <Button
                            onClick={() => router.push("/store")}
                            variant="outline"
                            className="w-full h-14 border-white/10 font-black uppercase tracking-widest rounded-2xl"
                        >
                            Return to Store
                        </Button>
                    )}

                    {(status === "pending" || status === "processing") && (
                        <Button
                            onClick={fetchOrder}
                            variant="ghost"
                            className="w-full h-12 text-white/40 hover:text-white font-medium flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh Status
                        </Button>
                    )}
                </motion.div>

                {/* Help text */}
                <p className="text-center text-[10px] text-white/20 uppercase tracking-widest">
                    Don't close this page • Payment updates automatically
                </p>
            </div>
        </div>
    )
}

export default function PaymentWaitingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#020406]">
                <div className="w-12 h-12 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <PaymentWaitingContent />
        </Suspense>
    )
}
