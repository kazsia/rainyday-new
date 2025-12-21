"use client"

import * as React from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Loader2, AlertCircle, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

export default function OrderLookupPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState(false)
    const [error, setError] = React.useState("")

    const handleLookup = (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        // Simulate lookup
        setTimeout(() => {
            const success = Math.random() > 0.2
            if (success) {
                router.push("/delivery?orderId=RD-98234-X")
            } else {
                setError("Order not found. Please check your details and try again.")
                setIsLoading(false)
            }
        }, 1500)
    }

    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-24 max-w-xl">
                <div className="text-center mb-12">
                    <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-6">
                        <Search className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-black mb-4">Order Lookup</h1>
                    <p className="text-muted-foreground text-lg">
                        Enter your email or order ID to track your purchase and access your products.
                    </p>
                </div>

                <Card className="bg-white/[0.02] border-white/5">
                    <CardHeader>
                        <CardTitle>Track your Order</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLookup} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="order-id">Email or Order ID</Label>
                                <Input
                                    id="order-id"
                                    placeholder="e.g. RD-98234-X or your@email.com"
                                    className="h-12 bg-white/5 border-white/10 focus:border-primary/50"
                                    required
                                />
                            </div>

                            {error && (
                                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3 text-red-500 text-sm">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-14 text-lg font-bold gap-2 glow-green"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Searching...
                                    </>
                                ) : (
                                    <>
                                        Lookup Order
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="mt-12 text-center">
                    <p className="text-sm text-muted-foreground">
                        Having trouble? <Link href="/support" className="text-primary hover:underline">Contact our support team</Link>
                    </p>
                </div>
            </div>
        </MainLayout>
    )
}

import Link from "next/link"
