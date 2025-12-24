"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
    TrendingDown,
    TrendingUp,
    DollarSign,
    ShoppingCart,
    Users,
    MessageCircle,
    Send,
    Megaphone,
    Settings
} from "lucide-react"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts"

interface DashboardClientProps {
    stats: {
        revenue: { value: string | number; change: string; trending: string }
        orders: { value: number | string; change: string; trending: string }
        customers: { value: number | string; change: string; trending: string }
    }
    orders: Array<{
        id: string
        product: string
        price: string
        paid: string
        method: string
        email: string
        time: string
        status: string
    }>
    chartData: Array<{
        name: string
        revenue: number
        orders: number
    }>
}

// Announcements
const announcements = [
    { title: "Platform Update - December 2025", desc: "New Payment Methods, Security Improvements", time: "Just now" },
    { title: "Supabase Integration", desc: "Real-time data, Auth, Storage now live", time: "Today" },
    { title: "Admin Panel Redesign", desc: "New dashboard with live analytics", time: "Today" },
]

export function DashboardClient({ stats, orders, chartData }: DashboardClientProps) {
    return (
        <div className="space-y-6" suppressHydrationWarning>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" suppressHydrationWarning>
                <div>
                    <h1 className="text-xl font-black text-white tracking-tight">Dashboard</h1>
                    <p className="text-[11px] font-medium text-[var(--sa-fg-dim)] mt-0.5">Discover the latest updates and insights regarding your store today.</p>
                </div>
                <div className="flex items-center gap-2 bg-black/20 p-1 rounded-lg border border-white/5">
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-white/40 hover:text-white px-2">
                        Today
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-white/40 hover:text-white">
                        <Settings className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6" suppressHydrationWarning>
                {/* Main Content - 3 columns */}
                <div className="xl:col-span-3 space-y-6" suppressHydrationWarning>
                    {/* Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4" suppressHydrationWarning>
                        <Card className="bg-[var(--sa-card)] border-[var(--sa-border)]" suppressHydrationWarning>
                            <CardContent className="p-5 flex items-center justify-between">
                                <div>
                                    <span className="text-[var(--sa-fg-dim)] text-[10px] font-black uppercase tracking-widest mb-1 block">Revenue</span>
                                    <p className="text-2xl font-black text-white">${stats.revenue.value}</p>
                                    <div className={cn(
                                        "flex items-center gap-1 text-[10px] font-bold mt-1",
                                        stats.revenue.trending === "up" ? "text-emerald-400" : "text-rose-400"
                                    )}>
                                        <span>{stats.revenue.change}%</span>
                                    </div>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center">
                                    <DollarSign className="w-5 h-5 text-white/40 transition-colors group-hover:text-[var(--sa-accent)]" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-[var(--sa-card)] border-[var(--sa-border)]">
                            <CardContent className="p-5 flex items-center justify-between">
                                <div>
                                    <span className="text-[var(--sa-fg-dim)] text-[10px] font-black uppercase tracking-widest mb-1 block">New Orders</span>
                                    <p className="text-2xl font-black text-white">{stats.orders.value}</p>
                                    <div className={cn(
                                        "flex items-center gap-1 text-[10px] font-bold mt-1",
                                        stats.orders.trending === "up" ? "text-emerald-400" : "text-rose-400"
                                    )}>
                                        <span>{stats.orders.change}%</span>
                                    </div>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center">
                                    <ShoppingCart className="w-5 h-5 text-white/40" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-[var(--sa-card)] border-[var(--sa-border)]">
                            <CardContent className="p-5 flex items-center justify-between">
                                <div>
                                    <span className="text-[var(--sa-fg-dim)] text-[10px] font-black uppercase tracking-widest mb-1 block">New Customers</span>
                                    <p className="text-2xl font-black text-white">{stats.customers.value}</p>
                                    <div className={cn(
                                        "flex items-center gap-1 text-[10px] font-bold mt-1",
                                        stats.customers.trending === "up" ? "text-emerald-400" : "text-rose-400"
                                    )}>
                                        <span>{stats.customers.change}%</span>
                                    </div>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-white/40" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Chart */}
                    <Card className="bg-[var(--sa-card)] border-[var(--sa-border)] overflow-hidden" suppressHydrationWarning>
                        <CardHeader className="pb-2 border-b border-white/[0.02] bg-white/[0.01]" suppressHydrationWarning>
                            <div className="flex items-center justify-between" suppressHydrationWarning>
                                <CardTitle className="text-sm font-black text-white uppercase tracking-widest">Revenue & Orders</CardTitle>
                                <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-md border border-white/5" suppressHydrationWarning>
                                    {["1D", "7D", "1M", "ALL"].map((period) => (
                                        <button
                                            key={period}
                                            className={cn(
                                                "px-2 py-1 rounded text-[9px] font-black transition-all",
                                                period === "1D" ? "bg-white/10 text-white shadow-sm" : "text-white/30 hover:text-white/60"
                                            )}
                                        >
                                            {period}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="h-[320px] pt-6 pr-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#ffffff20"
                                        fontSize={9}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        stroke="#ffffff20"
                                        fontSize={9}
                                        tickLine={false}
                                        axisLine={false}
                                        dx={-10}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#080a0f", border: "1px solid #1a1e26", borderRadius: "12px", fontSize: "11px" }}
                                        labelStyle={{ color: "#ffffff40", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        name="Revenue"
                                        stroke="var(--sa-accent)"
                                        strokeWidth={2.5}
                                        dot={false}
                                        animationDuration={1500}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="orders"
                                        name="Orders"
                                        stroke="#f97316"
                                        strokeWidth={2}
                                        dot={false}
                                        strokeDasharray="4 4"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Latest Orders Table */}
                    <Card className="bg-[var(--sa-card)] border-[var(--sa-border)]" suppressHydrationWarning>
                        <CardHeader className="pb-0" suppressHydrationWarning>
                            <CardTitle className="text-sm font-black text-white uppercase tracking-widest">Latest Completed Orders</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {orders.length === 0 ? (
                                <div className="text-center py-12 text-white/20">
                                    <ShoppingCart className="w-8 h-8 mx-auto mb-3 opacity-10" />
                                    <p className="text-xs font-bold uppercase tracking-widest">No orders yet</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="text-left text-[var(--sa-fg-dim)] text-[9px] font-black uppercase tracking-widest border-b border-white/5">
                                                <th className="pb-3 px-1">Products</th>
                                                <th className="pb-3 px-1">Price</th>
                                                <th className="pb-3 px-1">Paid</th>
                                                <th className="pb-3 px-1">Payment Method</th>
                                                <th className="pb-3 px-1">E-mail</th>
                                                <th className="pb-3 px-1 text-right">Time</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-[11px]">
                                            {orders.map((order) => (
                                                <tr key={order.id} className="border-b border-white/[0.02] last:border-0 hover:bg-white/[0.01] transition-colors">
                                                    <td className="py-3 px-1 font-bold text-white">{order.product}</td>
                                                    <td className="py-3 px-1 text-[var(--sa-fg-dim)]">${order.price}</td>
                                                    <td className="py-3 px-1">
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border",
                                                            order.status === "paid" || order.status === "delivered"
                                                                ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/10"
                                                                : "bg-amber-500/5 text-amber-400 border-amber-500/10"
                                                        )}>
                                                            {order.paid}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-1 text-[var(--sa-fg-dim)]">{order.method}</td>
                                                    <td className="py-3 px-1 text-[var(--sa-fg-muted)]">{order.email}</td>
                                                    <td className="py-3 px-1 text-right text-[var(--sa-fg-dim)]">{order.time}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Sidebar - 1 column */}
                <div className="space-y-6">
                    {/* Stay Up To Date */}
                    <Card className="bg-[var(--sa-card)] border-[var(--sa-border)] overflow-hidden">
                        <div className="bg-gradient-to-br from-[var(--sa-accent-muted)] to-transparent p-4 border-b border-white/5">
                            <h3 className="text-xs font-black text-white uppercase tracking-widest">Stay Up To Date</h3>
                            <p className="text-[10px] text-[var(--sa-fg-dim)] mt-1 font-medium">Join our community channels</p>
                        </div>
                        <CardContent className="p-4 space-y-2">
                            <Button variant="outline" className="w-full justify-start gap-2.5 bg-white/[0.02] border-white/5 hover:bg-white/5 text-white/70 hover:text-white text-[11px] font-bold h-9">
                                <div className="w-5 h-5 rounded-md bg-indigo-500/20 flex items-center justify-center">
                                    <MessageCircle className="w-3.5 h-3.5 text-indigo-400" />
                                </div>
                                Join Discord
                            </Button>
                            <Button variant="outline" className="w-full justify-start gap-2.5 bg-white/[0.02] border-white/5 hover:bg-white/5 text-white/70 hover:text-white text-[11px] font-bold h-9">
                                <div className="w-5 h-5 rounded-md bg-sky-500/20 flex items-center justify-center">
                                    <Send className="w-3.5 h-3.5 text-sky-400" />
                                </div>
                                Join Telegram
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Announcements */}
                    <Card className="bg-[var(--sa-card)] border-[var(--sa-border)]">
                        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-xs font-black text-white uppercase tracking-widest">Announcements</CardTitle>
                            <Megaphone className="w-4 h-4 text-[var(--sa-accent)]" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {announcements.map((item, i) => (
                                <div key={i} className="group relative pl-4 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[2px] before:bg-white/[0.03] hover:before:bg-[var(--sa-accent-glow)] transition-all">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <p className="text-[11px] font-bold text-white group-hover:text-[var(--sa-accent)] transition-colors truncate">{item.title}</p>
                                        <span className="text-[9px] text-[var(--sa-fg-dim)] whitespace-nowrap">{item.time}</span>
                                    </div>
                                    <p className="text-[10px] text-[var(--sa-fg-dim)] line-clamp-2 leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
