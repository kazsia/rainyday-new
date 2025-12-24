"use client"

import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
    Search,
    MoreVertical,
    Eye,
    RefreshCw,
    Download,
    ExternalLink,
    Plus,
    CreditCard,
    Calendar,
    Mail,
    Hash
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { adminGetOrders } from "@/lib/db/orders"
import { OrderActions } from "./order-actions"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import Link from "next/link"

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setIsLoading(true)
        try {
            const data = await adminGetOrders()
            // Map payment info for easier access
            const formatted = data?.map((order: any) => ({
                ...order,
                items_summary: order.order_items?.map((i: any) => i.product?.name).join(", ") || "Unknown Product"
            }))
            setOrders(formatted || [])
        } catch (error) {
            toast.error("Failed to load orders")
        } finally {
            setIsLoading(false)
        }
    }

    const filteredOrders = orders.filter(ord =>
        ord.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ord.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ord.readable_id?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <AdminLayout>
            <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight">Orders</h1>
                        <p className="text-[11px] font-medium text-[var(--sa-fg-dim)] mt-0.5">Transactional history and order management</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-8 bg-white/5 border-white/5 text-[var(--sa-fg-muted)] hover:text-white hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest px-3 gap-2" onClick={() => loadData()}>
                            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
                            Refresh
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 bg-white/5 border-white/5 text-[var(--sa-fg-muted)] hover:text-white hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest px-3">
                            <Download className="w-3.5 h-3.5 mr-1.5" />
                            Export
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[var(--sa-card)] border border-[var(--sa-border)] p-2.5 rounded-xl">
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                        <div className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] font-black text-[var(--sa-fg-muted)] uppercase tracking-widest">
                            Total: {filteredOrders.length}
                        </div>
                    </div>

                    <div className="relative w-full lg:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--sa-fg-dim)]" />
                        <Input
                            placeholder="Search orders, emails, IDs..."
                            className="pl-9 bg-black/20 border-white/5 h-8 text-[11px] text-white placeholder:text-[var(--sa-fg-dim)] focus:border-[var(--sa-accent-glow)] transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="bg-[var(--sa-card)] border border-[var(--sa-border)] rounded-xl overflow-hidden shadow-sm">
                    {/* Desktop Table View */}
                    <div className="hidden lg:block overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5 bg-black/20">
                                    <th className="px-5 py-3 text-[9px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest">Order ID</th>
                                    <th className="px-5 py-3 text-[9px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest">Customer</th>
                                    <th className="px-5 py-3 text-[9px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest">Product</th>
                                    <th className="px-5 py-3 text-[9px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest">Amount</th>
                                    <th className="px-5 py-3 text-[9px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest">Date</th>
                                    <th className="px-5 py-3 text-[9px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest">Status</th>
                                    <th className="px-5 py-3 text-[9px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-8 text-[var(--sa-fg-dim)] text-[11px] font-medium">Loading orders...</td>
                                    </tr>
                                ) : filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-8 text-[var(--sa-fg-dim)] text-[11px] font-medium">No orders found.</td>
                                    </tr>
                                ) : (
                                    filteredOrders.map((order) => (
                                        <tr key={order.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-5 py-2.5 font-mono text-[10px] font-bold text-white">{order.readable_id || order.id.slice(0, 8)}</td>
                                            <td className="px-5 py-2.5 text-[11px] text-[var(--sa-fg-muted)] truncate max-w-[150px]">{order.email}</td>
                                            <td className="px-5 py-2.5 text-[11px] text-[var(--sa-fg-muted)] max-w-[200px] truncate">{order.items_summary}</td>
                                            <td className="px-5 py-2.5 text-xs font-black text-white">${order.total.toFixed(2)}</td>
                                            <td className="px-5 py-2.5 text-[10px] text-[var(--sa-fg-dim)] font-medium">
                                                {new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                            <td className="px-5 py-2.5">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border",
                                                    order.status === "paid" || order.status === "completed" || order.status === "delivered"
                                                        ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/10"
                                                        : order.status === "pending"
                                                            ? "bg-amber-500/5 text-amber-400 border-amber-500/10"
                                                            : "bg-rose-500/5 text-rose-400 border-rose-500/10"
                                                )}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-2.5 text-right">
                                                <OrderActions order={order} />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden divide-y divide-white/5">
                        {isLoading ? (
                            <div className="p-8 text-center text-[var(--sa-fg-dim)] text-[11px]">Loading orders...</div>
                        ) : filteredOrders.length === 0 ? (
                            <div className="p-8 text-center text-[var(--sa-fg-dim)] text-[11px]">No orders found.</div>
                        ) : (
                            filteredOrders.map((order) => (
                                <div key={order.id} className="p-4 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="px-1 py-0.5 rounded bg-white/5 text-[9px] font-black text-[var(--sa-fg-dim)] uppercase">ID</span>
                                                <span className="font-mono text-xs font-black text-white">{order.readable_id || order.id.slice(0, 8)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3 h-3 text-[var(--sa-fg-dim)]" />
                                                <span className="text-[10px] text-[var(--sa-fg-dim)] font-medium">{new Date(order.created_at).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border",
                                            order.status === "paid" || order.status === "completed" || order.status === "delivered"
                                                ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/10"
                                                : order.status === "pending"
                                                    ? "bg-amber-500/5 text-amber-400 border-amber-500/10"
                                                    : "bg-rose-500/5 text-rose-400 border-rose-500/10"
                                        )}>
                                            {order.status}
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-3 h-3 text-[var(--sa-fg-dim)]" />
                                            <span className="text-[11px] text-[var(--sa-fg-muted)] truncate font-medium">{order.email}</span>
                                        </div>
                                        <div className="bg-white/[0.02] border border-white/5 rounded-lg p-2.5">
                                            <p className="text-[9px] font-black text-[var(--sa-fg-dim)] uppercase tracking-wider mb-1">Products</p>
                                            <p className="text-[11px] text-white font-medium line-clamp-1">{order.items_summary}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-1">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest">Total</span>
                                            <span className="text-lg font-black text-[var(--sa-accent)]">${order.total.toFixed(2)}</span>
                                        </div>
                                        <OrderActions order={order} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}
