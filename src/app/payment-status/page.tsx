"use client"

import * as React from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, CheckCircle2, XCircle, Clock, ArrowRight, Download } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

function PaymentStatusContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const initialStatus = searchParams.get("status") || "pending"
    const [status, setStatus] = React.useState(initialStatus)

    // Simulate polling
    React.useEffect(() => {
        if (status === "pending") {
            const timer = setTimeout(() => {
                setStatus("success")
            }, 5000)
            return () => clearTimeout(timer)
        }
    }, [status])

    return (
        <div className="container mx-auto px-4 py-24 max-w-2xl text-center">
            <AnimatePresence mode="wait">
                {status === "pending" && (
                    <motion.div
                        key="pending"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="space-y-8"
                    >
                        <div className="relative inline-flex items-center justify-center">
                            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
                            <div className="relative w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-black mb-4">Waiting for Payment</h1>
                            <p className="text-muted-foreground text-lg">
                                We are currently verifying your transaction. This usually takes a few minutes.
                            </p>
                        </div>
                        <Card className="bg-white/[0.02] border-white/5 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm text-muted-foreground">Order ID</span>
                                <span className="font-mono font-bold">#RD-98234-X</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Status</span>
                                <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 gap-2">
                                    <Clock className="w-3 h-3" />
                                    Pending Verification
                                </Badge>
                            </div>
                        </Card>
                        <p className="text-sm text-muted-foreground italic">
                            Do not close this page. You will be redirected automatically.
                        </p>
                    </motion.div>
                )}

                {status === "success" && (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-8"
                    >
                        <div className="relative inline-flex items-center justify-center">
                            <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full" />
                            <div className="relative w-24 h-24 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                                <CheckCircle2 className="w-12 h-12 text-green-500" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-black mb-4">Payment Successful!</h1>
                            <p className="text-muted-foreground text-lg">
                                Thank you for your purchase. Your order has been processed and is ready for delivery.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" className="h-14 px-8 text-lg font-bold gap-2 glow-green" asChild>
                                <Link href="/delivery?orderId=RD-98234-X">
                                    Access Product
                                    <Download className="w-5 h-5" />
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" className="h-14 px-8 border-white/10 hover:bg-white/5" asChild>
                                <Link href="/invoice?orderId=RD-98234-X">
                                    View Invoice
                                </Link>
                            </Button>
                        </div>
                    </motion.div>
                )}

                {status === "failed" && (
                    <motion.div
                        key="failed"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-8"
                    >
                        <div className="relative inline-flex items-center justify-center">
                            <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full" />
                            <div className="relative w-24 h-24 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                <XCircle className="w-12 h-12 text-red-500" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-black mb-4">Payment Failed</h1>
                            <p className="text-muted-foreground text-lg">
                                Unfortunately, your payment could not be processed. Please try again or contact support.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" className="h-14 px-8 text-lg font-bold gap-2" asChild>
                                <Link href="/checkout">
                                    Try Again
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" className="h-14 px-8 border-white/10 hover:bg-white/5" asChild>
                                <Link href="/support">
                                    Contact Support
                                </Link>
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default function PaymentStatusPage() {
    return (
        <MainLayout>
            <React.Suspense fallback={
                <div className="container mx-auto px-4 py-24 max-w-2xl text-center">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
                </div>
            }>
                <PaymentStatusContent />
            </React.Suspense>
        </MainLayout>
    )
}
