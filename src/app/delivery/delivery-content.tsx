"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, Eye, EyeOff, Download, ShieldCheck, Clock } from "lucide-react"
import { toast } from "@/components/ui/sonner"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface DeliveryContentProps {
    orderId: string
    token: string
    delivery: {
        id: string
        content?: string
        delivery_assets?: Array<{
            id: string
            content: string
            type?: string
        }>
    } | null
    orderItems: Array<{
        id: string
        quantity: number
        price: number
        product_id: string
        products: {
            name: string
            delivery_type: string
        } | {
            name: string
            delivery_type: string
        }[] | null
    }>
}

export function DeliveryContent({
    orderId,
    token,
    delivery,
    orderItems
}: DeliveryContentProps) {
    const [isRevealed, setIsRevealed] = React.useState(false)
    const [isMarking, setIsMarking] = React.useState(false)

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success("Copied to clipboard!")
    }

    const handleReveal = async () => {
        setIsMarking(true)
        try {
            // Mark token as used on server
            const response = await fetch("/api/delivery/reveal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, orderId })
            })

            if (!response.ok) {
                const error = await response.json()
                toast.error(error.message || "Failed to reveal content")
                return
            }

            setIsRevealed(true)
        } catch (error) {
            console.error("Reveal error:", error)
            toast.error("Failed to reveal content")
        } finally {
            setIsMarking(false)
        }
    }

    // Get assets from delivery
    const assets = delivery?.delivery_assets || []
    const contentText = delivery?.content

    // If no delivery content, show pending
    if (!delivery && orderItems.length > 0) {
        const hasManualItems = orderItems.some(
            item => {
                const product = Array.isArray(item.products) ? item.products[0] : item.products
                return product?.delivery_type === "service"
            }
        )

        if (hasManualItems) {
            return (
                <Card className="bg-white/[0.02] border-white/5">
                    <CardContent className="p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-8 h-8 text-yellow-500" />
                        </div>
                        <h3 className="font-bold text-xl mb-2">Manual Delivery Pending</h3>
                        <p className="text-muted-foreground">
                            This product requires manual delivery. You will receive your content within the timeframe specified on the product page.
                        </p>
                    </CardContent>
                </Card>
            )
        }

        return (
            <Card className="bg-white/[0.02] border-white/5">
                <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-bold text-xl mb-2">Delivery Processing</h3>
                    <p className="text-muted-foreground">
                        Your order is being prepared. Please check back shortly.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="bg-white/[0.02] border-white/5 overflow-hidden">
            <CardHeader className="border-b border-white/5 bg-white/[0.01]">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Your Digital Products</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ShieldCheck className="w-4 h-4" />
                        Secure Delivery
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8">
                <div className="relative group">
                    <div className={cn(
                        "p-6 rounded-2xl border border-dashed transition-all duration-500 flex flex-col items-center justify-center gap-6",
                        isRevealed ? "bg-primary/5 border-primary/30" : "bg-white/5 border-white/10"
                    )}>
                        {!isRevealed ? (
                            <>
                                <div className="flex flex-col items-center gap-4 text-center">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                        <EyeOff className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold">Content Masked</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Click the button below to reveal your product
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    size="lg"
                                    className="font-bold gap-2"
                                    onClick={handleReveal}
                                    disabled={isMarking}
                                >
                                    {isMarking ? (
                                        <span className="animate-pulse">Revealing...</span>
                                    ) : (
                                        <>
                                            <Eye className="w-5 h-5" />
                                            Reveal Product
                                        </>
                                    )}
                                </Button>
                            </>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, filter: "blur(10px)" }}
                                animate={{ opacity: 1, filter: "blur(0px)" }}
                                className="w-full space-y-6"
                            >
                                {/* Display each asset */}
                                {assets.map((asset, index) => (
                                    <div key={asset.id || index} className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                            {asset.type === "license" ? "License Key" : `Product ${index + 1}`}
                                        </label>
                                        <div className="flex gap-2">
                                            <div className="flex-1 p-4 rounded-xl bg-background border border-white/10 font-mono text-lg tracking-wider text-primary break-all">
                                                {asset.content}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-auto w-14 border-white/10 hover:bg-white/5 shrink-0"
                                                onClick={() => copyToClipboard(asset.content)}
                                            >
                                                <Copy className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                {/* Display content text if no assets */}
                                {assets.length === 0 && contentText && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                            Delivery Content
                                        </label>
                                        <div className="flex gap-2">
                                            <div className="flex-1 p-4 rounded-xl bg-background border border-white/10 font-mono text-lg tracking-wider text-primary break-all">
                                                {contentText}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-auto w-14 border-white/10 hover:bg-white/5 shrink-0"
                                                onClick={() => copyToClipboard(contentText)}
                                            >
                                                <Copy className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                    <Button
                                        className="flex-1 gap-2 font-bold"
                                        variant="secondary"
                                        onClick={() => {
                                            const allContent = assets.map(a => a.content).join("\n") || contentText || ""
                                            const blob = new Blob([allContent], { type: "text/plain" })
                                            const url = URL.createObjectURL(blob)
                                            const a = document.createElement("a")
                                            a.href = url
                                            a.download = `delivery-${orderId.substring(0, 8)}.txt`
                                            a.click()
                                            URL.revokeObjectURL(url)
                                            toast.success("Downloaded!")
                                        }}
                                    >
                                        <Download className="w-5 h-5" />
                                        Download as TXT
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
