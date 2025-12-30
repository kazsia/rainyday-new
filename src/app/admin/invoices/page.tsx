"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import {
    Search,
    Download,
    Filter,
    RefreshCw,
    MoreHorizontal,
    Archive,
    Ban,
    RotateCcw,
    ExternalLink,
    Copy,
    CheckCircle,
    ChevronDown,
    Gift,
    Ticket
} from "lucide-react"
import { getPaymentIcon, getPaymentName } from "@/lib/utils/payment"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { adminGetOrders, updateOrderStatus, markOrderAsPaid, retriggerDelivery } from "@/lib/db/orders"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/sonner"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function AdminInvoicesPage() {
    const searchParams = useSearchParams()
    const [orders, setOrders] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
    const [statusFilter, setStatusFilter] = useState("all")

    useEffect(() => {
        loadData()

        const supabase = createClient()
        const channel = supabase
            .channel('admin_orders')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders' },
                () => {
                    loadData(false)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    async function loadData(showLoader = true) {
        if (showLoader) setIsLoading(true)
        try {
            const data = await adminGetOrders()
            // Map payment info for easier access
            const formatted = data?.map((order: any) => ({
                ...order,
                payment: order.payments?.[0], // Assuming one payment per order for now
                items_summary: order.order_items?.map((i: any) => i.product?.name).join(", ") || "Unknown Product"
            }))
            setOrders(formatted || [])
        } catch (error) {
            toast.error("Failed to load orders")
        } finally {
            setIsLoading(false)
        }
    }

    const handleUpdateStatus = async (id: string, status: 'cancelled' | 'refunded' | 'completed') => {
        try {
            await updateOrderStatus(id, status)
            toast.success(`Order marked as ${status}`)
            loadData(false)
        } catch (error) {
            toast.error("Failed to update status")
        }
    }

    const handleMarkAsPaid = async (id: string) => {
        const t = toast.loading("Marking as paid...")
        try {
            await markOrderAsPaid(id)
            toast.success("Order marked as paid and delivered", { id: t })
            loadData(false)
        } catch (error: any) {
            toast.error(error.message || "Failed to mark as paid", { id: t })
        }
    }

    const handleRetriggerDelivery = async (id: string) => {
        const t = toast.loading("Triggering delivery...")
        try {
            const result = await retriggerDelivery(id)
            toast.success(result.message || "Delivery triggered!", { id: t })
            loadData(false)
        } catch (error: any) {
            toast.error(error.message || "Failed to trigger delivery", { id: t })
        }
    }

    const handleExportCSV = () => {
        if (orders.length === 0) {
            toast.error("No orders to export")
            return
        }

        const headers = ["ID", "Email", "Status", "Total", "Provider", "Created At"]
        const csvContent = [
            headers.join(","),
            ...orders.map(ord => [
                ord.id,
                ord.email,
                ord.status,
                ord.total,
                ord.payment?.provider || 'N/A',
                new Date(ord.created_at).toISOString()
            ].join(","))
        ].join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", `invoices_export_${new Date().toISOString().slice(0, 10)}.csv`)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success("Invoices exported successfully")
    }

    const filteredOrders = orders.filter(ord => {
        const matchesSearch = ord.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ord.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ord.readable_id?.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesStatus = statusFilter === "all" || ord.status === statusFilter

        return matchesSearch && matchesStatus
    })

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success("Copied to clipboard")
    }

    const getStatusBadge = (status: string) => {
        const styles = {
            paid: "bg-emerald-500/5 text-emerald-400 border-emerald-500/10",
            completed: "bg-emerald-500/5 text-emerald-400 border-emerald-500/10",
            delivered: "bg-emerald-500/5 text-emerald-400 border-emerald-500/10",
            pending: "bg-amber-500/5 text-amber-400 border-amber-500/10",
            processing: "bg-[var(--sa-accent-muted)] text-[var(--sa-accent)] border-[var(--sa-accent-glow)]",
            cancelled: "bg-white/5 text-[var(--sa-fg-dim)] border-white/5",
            refunded: "bg-purple-500/5 text-purple-400 border-purple-500/10",
            failed: "bg-rose-500/5 text-rose-400 border-rose-500/10",
            expired: "bg-white/5 text-[var(--sa-fg-dim)] border-white/5",
        }[status] || "bg-white/5 text-[var(--sa-fg-dim)] border-white/5"

        return (
            <span className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border", styles)}>
                {status}
            </span>
        )
    }

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)

    const formatDate = (date: string | null) => {
        if (!date) return "Not Completed"
        return new Date(date).toLocaleString('en-US', {
            month: 'numeric',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            hour12: true
        })
    }


    // Get display status for invoice
    const getInvoiceStatus = (order: any) => {
        const status = order.status
        const paymentProvider = order.payment?.provider?.toLowerCase() || ''
        const isManualProcess = paymentProvider.includes('manual') || paymentProvider.includes('admin') || paymentProvider.includes('coupon')

        if (status === 'delivered' || status === 'completed') {
            return isManualProcess ? 'manual_completed' : 'completed'
        }
        if (status === 'expired') return 'expired'
        if (status === 'failed') return 'failed'
        if (status === 'pending' || status === 'processing') return 'pending'
        if (status === 'cancelled') return 'cancelled'
        if (status === 'refunded') return 'refunded'
        if (status === 'paid') return 'completed'
        return 'pending'
    }

    const getInvoiceStatusBadge = (order: any) => {
        const invoiceStatus = getInvoiceStatus(order)
        const styles: Record<string, string> = {
            completed: "bg-emerald-500/5 text-emerald-400 border-emerald-500/10",
            manual_completed: "bg-indigo-500/5 text-indigo-400 border-indigo-500/10",
            expired: "bg-white/5 text-[var(--sa-fg-dim)] border-white/5",
            failed: "bg-rose-500/5 text-rose-400 border-rose-500/10",
            pending: "bg-amber-500/5 text-amber-400 border-amber-500/10",
            cancelled: "bg-white/5 text-[var(--sa-fg-dim)] border-white/5",
            refunded: "bg-purple-500/5 text-purple-400 border-purple-500/10",
        }
        const labels: Record<string, string> = {
            completed: "Completed",
            manual_completed: "Manual Completed",
            expired: "Expired",
            failed: "Failed",
            pending: "Pending",
            cancelled: "Cancelled",
            refunded: "Refunded",
        }
        return (
            <span className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border whitespace-nowrap", styles[invoiceStatus] || styles.pending)}>
                {labels[invoiceStatus] || 'Pending'}
            </span>
        )
    }

    return (
        <AdminLayout>
            <div className="space-y-4 max-w-[120rem] mx-auto">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-black text-white tracking-tight">Invoices</h1>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[var(--sa-fg-muted)] hover:text-white hover:bg-white/5"
                            onClick={() => loadData()}
                        >
                            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin text-[var(--sa-accent)]")} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[var(--sa-fg-muted)] hover:text-white hover:bg-white/5"
                            onClick={handleExportCSV}
                        >
                            <Download className="w-3.5 h-3.5" />
                        </Button>
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="h-8 pl-3 pr-8 bg-transparent border-0 text-[var(--sa-fg-muted)] hover:text-white appearance-none cursor-pointer transition-all text-[11px] font-medium focus:outline-none"
                            >
                                <option value="all">All</option>
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="completed">Completed</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="refunded">Refunded</option>
                                <option value="expired">Expired</option>
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--sa-fg-dim)] pointer-events-none" />
                        </div>
                    </div>

                    <div className="relative flex-1 max-w-xs ml-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--sa-fg-dim)]" />
                        <Input
                            placeholder="Search..."
                            className="pl-9 bg-transparent border-0 border-b border-white/10 rounded-none h-8 text-[11px] text-white placeholder:text-[var(--sa-fg-dim)] focus:border-[var(--sa-accent)] focus-visible:ring-0 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="border-t border-white/5 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="px-6 py-3 text-[10px] font-medium text-[var(--sa-fg-dim)] uppercase tracking-wider">Product</th>
                                    <th className="px-6 py-3 text-[10px] font-medium text-[var(--sa-fg-dim)] uppercase tracking-wider">Price</th>
                                    <th className="px-6 py-3 text-[10px] font-medium text-[var(--sa-fg-dim)] uppercase tracking-wider">Paid</th>
                                    <th className="px-6 py-3 text-[10px] font-medium text-[var(--sa-fg-dim)] uppercase tracking-wider">Payment</th>
                                    <th className="px-6 py-3 text-[10px] font-medium text-[var(--sa-fg-dim)] uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-[10px] font-medium text-[var(--sa-fg-dim)] uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-[10px] font-medium text-[var(--sa-fg-dim)] uppercase tracking-wider">Created</th>
                                    <th className="px-6 py-3 text-[10px] font-medium text-[var(--sa-fg-dim)] uppercase tracking-wider">Completed</th>
                                    <th className="px-6 py-3 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {isLoading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={9} className="px-5 py-5 bg-white/[0.005]" />
                                        </tr>
                                    ))
                                ) : filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-5 py-12 text-center text-[var(--sa-fg-dim)] text-[10px] font-bold uppercase tracking-widest">
                                            No invoices found
                                        </td>
                                    </tr>
                                ) : filteredOrders.map((ord) => (
                                    <tr
                                        key={ord.id}
                                        className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                                        onClick={(e) => {
                                            if ((e.target as HTMLElement).closest('button, a, .copy-btn')) return;
                                            window.location.href = `/admin/invoices/${ord.readable_id || ord.payment?.track_id || ord.id}`
                                        }}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-white text-sm font-medium">
                                                    {ord.items_summary}
                                                </span>
                                                <span className="font-mono text-[10px] text-[var(--sa-fg-dim)]">
                                                    {ord.readable_id || ord.id.slice(0, 8)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-medium text-white/80">
                                                {formatCurrency(ord.total)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {(ord.status === 'paid' || ord.status === 'completed' || ord.status === 'delivered') ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 whitespace-nowrap">
                                                    +{formatCurrency(ord.total)}
                                                </span>
                                            ) : (
                                                <span className="text-[var(--sa-fg-dim)] text-[10px] font-medium">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-full bg-white/[0.03] flex items-center justify-center p-1">
                                                    {getPaymentIcon(ord.payment)}
                                                </div>
                                                <span className="text-[11px] text-[var(--sa-fg-muted)]">{getPaymentName(ord.payment)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getInvoiceStatusBadge(ord)}
                                        </td>
                                        <td className="px-6 py-4 text-[var(--sa-fg-dim)] text-[11px]">
                                            {ord.email}
                                        </td>
                                        <td className="px-6 py-4 text-[var(--sa-fg-dim)] text-[11px] whitespace-nowrap">
                                            {formatDate(ord.created_at)}
                                        </td>
                                        <td className="px-6 py-4 text-[var(--sa-fg-dim)] text-[11px] whitespace-nowrap">
                                            {['paid', 'delivered', 'completed'].includes(ord.status)
                                                ? formatDate(ord.updated_at)
                                                : "Not Completed"}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-[var(--sa-fg-dim)] hover:text-white">
                                                        <MoreHorizontal className="w-3.5 h-3.5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-[var(--sa-card)] border-[var(--sa-border)] text-white p-1">
                                                    <DropdownMenuItem onClick={() => window.open(`/invoice?id=${ord.readable_id || ord.payment?.track_id || ord.id}`, '_blank')} className="text-[11px] cursor-pointer focus:bg-white/5">
                                                        <ExternalLink className="w-3.5 h-3.5 mr-2" />
                                                        View Invoice
                                                    </DropdownMenuItem>
                                                    {ord.status !== 'paid' && ord.status !== 'completed' && ord.status !== 'delivered' && (
                                                        <DropdownMenuItem onClick={() => handleMarkAsPaid(ord.id)} className="text-[11px] cursor-pointer text-emerald-400 focus:bg-emerald-400/10">
                                                            <CheckCircle className="w-3.5 h-3.5 mr-2" />
                                                            Manually Process Invoice
                                                        </DropdownMenuItem>
                                                    )}
                                                    {(ord.status === 'paid' || ord.status === 'delivered' || ord.status === 'completed') && (
                                                        <DropdownMenuItem onClick={() => handleRetriggerDelivery(ord.id)} className="text-[11px] cursor-pointer focus:bg-white/5">
                                                            <Gift className="w-3.5 h-3.5 mr-2" />
                                                            Retrigger Delivery
                                                        </DropdownMenuItem>
                                                    )}
                                                    <div className="h-px bg-white/5 my-1" />
                                                    <DropdownMenuItem onClick={() => handleUpdateStatus(ord.id, 'refunded')} className="text-[11px] cursor-pointer text-purple-400 focus:bg-purple-400/10">
                                                        <RotateCcw className="w-3.5 h-3.5 mr-2" />
                                                        Refund
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleUpdateStatus(ord.id, 'cancelled')} className="text-[11px] cursor-pointer text-rose-400 focus:bg-rose-400/10">
                                                        <Ban className="w-3.5 h-3.5 mr-2" />
                                                        Cancel
                                                    </DropdownMenuItem>
                                                    <div className="h-px bg-white/5 my-1" />
                                                    <DropdownMenuItem className="text-[11px] cursor-pointer text-[var(--sa-fg-dim)] focus:bg-white/5">
                                                        <Archive className="w-3.5 h-3.5 mr-2" />
                                                        Archive
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}
