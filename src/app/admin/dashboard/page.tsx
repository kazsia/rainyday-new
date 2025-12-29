import { AdminLayout } from "@/components/admin/admin-layout"
import { getDashboardStats, getChartData, getRecentOrders, getTopProducts, getTopCustomers } from "@/lib/db/dashboard"
import { RevenueChart } from "@/components/admin/dashboard/revenue-chart"
import { DashboardRealtimeRefresh } from "@/components/admin/dashboard/dashboard-realtime-refresh"
import { RecentOrdersSection } from "@/components/admin/dashboard/recent-orders-section"
import { Calendar, CreditCard, DollarSign, ShoppingCart, Users, ArrowUpRight, ArrowDownRight, TrendingUp, CheckCircle2, Clock, Mail, Bitcoin, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"

import { DateRangePicker } from "@/components/admin/dashboard/date-range-picker"

export default async function AdminDashboardPage(props: {
    searchParams: Promise<{ from?: string; to?: string; label?: string }>
}) {
    const searchParams = await props.searchParams
    const from = searchParams.from ? new Date(searchParams.from) : undefined
    const to = searchParams.to ? new Date(searchParams.to) : undefined
    const range = from && to ? { from, to } : undefined

    // Parallel data fetching with range
    const [stats, chartData, recentOrders, topProducts, topCustomers] = await Promise.all([
        getDashboardStats(range),
        getChartData(range),
        getRecentOrders(5, range),
        getTopProducts(5, range),
        getTopCustomers(5, range)
    ])

    return (
        <AdminLayout>
            <DashboardRealtimeRefresh />
            <div className="space-y-6 max-w-[100rem] mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
                        <p className="text-sm text-[var(--sa-fg-muted)] mt-1">Real-time performance overview</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <DateRangePicker />
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <StatCard
                        title="Revenue"
                        value={`$${stats.revenue.value}`}
                        change={`${stats.revenue.change}%`}
                        icon={DollarSign}
                        trend={stats.revenue.trending}
                    />
                    <StatCard
                        title="New Orders"
                        value={stats.orders.value}
                        change={`${stats.orders.change}%`}
                        icon={ShoppingCart}
                        trend={stats.orders.trending}
                    />
                    <StatCard
                        title="New Customers"
                        value={stats.customers.value}
                        change={`${stats.customers.change}%`}
                        icon={Users}
                        trend={stats.customers.trending}
                    />
                </div>

                {/* Chart & Side Panel */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Chart Section */}
                    <div className="lg:col-span-3 bg-[var(--sa-card)] border border-[var(--sa-border)] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold text-white">Revenue & Orders</h3>
                            <div className="flex gap-2">
                                <div className="flex items-center gap-2 px-2 py-1 bg-white/[0.02] rounded-md border border-[var(--sa-border)]">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--sa-accent)]" />
                                    <span className="text-[10px] text-[var(--sa-fg-muted)] font-bold uppercase tracking-wider">Revenue</span>
                                </div>
                                <div className="flex items-center gap-2 px-2 py-1 bg-white/[0.02] rounded-md border border-[var(--sa-border)]">
                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                    <span className="text-[10px] text-[var(--sa-fg-muted)] font-bold uppercase tracking-wider">Orders</span>
                                </div>
                            </div>
                        </div>
                        <RevenueChart data={chartData} />
                    </div>
                </div>

                {/* Recent Orders */}
                <RecentOrdersSection recentOrders={recentOrders} />

                {/* Top Lists Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Top Products */}
                    <div className="bg-[var(--sa-card)] border border-[var(--sa-border)] rounded-xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-[var(--sa-border)] flex justify-between items-center bg-gradient-to-r from-white/[0.02] to-transparent">
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--sa-accent)]/20 to-[var(--sa-accent)]/5 border border-[var(--sa-accent)]/20 flex items-center justify-center">
                                    <ShoppingCart className="w-3.5 h-3.5 text-[var(--sa-accent)]" />
                                </div>
                                <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">Top Products</h3>
                            </div>
                            <span className="text-[10px] font-bold text-[var(--sa-fg-dim)] uppercase tracking-wider">Revenue</span>
                        </div>
                        <div className="divide-y divide-[var(--sa-border)]">
                            {(() => {
                                const maxRevenue = Math.max(...topProducts.map(p => p.revenue), 1)
                                return topProducts.map((prod, i) => {
                                    const percentage = (prod.revenue / maxRevenue) * 100
                                    const rankColors = [
                                        'from-amber-400 to-yellow-500',
                                        'from-slate-300 to-slate-400',
                                        'from-amber-600 to-amber-700',
                                        'from-[var(--sa-accent)] to-cyan-400',
                                        'from-[var(--sa-accent)] to-cyan-400'
                                    ]
                                    return (
                                        <div key={i} className="group relative">
                                            {/* Progress bar background */}
                                            <div
                                                className="absolute inset-0 bg-gradient-to-r from-[var(--sa-accent)]/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                                                style={{ width: `${percentage}%` }}
                                            />
                                            <div className="relative flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-all">
                                                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                                                    <div className={cn(
                                                        "w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-black shadow-sm",
                                                        i < 3
                                                            ? `bg-gradient-to-br ${rankColors[i]} text-black/80`
                                                            : "bg-white/[0.05] border border-[var(--sa-border)] text-[var(--sa-fg-dim)]"
                                                    )}>
                                                        {i + 1}
                                                    </div>
                                                    <div className="flex flex-col min-w-0 flex-1">
                                                        <span className="text-[13px] font-semibold text-white truncate">{prod.name}</span>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] text-[var(--sa-fg-dim)]">{prod.sales.toLocaleString()} sales</span>
                                                            <div className="hidden sm:flex items-center gap-1.5 flex-1 max-w-[100px]">
                                                                <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-gradient-to-r from-[var(--sa-accent)] to-cyan-400 rounded-full transition-all duration-500"
                                                                        style={{ width: `${percentage}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end pl-4">
                                                    <span className="text-sm font-bold text-[var(--sa-accent)]">${prod.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            })()}
                        </div>
                    </div>

                    {/* Top Customers */}
                    <div className="bg-[var(--sa-card)] border border-[var(--sa-border)] rounded-xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-[var(--sa-border)] flex justify-between items-center bg-gradient-to-r from-white/[0.02] to-transparent">
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/20 flex items-center justify-center">
                                    <Users className="w-3.5 h-3.5 text-purple-400" />
                                </div>
                                <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">Top Customers</h3>
                            </div>
                            <span className="text-[10px] font-bold text-[var(--sa-fg-dim)] uppercase tracking-wider">Spent</span>
                        </div>
                        <div className="divide-y divide-[var(--sa-border)]">
                            {(() => {
                                const maxSpent = Math.max(...topCustomers.map(c => c.spent), 1)
                                const avatarColors = [
                                    'from-purple-500 to-pink-500',
                                    'from-blue-500 to-cyan-400',
                                    'from-emerald-500 to-teal-400',
                                    'from-orange-500 to-amber-400',
                                    'from-rose-500 to-pink-400'
                                ]
                                return topCustomers.map((cust, i) => {
                                    const percentage = (cust.spent / maxSpent) * 100
                                    return (
                                        <div key={i} className="group relative">
                                            <div
                                                className="absolute inset-0 bg-gradient-to-r from-purple-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                                                style={{ width: `${percentage}%` }}
                                            />
                                            <div className="relative flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-all">
                                                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-sm bg-gradient-to-br",
                                                        avatarColors[i % avatarColors.length]
                                                    )}>
                                                        {(cust.email || "G").charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col min-w-0 flex-1">
                                                        <span className="text-[13px] font-semibold text-white truncate">{cust.email || "Guest"}</span>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] text-[var(--sa-fg-dim)]">{cust.orders} order{cust.orders !== 1 ? 's' : ''}</span>
                                                            <div className="hidden sm:flex items-center gap-1.5 flex-1 max-w-[100px]">
                                                                <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-400 rounded-full transition-all duration-500"
                                                                        style={{ width: `${percentage}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end pl-4">
                                                    <span className="text-sm font-bold text-purple-400">${cust.spent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            })()}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}

function StatCard({ title, value, change, icon: Icon, trend }: { title: string, value: string | number, change: string, icon: any, trend: 'up' | 'down' | 'neutral' }) {
    return (
        <div className="bg-[var(--sa-card)] border border-[var(--sa-border)] rounded-xl p-5 relative overflow-hidden group hover:border-[var(--sa-border-hover)] transition-colors">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <p className="text-xs font-bold text-[var(--sa-fg-muted)] uppercase tracking-wider">{title}</p>
                    <h3 className="text-3xl font-bold text-white mt-1 tracking-tight">{value}</h3>
                </div>
                <div className="w-8 h-8 rounded-lg bg-white/[0.02] border border-[var(--sa-border)] flex items-center justify-center text-[var(--sa-fg-dim)]">
                    <Icon className="w-4 h-4" />
                </div>
            </div>

            <div className="flex items-center gap-2">
                <div className={cn(
                    "flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded",
                    trend === 'up' ? "text-emerald-500 bg-emerald-500/5" : trend === 'down' ? "text-rose-500 bg-rose-500/5" : "text-[var(--sa-fg-muted)]"
                )}>
                    {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {change}
                </div>
                <span className="text-[10px] text-[var(--sa-fg-dim)] font-medium">vs last period</span>
            </div>
        </div>
    )
}
