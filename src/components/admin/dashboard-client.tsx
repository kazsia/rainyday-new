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
    Megaphone
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
            <div suppressHydrationWarning>
                <h1 className="text-2xl font-black text-white mb-1">Dashboard</h1>
                <p className="text-white/40 text-sm">Discover the latest updates and insights regarding your store today.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" suppressHydrationWarning>
                {/* Main Content - 3 columns */}
                <div className="lg:col-span-3 space-y-6" suppressHydrationWarning>
                    {/* Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4" suppressHydrationWarning>
                        <Card className="bg-[#0d1321] border-white/5" suppressHydrationWarning>
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-white/60 text-sm font-medium">Revenue</span>
                                    <DollarSign className="w-5 h-5 text-white/20" />
                                </div>
                                <p className="text-3xl font-black text-white mb-2">${stats.revenue.value}</p>
                                <div className={cn(
                                    "flex items-center gap-1 text-xs",
                                    stats.revenue.trending === "up" ? "text-green-400" : "text-red-400"
                                )}>
                                    {stats.revenue.trending === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    <span>{stats.revenue.change}%</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-[#0d1321] border-white/5">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-white/60 text-sm font-medium">New Orders</span>
                                    <ShoppingCart className="w-5 h-5 text-white/20" />
                                </div>
                                <p className="text-3xl font-black text-white mb-2">{stats.orders.value}</p>
                                <div className={cn(
                                    "flex items-center gap-1 text-xs",
                                    stats.orders.trending === "up" ? "text-green-400" : "text-red-400"
                                )}>
                                    {stats.orders.trending === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    <span>{stats.orders.change}%</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-[#0d1321] border-white/5">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-white/60 text-sm font-medium">New Customers</span>
                                    <Users className="w-5 h-5 text-white/20" />
                                </div>
                                <p className="text-3xl font-black text-white mb-2">{stats.customers.value}</p>
                                <div className={cn(
                                    "flex items-center gap-1 text-xs",
                                    stats.customers.trending === "up" ? "text-green-400" : "text-red-400"
                                )}>
                                    {stats.customers.trending === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    <span>{stats.customers.change}%</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Chart */}
                    <Card className="bg-[#0d1321] border-white/5" suppressHydrationWarning>
                        <CardHeader className="pb-2" suppressHydrationWarning>
                            <div className="flex items-center justify-between" suppressHydrationWarning>
                                <CardTitle className="text-lg font-bold text-white">{"Revenue & Orders"}</CardTitle>
                                <div className="flex items-center gap-2" suppressHydrationWarning>
                                    {["1D", "7D", "1M", "3M", "1Y", "ALL"].map((period) => (
                                        <button
                                            key={period}
                                            className={cn(
                                                "px-2 py-1 rounded text-xs font-medium",
                                                period === "1D" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"
                                            )}
                                        >
                                            {period}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="h-[300px] pt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#ffffff40"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#ffffff40"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#0d1321", border: "1px solid #ffffff10", borderRadius: "8px" }}
                                        labelStyle={{ color: "#ffffff60" }}
                                    />
                                    <Legend
                                        wrapperStyle={{ paddingTop: "20px" }}
                                        formatter={(value) => <span className="text-white/60 text-xs">{value}</span>}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        name="Revenue"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="orders"
                                        name="Orders"
                                        stroke="#f97316"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Latest Orders Table */}
                    <Card className="bg-[#0d1321] border-white/5" suppressHydrationWarning>
                        <CardHeader suppressHydrationWarning>
                            <CardTitle className="text-lg font-bold text-white">{"Latest Completed Orders"}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {orders.length === 0 ? (
                                <div className="text-center py-8 text-white/40">
                                    <p>No orders yet</p>
                                    <p className="text-sm mt-1">Orders will appear here once customers make purchases</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="text-left text-white/40 text-xs uppercase tracking-wider">
                                                <th className="pb-4 font-medium">Products</th>
                                                <th className="pb-4 font-medium">Price</th>
                                                <th className="pb-4 font-medium">Paid</th>
                                                <th className="pb-4 font-medium">Payment Method</th>
                                                <th className="pb-4 font-medium">E-mail</th>
                                                <th className="pb-4 font-medium">Time</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm">
                                            {orders.map((order) => (
                                                <tr key={order.id} className="border-t border-white/5">
                                                    <td className="py-4 text-white">{order.product}</td>
                                                    <td className="py-4 text-white/60">{order.price}</td>
                                                    <td className="py-4">
                                                        <span className={cn(
                                                            "px-2 py-1 rounded text-xs font-medium",
                                                            order.status === "paid" || order.status === "delivered"
                                                                ? "bg-green-500/10 text-green-400"
                                                                : "bg-yellow-500/10 text-yellow-400"
                                                        )}>
                                                            {order.paid}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 text-white/60">{order.method}</td>
                                                    <td className="py-4 text-brand">{order.email}</td>
                                                    <td className="py-4 text-white/40">{order.time}</td>
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
                    <Card className="bg-[#0d1321] border-white/5">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold text-white">
                                Stay Up To Date With <span className="text-brand">Rainyday</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button variant="outline" className="w-full justify-start gap-2 border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm">
                                <MessageCircle className="w-4 h-4" />
                                Join Discord
                            </Button>
                            <Button variant="outline" className="w-full justify-start gap-2 border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm">
                                <Send className="w-4 h-4" />
                                Join Telegram
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Announcements */}
                    <Card className="bg-[#0d1321] border-white/5">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                                <span className="text-brand">Rainyday</span> Announcements
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {announcements.map((item, i) => (
                                <div key={i} className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
                                        <Megaphone className="w-4 h-4 text-brand" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-sm font-medium text-white truncate">{item.title}</p>
                                            <span className="text-[10px] text-white/30 whitespace-nowrap">{item.time}</span>
                                        </div>
                                        <p className="text-xs text-white/40 truncate">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
