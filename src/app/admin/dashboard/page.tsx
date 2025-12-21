import { AdminLayout } from "@/components/admin/admin-layout"
import { getDashboardStats, getChartData, getRecentOrders, getTopProducts, getTopCustomers } from "@/lib/db/dashboard"
import { RevenueChart } from "@/components/admin/dashboard/revenue-chart"
import { Calendar, CreditCard, DollarSign, ShoppingCart, Users, ArrowUpRight, ArrowDownRight } from "lucide-react"
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
            <div className="space-y-6 max-w-[100rem] mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
                        <p className="text-sm text-[var(--sa-fg-muted)] mt-1">Discover the latest updates and insights.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <DateRangePicker />
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <div className="bg-[var(--sa-card)] border border-[var(--sa-border)] rounded-xl overflow-hidden">
                    <div className="p-5 border-b border-[var(--sa-border)] flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white">Recent Orders</h3>
                        <Button variant="ghost" size="sm" className="h-8 text-[11px] text-[var(--sa-fg-muted)] hover:text-white uppercase font-bold tracking-wider" asChild>
                            <Link href="/admin/orders">View All</Link>
                        </Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-[var(--sa-border)] text-[var(--sa-fg-muted)] text-[11px] uppercase font-bold tracking-wider bg-white/[0.01]">
                                    <th className="px-6 py-4">Product</th>
                                    <th className="px-6 py-4">Price</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Method</th>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4 text-right">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--sa-border)]">
                                {recentOrders.map((order) => (
                                    <tr key={order.id} className="group hover:bg-[var(--sa-card-hover)] transition-colors">
                                        <td className="px-6 py-3.5 font-medium text-[var(--sa-fg-bright)]">{order.product}</td>
                                        <td className="px-6 py-3.5 text-[var(--sa-fg)]">{order.price}</td>
                                        <td className="px-6 py-3.5">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border",
                                                order.paid === 'Paid'
                                                    ? "bg-emerald-500/5 text-emerald-500 border-emerald-500/10"
                                                    : "bg-amber-500/5 text-amber-500 border-amber-500/10"
                                            )}>
                                                {order.paid}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3.5 flex items-center gap-2 text-[var(--sa-fg-muted)]">
                                            <CreditCard className="w-3.5 h-3.5 text-[var(--sa-fg-dim)]" />
                                            <span className="text-xs font-medium">{order.method}</span>
                                        </td>
                                        <td className="px-6 py-3.5 text-[var(--sa-fg-muted)] text-xs">{order.email}</td>
                                        <td className="px-6 py-3.5 text-[var(--sa-fg-dim)] text-right text-xs font-mono">
                                            {order.time}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Lists Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Products */}
                    <div className="bg-[var(--sa-card)] border border-[var(--sa-border)] rounded-xl overflow-hidden">
                        <div className="p-5 border-b border-[var(--sa-border)] flex justify-between items-center">
                            <h3 className="text-sm font-bold text-white">Top 5 Products</h3>
                            <div className="flex gap-4 text-[10px] font-bold text-[var(--sa-fg-muted)] uppercase tracking-wider">
                                <span>Total Sales</span>
                                <span>Total Revenue</span>
                            </div>
                        </div>
                        <div className="p-2 space-y-1">
                            {topProducts.map((prod, i) => (
                                <div key={i} className="flex items-center justify-between p-4 hover:bg-[var(--sa-card-hover)] rounded-lg transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white/[0.02] border border-[var(--sa-border)] flex items-center justify-center text-[var(--sa-fg-dim)] text-xs font-bold">
                                            #{i + 1}
                                        </div>
                                        <span className="text-sm font-medium text-[var(--sa-fg-bright)]">{prod.name}</span>
                                    </div>
                                    <div className="flex gap-8 text-sm">
                                        <span className="text-[var(--sa-fg-muted)] w-16 text-right">{prod.sales}</span>
                                        <span className="text-[var(--sa-fg-bright)] font-bold w-20 text-right">${prod.revenue.toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Customers */}
                    <div className="bg-[var(--sa-card)] border border-[var(--sa-border)] rounded-xl overflow-hidden">
                        <div className="p-5 border-b border-[var(--sa-border)] flex justify-between items-center">
                            <h3 className="text-sm font-bold text-white">Top 5 Customers</h3>
                            <div className="flex gap-4 text-[10px] font-bold text-[var(--sa-fg-muted)] uppercase tracking-wider">
                                <span>Total Orders</span>
                                <span>Total Spent</span>
                            </div>
                        </div>
                        <div className="p-2 space-y-1">
                            {topCustomers.map((cust, i) => (
                                <div key={i} className="flex items-center justify-between p-4 hover:bg-[var(--sa-card-hover)] rounded-lg transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white/[0.02] border border-[var(--sa-border)] flex items-center justify-center text-[var(--sa-fg-dim)] text-[10px] font-black">
                                            {cust.email.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-sm font-medium text-[var(--sa-fg-bright)]">{cust.email}</span>
                                    </div>
                                    <div className="flex gap-8 text-sm">
                                        <span className="text-[var(--sa-fg-muted)] w-16 text-right">{cust.orders}</span>
                                        <span className="text-[var(--sa-fg-bright)] font-bold w-20 text-right">${cust.spent.toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
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
