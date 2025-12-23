"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { adminGetOrder, retriggerDelivery } from "@/lib/db/orders"
import { Button } from "@/components/ui/button"
import {
    ChevronLeft,
    Link as LinkIcon,
    Copy,
    MoreVertical,
    CreditCard,
    User,
    ShoppingCart,
    StickyNote,
    Download,
    RefreshCw,
    RotateCcw,
    ShieldAlert,
    Ban,
    Lock as LockIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"

export default function AdminInvoiceDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const [order, setOrder] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isRetriggering, setIsRetriggering] = useState(false)

    useEffect(() => {
        if (params.id) {
            loadOrder(params.id as string)
        }
    }, [params.id])

    async function loadOrder(id: string) {
        try {
            const data = await adminGetOrder(id)
            setOrder(data)
        } catch (error) {
            toast.error("Failed to load invoice details")
        } finally {
            setIsLoading(false)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success("Copied to clipboard")
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount)
    }

    async function handleRetriggerDelivery() {
        if (!order?.id) return
        setIsRetriggering(true)
        try {
            const result = await retriggerDelivery(order.id)
            if (result.success) {
                toast.success(result.message || "Delivery triggered successfully")
                await loadOrder(order.id) // Refresh to show new deliverables
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to trigger delivery")
        } finally {
            setIsRetriggering(false)
        }
    }

    // Helper for status badges (reused style)
    const getStatusBadge = (status: string) => {
        const styles = {
            paid: "bg-green-500/10 text-green-500 border-green-500/20",
            completed: "bg-green-500/10 text-green-500 border-green-500/20",
            delivered: "bg-green-500/10 text-green-500 border-green-500/20",
            pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
            cancelled: "bg-red-500/10 text-white/40 border-white/10",
        }[status] || "bg-white/5 text-white/40 border-white/10"

        return (
            <span className={cn("px-2.5 py-0.5 rounded textxs font-medium border uppercase tracking-wider", styles)}>
                {status}
            </span>
        )
    }

    const getPaymentIcon = (provider: string | undefined) => {
        if (!provider) return null
        const p = provider.toLowerCase()
        if (p.includes('btc') || p.includes('bitcoin')) return <img src="https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=035" className="w-5 h-5" alt="BTC" />
        if (p.includes('eth') || p.includes('ethereum')) return <img src="https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=035" className="w-5 h-5" alt="ETH" />
        if (p.includes('ltc') || p.includes('litecoin')) return <img src="https://cryptologos.cc/logos/litecoin-ltc-logo.svg?v=035" className="w-5 h-5" alt="LTC" />
        if (p.includes('usdt')) return <img src="https://cryptologos.cc/logos/tether-usdt-logo.svg?v=035" className="w-5 h-5" alt="USDT" />
        if (p.includes('xmr') || p.includes('monero')) return <img src="https://cryptologos.cc/logos/monero-xmr-logo.svg?v=035" className="w-5 h-5" alt="XMR" />
        return <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[8px]">?</div>
    }

    if (isLoading) return <AdminLayout>
        <div className="flex items-center justify-center h-96" suppressHydrationWarning>
            <RefreshCw className="w-6 h-6 animate-spin text-white/20" />
        </div>
    </AdminLayout>

    if (!order) return <AdminLayout>
        <div className="text-center py-20">
            <h2 className="text-xl text-white">Invoice not found</h2>
            <Button variant="link" onClick={() => router.push('/admin/invoices')} className="text-brand">Go back</Button>
        </div>
    </AdminLayout>

    return (
        <AdminLayout>
            <div className="max-w-[1600px] mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" className="h-9 w-9 p-0 border-white/5 bg-[#0a1628] text-white/40 hover:text-white" onClick={() => router.push('/admin/invoices')}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                                Invoice Details
                            </h1>
                            <p className="text-sm text-white/40">View the details of the invoice.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Retrigger Delivery Button - Only for paid orders */}
                        {['paid', 'delivered', 'completed'].includes(order.status) && (
                            <Button
                                variant="outline"
                                className="border-white/5 bg-[#0a1628] text-white/60 hover:text-white hover:bg-white/5"
                                onClick={handleRetriggerDelivery}
                                disabled={isRetriggering}
                            >
                                <RotateCcw className={cn("w-4 h-4 mr-2", isRetriggering && "animate-spin")} />
                                {isRetriggering ? "Retriggering..." : "Retrigger Delivery"}
                            </Button>
                        )}
                        <Button variant="outline" className="border-white/5 bg-[#0a1628] text-white/60 hover:text-white hover:bg-white/5">
                            <Ban className="w-4 h-4 mr-2" />
                            Block User
                        </Button>
                        <Button variant="outline" className="border-white/5 bg-[#0a1628] text-white/60 hover:text-white hover:bg-white/5">
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                        </Button>
                        <Button className="bg-brand hover:bg-brand/90 text-white border-0" onClick={() => window.open(`/invoice?id=${order.id}`, '_blank')}>
                            <LinkIcon className="w-4 h-4 mr-2" />
                            View Public Invoice
                        </Button>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Order Information */}
                    <div className="bg-[#0a1628] border border-white/5 rounded-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20">
                                <CreditCard className="w-4 h-4 text-brand-primary" />
                            </div>
                            <h3 className="font-semibold text-white">Order Information</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                <span className="text-sm text-white/40">ID</span>
                                <div className="flex items-center gap-2">
                                    <code className="text-xs text-white/60">{order.id}</code>
                                    <button onClick={() => copyToClipboard(order.id)} className="text-white/20 hover:text-white">
                                        <Copy className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                <span className="text-sm text-white/40">Status</span>
                                {getStatusBadge(order.status)}
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                <span className="text-sm text-white/40">Payment Method</span>
                                <div className="flex items-center gap-2 text-white">
                                    <span className="text-sm">{order.payments?.[0]?.provider || "Unknown"}</span>
                                    {getPaymentIcon(order.payments?.[0]?.provider)}
                                </div>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                <span className="text-sm text-white/40">Subtotal</span>
                                <span className="text-sm text-white font-mono">{formatCurrency(order.total)}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                <span className="text-sm text-white/40">Total Price</span>
                                <span className="text-sm text-white font-mono">{formatCurrency(order.total)}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                <span className="text-sm text-white/40">Total Paid</span>
                                <span className={cn("text-sm font-mono", (order.status === 'paid' || order.status === 'completed') ? "text-green-500" : "text-white/20")}>
                                    {(order.status === 'paid' || order.status === 'completed') ? formatCurrency(order.total) : "-"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                <span className="text-sm text-white/40">Created At</span>
                                <span className="text-sm text-white/60">{new Date(order.created_at).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Customer Information */}
                    <div className="bg-[#0a1628] border border-white/5 rounded-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                                <User className="w-4 h-4 text-orange-400" />
                            </div>
                            <h3 className="font-semibold text-white">Customer Information</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                <span className="text-sm text-white/40">E-mail Address</span>
                                <span className="text-sm text-white">{order.email}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                <span className="text-sm text-white/40">IP Address</span>
                                <span className="text-sm text-white/40">Unknown</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                <span className="text-sm text-white/40">Country</span>
                                <span className="text-sm text-white/40">Unknown</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                <span className="text-sm text-white/40">Browser</span>
                                <span className="text-sm text-white/40">Unknown</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                <span className="text-sm text-white/40">Operating System</span>
                                <span className="text-sm text-white/40">Linux</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                <span className="text-sm text-white/40">User Agent</span>
                                <span className="text-xs text-white/20 max-w-[200px] truncate">Mozilla/5.0...</span>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button variant="outline" className="flex-1 border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10 hover:text-red-400">
                                    <ShieldAlert className="w-4 h-4 mr-2" />
                                    Blacklist Email
                                </Button>
                                <Button variant="outline" className="flex-1 border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10 hover:text-red-400">
                                    <ShieldAlert className="w-4 h-4 mr-2" />
                                    Blacklist IP
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items */}
                <div className="bg-[#0a1628] border border-white/5 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                            <ShoppingCart className="w-4 h-4 text-purple-400" />
                        </div>
                        <h3 className="font-semibold text-white">Items</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.01]">
                                    <th className="px-6 py-4 font-semibold text-white/40">Status</th>
                                    <th className="px-6 py-4 font-semibold text-white/40">Product & Variant</th>
                                    <th className="px-6 py-4 font-semibold text-white/40">Quantity</th>
                                    <th className="px-6 py-4 font-semibold text-white/40">Total Price</th>
                                    <th className="px-6 py-4 font-semibold text-white/40">Delivered</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {order.order_items?.map((item: any) => (
                                    <tr key={item.id} className="hover:bg-white/[0.01]">
                                        <td className="px-6 py-4">
                                            {getStatusBadge(order.status)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-white font-medium">{item.product?.name || "Unknown Product"}</span>
                                                <span className="text-white/40 text-xs">Default Variant</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-white/60">
                                            {item.quantity}
                                        </td>
                                        <td className="px-6 py-4 text-white font-mono">
                                            {formatCurrency(item.price * item.quantity)}
                                        </td>
                                        <td className="px-6 py-4 text-white/40">
                                            {order.status === 'completed' || order.status === 'delivered' ? (
                                                <span className="text-green-500 text-xs">Delivered</span>
                                            ) : "-"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Payment History */}
                <div className="bg-[#0a1628] border border-white/5 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <CreditCard className="w-4 h-4 text-emerald-400" />
                        </div>
                        <h3 className="font-semibold text-white">Payment History</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.01]">
                                    <th className="px-6 py-4 font-semibold text-white/40">Status</th>
                                    <th className="px-6 py-4 font-semibold text-white/40">Amount</th>
                                    <th className="px-6 py-4 font-semibold text-white/40">Paid At</th>
                                    <th className="px-6 py-4 font-semibold text-white/40">ID</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {order.payments?.map((pay: any) => (
                                    <tr key={pay.id} className="hover:bg-white/[0.01]">
                                        <td className="px-6 py-4">
                                            {getStatusBadge(pay.status)}
                                        </td>
                                        <td className="px-6 py-4 text-white font-mono">
                                            {formatCurrency(pay.amount)} <span className="text-white/40 text-xs ml-1">{pay.currency}</span>
                                        </td>
                                        <td className="px-6 py-4 text-white/60">
                                            {(pay.status === 'completed' || pay.status === 'paid')
                                                ? new Date(pay.updated_at || pay.created_at).toLocaleString()
                                                : "-"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <code className="text-xs text-white/20">{pay.id}</code>
                                        </td>
                                    </tr>
                                ))}
                                {(!order.payments || order.payments.length === 0) && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-white/20">
                                            No payment history found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Invoice Note */}
                <div className="bg-[#0a1628] border border-white/5 rounded-xl overflow-hidden mb-10">
                    <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                            <StickyNote className="w-4 h-4 text-indigo-400" />
                        </div>
                        <h3 className="font-semibold text-white">Invoice Note</h3>
                    </div>
                    <div className="p-6">
                        <p className="text-sm text-white/40 mb-3">Note</p>
                        <p className="text-xs text-white/20 mb-4">This note will be visible to shop administrators only. You can use this to keep track of important information about the invoice.</p>
                        <Textarea
                            placeholder="Add a note..."
                            className="bg-[#0a1628]/20 border-white/5 min-h-[100px] text-white focus:border-indigo-500/50"
                        />
                        <div className="mt-4">
                            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white">
                                Save
                            </Button>
                        </div>
                    </div>
                </div>


                {/* Footer */}
                <div className="flex justify-between items-center py-8 border-t border-white/5 mt-10">
                    <div className="flex items-center gap-2.5 text-[9px] font-black text-white/20 uppercase tracking-[0.3em] italic" suppressHydrationWarning>
                        <img src="/logo.png" alt="" className="w-4 h-4 opacity-20 grayscale" />
                        Rainyday Fulfillment
                    </div>
                    <div className="flex items-center gap-3 text-[8px] font-black text-white/10 uppercase tracking-widest italic" suppressHydrationWarning>
                        <span>Secured by Rainyday Shield</span>
                        <LockIcon className="w-2.5 h-2.5" />
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}
