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
                <div>
                    <h1 className="text-3xl font-black mb-2">Orders</h1>
                    <p className="text-muted-foreground">Monitor and manage customer orders.</p>
                </div>

                <Card className="bg-card border-white/5">
                    <CardHeader className="border-b border-white/5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="relative w-full md:w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search orders..."
                                    className="pl-10 bg-white/5 border-white/10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" className="gap-2 border-white/10" onClick={() => loadData()}>
                                    <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                                    Refresh
                                </Button>
                                <Button variant="outline" size="sm" className="border-white/10">
                                    Export CSV
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* Desktop Table View */}
                        <div className="hidden lg:block">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-white/5">
                                        <TableHead>Order ID</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading orders...</TableCell>
                                        </TableRow>
                                    ) : filteredOrders.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No orders found.</TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredOrders.map((order) => (
                                            <TableRow key={order.id} className="border-white/5 hover:bg-white/[0.02]">
                                                <TableCell className="font-mono text-xs font-bold">{order.readable_id || order.id.slice(0, 8)}</TableCell>
                                                <TableCell className="text-sm">{order.email}</TableCell>
                                                <TableCell className="text-sm max-w-[200px] truncate">{order.items_summary}</TableCell>
                                                <TableCell className="font-bold">${order.total.toFixed(2)}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</TableCell>
                                                <TableCell>
                                                    <Badge className={cn(
                                                        order.status === "paid" || order.status === "completed" || order.status === "delivered" ? "bg-green-500/10 text-green-500" :
                                                            order.status === "pending" ? "bg-yellow-500/10 text-yellow-500" :
                                                                "bg-red-500/10 text-red-500",
                                                        "border-none capitalize"
                                                    )}>
                                                        {order.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <OrderActions order={order} />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="lg:hidden divide-y divide-white/5">
                            {isLoading ? (
                                <div className="p-8 text-center text-muted-foreground">Loading orders...</div>
                            ) : filteredOrders.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">No orders found.</div>
                            ) : (
                                filteredOrders.map((order) => (
                                    <div key={order.id} className="p-4 space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Hash className="w-3 h-3 text-muted-foreground" />
                                                    <span className="font-mono text-xs font-bold text-white">{order.readable_id || order.id.slice(0, 8)}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-3 h-3 text-muted-foreground" />
                                                    <span className="text-[10px] text-muted-foreground">{new Date(order.created_at).toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <Badge className={cn(
                                                order.status === "paid" || order.status === "completed" || order.status === "delivered" ? "bg-green-500/10 text-green-500" :
                                                    order.status === "pending" ? "bg-yellow-500/10 text-yellow-500" :
                                                        "bg-red-500/10 text-red-500",
                                                "border-none capitalize text-[10px] py-0 px-2"
                                            )}>
                                                {order.status}
                                            </Badge>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-3 h-3 text-muted-foreground" />
                                                <span className="text-xs text-white truncate">{order.email}</span>
                                            </div>
                                            <div className="bg-white/5 rounded-lg p-3">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Products</p>
                                                <p className="text-xs text-white line-clamp-2">{order.items_summary}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-2">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Total</span>
                                                <span className="text-lg font-black text-brand-primary">${order.total.toFixed(2)}</span>
                                            </div>
                                            <OrderActions order={order} />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    )
}
