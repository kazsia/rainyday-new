"use client"

import { useState, useEffect } from "react"
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
    Copy
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { adminGetOrders, updateOrderStatus } from "@/lib/db/orders"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function AdminInvoicesPage() {
    const [orders, setOrders] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
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
            paid: "bg-green-500/10 text-green-500 border-green-500/20",
            completed: "bg-green-500/10 text-green-500 border-green-500/20",
            delivered: "bg-green-500/10 text-green-500 border-green-500/20",
            pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
            processing: "bg-brand-primary/10 text-brand-primary border-brand-primary/20",
            cancelled: "bg-red-500/10 text-white/40 border-white/10", // Greyed out for cancelled
            refunded: "bg-purple-500/10 text-purple-500 border-purple-500/20",
            failed: "bg-red-500/10 text-red-500 border-red-500/20",
            expired: "bg-white/5 text-white/40 border-white/10",
        }[status] || "bg-white/5 text-white/40 border-white/10"

        return (
            <span className={cn("px-2.5 py-1 rounded-md text-xs font-medium border capitalize", styles)}>
                {status}
            </span>
        )
    }

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)

    const getPaymentIcon = (provider: string | undefined) => {
        if (!provider) return null
        const p = provider.toLowerCase()
        if (p.includes('btc') || p.includes('bitcoin')) return <img src="https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=035" className="w-4 h-4" alt="BTC" />
        if (p.includes('eth') || p.includes('ethereum')) return <img src="https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=035" className="w-4 h-4" alt="ETH" />
        if (p.includes('ltc') || p.includes('litecoin')) return <img src="https://cryptologos.cc/logos/litecoin-ltc-logo.svg?v=035" className="w-4 h-4" alt="LTC" />
        if (p.includes('usdt')) return <img src="https://cryptologos.cc/logos/tether-usdt-logo.svg?v=035" className="w-4 h-4" alt="USDT" />
        if (p.includes('xmr') || p.includes('monero')) return <img src="https://cryptologos.cc/logos/monero-xmr-logo.svg?v=035" className="w-4 h-4" alt="XMR" />
        return <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[8px]">?</div>
    }

    const getPaymentName = (provider: string | undefined) => {
        if (!provider) return "-"
        const p = provider.toLowerCase()
        if (p.includes('btc')) return "Bitcoin"
        if (p.includes('eth')) return "Ethereum"
        if (p.includes('ltc')) return "Litecoin"
        if (p.includes('usdt')) return "Tether"
        if (p.includes('xmr')) return "Monero"
        return provider
    }

    return (
        <AdminLayout>
            <div className="space-y-6 max-w-[1600px] mx-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Invoices</h1>
                        <p className="text-sm text-[var(--tn-blue-comment)]">Browse and manage your invoices.</p>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--tn-blue-comment)]" />
                        <Input
                            placeholder="Quick Search by ID..."
                            className="pl-10 bg-[var(--tn-blue-current)] border-white/5 h-10 transition-colors focus:border-[var(--tn-blue-aqua)]/50"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <div className="relative group">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="h-10 pl-10 pr-4 bg-[var(--tn-blue-current)] border border-white/5 text-white/60 hover:text-white rounded-lg appearance-none cursor-pointer transition-all focus:border-[var(--tn-blue-aqua)]/50 focus:ring-0 text-sm font-medium"
                            >
                                <option value="all">All Invoices</option>
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="completed">Completed</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="refunded">Refunded</option>
                                <option value="expired">Expired</option>
                            </select>
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors pointer-events-none" />
                        </div>
                        <Button
                            variant="outline"
                            className="border-white/5 bg-[var(--tn-blue-current)] hover:bg-[var(--tn-blue-selection)] text-white/60 h-10"
                            onClick={() => loadData()}
                        >
                            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin text-[var(--tn-blue-aqua)]")} />
                            Refresh
                        </Button>
                        <Button
                            variant="outline"
                            className="border-white/5 bg-[var(--tn-blue-current)] hover:bg-[var(--tn-blue-selection)] text-white/60 h-10"
                            onClick={handleExportCSV}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export to CSV
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-[var(--tn-blue-current)]/30 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.01]">
                                    <th className="px-6 py-4 font-semibold text-white">Status</th>
                                    <th className="px-6 py-4 font-semibold text-white">ID</th>
                                    <th className="px-6 py-4 font-semibold text-white">Products</th>
                                    <th className="px-6 py-4 font-semibold text-white">Price</th>
                                    <th className="px-6 py-4 font-semibold text-white">Paid</th>
                                    <th className="px-6 py-4 font-semibold text-white">Payment Method</th>
                                    <th className="px-6 py-4 font-semibold text-white">E-mail</th>
                                    <th className="px-6 py-4 font-semibold text-white">Created At</th>
                                    <th className="px-6 py-4 font-semibold text-white">Completed At</th>
                                    <th className="px-6 py-4 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {isLoading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={10} className="px-6 py-6 bg-white/[0.005]" />
                                        </tr>
                                    ))
                                ) : filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="px-6 py-12 text-center text-white/20">
                                            No invoices found
                                        </td>
                                    </tr>
                                ) : filteredOrders.map((ord) => (
                                    <tr
                                        key={ord.id}
                                        className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                                        onClick={(e) => {
                                            // Prevent navigation when clicking buttons/links inside the row
                                            if ((e.target as HTMLElement).closest('button, a')) return;
                                            window.location.href = `/admin/invoices/${ord.id}`
                                        }}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(ord.status)}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-white/60">
                                            <div className="flex items-center gap-2">
                                                <span>{ord.readable_id || ord.id.slice(0, 8)}</span>
                                                <button onClick={() => copyToClipboard(ord.readable_id || ord.id)} className="opacity-0 group-hover:opacity-100 hover:text-white transition-opacity">
                                                    <Copy className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-white/80 max-w-[200px] truncate" title={ord.items_summary}>
                                            {ord.items_summary}
                                        </td>
                                        <td className="px-6 py-4 text-white/80 font-medium">
                                            {formatCurrency(ord.total)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {(ord.status === 'paid' || ord.status === 'completed' || ord.status === 'delivered') ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                    +{formatCurrency(ord.total)}
                                                </span>
                                            ) : (
                                                <span className="text-white/20">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-white/80">
                                                {getPaymentIcon(ord.payment?.provider)}
                                                <span>{getPaymentName(ord.payment?.provider)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-white/60">
                                            {ord.email}
                                        </td>
                                        <td className="px-6 py-4 text-white/40 text-xs whitespace-nowrap">
                                            {new Date(ord.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-white/40 text-xs whitespace-nowrap">
                                            {(ord.status === 'paid' || ord.status === 'completed' || ord.status === 'delivered') && ord.updated_at
                                                ? new Date(ord.updated_at).toLocaleString()
                                                : "Not Completed"
                                            }
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-[#1a1f2e] border-white/10 text-white">
                                                    <DropdownMenuItem onClick={() => window.open(`/invoice?id=${ord.id}`, '_blank')}>
                                                        <ExternalLink className="w-4 h-4 mr-2" />
                                                        View Invoice
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleUpdateStatus(ord.id, 'refunded')} className="text-purple-400 focus:text-purple-400">
                                                        <RotateCcw className="w-4 h-4 mr-2" />
                                                        Mark as Refunded
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleUpdateStatus(ord.id, 'cancelled')} className="text-red-400 focus:text-red-400">
                                                        <Ban className="w-4 h-4 mr-2" />
                                                        Cancel Order
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-white/60 focus:text-white">
                                                        <Archive className="w-4 h-4 mr-2" />
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
