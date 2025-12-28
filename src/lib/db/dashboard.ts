"use server"

import { createAdminClient } from "@/lib/supabase/server"

// --- TYPES ---
export interface StatsCardData {
    value: number | string
    change: string
    trending: 'up' | 'down' | 'neutral'
}

export interface DashboardData {
    revenue: StatsCardData
    orders: StatsCardData
    customers: StatsCardData
}

export interface ChartDataPoint {
    name: string
    revenue: number
    orders: number
}

// --- MAIN STATS ---
export async function getDashboardStats(range?: { from: Date; to: Date }): Promise<DashboardData> {
    try {
        const supabase = await createAdminClient()

        // Current Range
        const to = range?.to || new Date()
        const from = range?.from || new Date(to.getFullYear(), to.getMonth(), to.getDate())

        // Previous Range (for trend calculation)
        const duration = to.getTime() - from.getTime()
        const prevTo = new Date(from)
        const prevFrom = new Date(prevTo.getTime() - duration)

        // Helper to calculate percentage change
        const calcChange = (current: number, prev: number) => {
            if (prev === 0) return current > 0 ? "100" : "0"
            return ((current - prev) / prev * 100).toFixed(2)
        }

        // 1. REVENUE (Paid Orders from Payments table)
        const { data: revCurrent, error: revCurError } = await supabase.from("payments")
            .select("amount")
            .eq("status", "completed")
            .gte("created_at", from.toISOString())
            .lte("created_at", to.toISOString())

        const { data: revPrev, error: revPrevError } = await supabase.from("payments")
            .select("amount")
            .eq("status", "completed")
            .gte("created_at", prevFrom.toISOString())
            .lt("created_at", prevTo.toISOString())

        if (revCurError || revPrevError) {
            console.error("[DASHBOARD_STATS] Revenue fetch error:", revCurError || revPrevError)
        }

        const revenueVal = revCurrent?.reduce((a, b) => a + Number(b.amount), 0) || 0
        const revenuePrev = revPrev?.reduce((a, b) => a + Number(b.amount), 0) || 0
        const revenueChange = calcChange(revenueVal, revenuePrev)

        // 2. ORDERS (All Created Orders)
        const { count: ordCurrent, error: ordCurError } = await supabase.from("orders")
            .select("*", { count: 'exact', head: true })
            .gte("created_at", from.toISOString())
            .lte("created_at", to.toISOString())

        const { count: ordPrev, error: ordPrevError } = await supabase.from("orders")
            .select("*", { count: 'exact', head: true })
            .gte("created_at", prevFrom.toISOString())
            .lt("created_at", prevTo.toISOString())

        if (ordCurError || ordPrevError) {
            console.error("[DASHBOARD_STATS] Orders fetch error:", ordCurError || ordPrevError)
        }

        const ordersVal = ordCurrent || 0
        const ordersChange = calcChange(ordersVal, ordPrev || 0)

        // 3. CUSTOMERS (New Profiles)
        const { count: custCurrent, error: custCurError } = await supabase.from("profiles")
            .select("*", { count: 'exact', head: true })
            .gte("created_at", from.toISOString())
            .lte("created_at", to.toISOString())

        const { count: custPrev, error: custPrevError } = await supabase.from("profiles")
            .select("*", { count: 'exact', head: true })
            .gte("created_at", prevFrom.toISOString())
            .lt("created_at", prevTo.toISOString())

        if (custCurError || custPrevError) {
            console.error("[DASHBOARD_STATS] Customers fetch error:", custCurError || custPrevError)
        }

        const customersVal = custCurrent || 0
        const customersChange = calcChange(customersVal, custPrev || 0)

        return {
            revenue: { value: revenueVal.toFixed(2), change: revenueChange, trending: Number(revenueChange) >= 0 ? 'up' : 'down' },
            orders: { value: ordersVal, change: ordersChange, trending: Number(ordersChange) >= 0 ? 'up' : 'down' },
            customers: { value: customersVal, change: customersChange, trending: Number(customersChange) >= 0 ? 'up' : 'down' }
        }
    } catch (e) {
        console.error("[DASHBOARD_STATS_CRITICAL]", e)
        return {
            revenue: { value: "0.00", change: "0", trending: "neutral" },
            orders: { value: 0, change: "0", trending: "neutral" },
            customers: { value: 0, change: "0", trending: "neutral" }
        }
    }
}

// --- CHART DATA ---
export async function getChartData(range?: { from: Date; to: Date }): Promise<ChartDataPoint[]> {
    try {
        const supabase = await createAdminClient()
        const to = range?.to || new Date()
        const from = range?.from || new Date(to.getFullYear(), to.getMonth(), to.getDate())

        const duration = to.getTime() - from.getTime()
        const groupBy: "hour" | "day" = duration <= 86400000 ? "hour" : "day"

        // Fetch data
        const { data: payments, error: payError } = await supabase.from("payments")
            .select("created_at, amount")
            .eq("status", "completed")
            .gte("created_at", from.toISOString())
            .lte("created_at", to.toISOString())

        const { data: orders, error: ordError } = await supabase.from("orders")
            .select("created_at")
            .gte("created_at", from.toISOString())
            .lte("created_at", to.toISOString())

        if (payError || ordError) {
            console.error("[DASHBOARD_CHART] Data fetch error:", payError || ordError)
        }

        // Aggregation buckets
        const dataMap = new Map<string, { revenue: number, orders: number }>()

        // Initialize buckets
        if (groupBy === "hour") {
            for (let i = 0; i < 24; i++) {
                dataMap.set(`${String(i).padStart(2, '0')}:00`, { revenue: 0, orders: 0 })
            }
        } else {
            const days = Math.ceil(duration / 86400000)
            for (let i = 0; i <= days; i++) {
                const d = new Date(from)
                d.setDate(d.getDate() + i)
                const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                dataMap.set(key, { revenue: 0, orders: 0 })
            }
        }

        // Fill Data
        payments?.forEach(p => {
            const d = new Date(p.created_at)
            const key = groupBy === 'hour' ? `${String(d.getHours()).padStart(2, '0')}:00` : d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
            const val = dataMap.get(key)
            if (val) {
                val.revenue += Number(p.amount)
                dataMap.set(key, val)
            }
        })

        orders?.forEach(o => {
            const d = new Date(o.created_at)
            const key = groupBy === 'hour' ? `${String(d.getHours()).padStart(2, '0')}:00` : d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
            const val = dataMap.get(key)
            if (val) {
                val.orders += 1
                dataMap.set(key, val)
            }
        })

        return Array.from(dataMap.entries()).map(([name, val]) => ({ name, revenue: val.revenue, orders: val.orders }))
    } catch (e) {
        console.error("[DASHBOARD_CHART_CRITICAL]", e)
        return []
    }
}

// --- RECENT ORDERS ---
export async function getRecentOrders(limit = 10, range?: { from: Date; to: Date }) {
    try {
        const supabase = await createAdminClient()
        let query = supabase.from("orders")
            .select(`
                *,
                order_items(product:products(name)),
                payments(provider)
            `)
            .order("created_at", { ascending: false })
            .limit(limit)

        if (range) {
            query = query.gte("created_at", range.from.toISOString()).lte("created_at", range.to.toISOString())
        }

        const { data, error } = await query

        if (error) {
            console.error("[DASHBOARD_ORDERS] Fetch error:", error)
            return []
        }

        return data?.map((o: any) => ({
            id: o.id,
            readable_id: o.readable_id,
            product: (o.order_items as any[])?.[0]?.product?.name || "Unknown",
            price: `$${Number(o.total ?? 0).toFixed(2)}`,
            paid: o.status === 'paid' || o.status === 'delivered' ? `+$${Number(o.total ?? 0).toFixed(2)}` : 'Pending',
            method: formatPaymentMethod((o.payments as any[])?.[0]?.provider),
            provider: (o.payments as any[])?.[0]?.provider || "Crypto",
            email: o.email,
            time: getTimeAgo(new Date(o.created_at)),
            status: o.status
        })) || []
    } catch (e) {
        console.error("[DASHBOARD_ORDERS_CRITICAL]", e)
        return []
    }
}

function getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    if (seconds < 60) return "just now"
    if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)} days ago`
    return `${Math.floor(seconds / 2592000)} months ago`
}

// --- TOP PRODUCTS ---
export async function getTopProducts(limit = 5, range?: { from: Date; to: Date }) {
    try {
        const supabase = await createAdminClient()
        let query = supabase.from("order_items")
            .select("quantity, price, product:products(name), created_at")
            .limit(1000)

        if (range) {
            query = query.gte("created_at", range.from.toISOString()).lte("created_at", range.to.toISOString())
        }

        const { data, error } = await query

        if (error) {
            console.error("[DASHBOARD_TOP_PRODUCTS] Fetch error:", error)
            return []
        }

        const stats = new Map<string, { name: string, sales: number, revenue: number }>()

        data?.forEach((item: any) => {
            if (!item.product?.name) return
            const key = item.product.name
            const val = stats.get(key) || { name: key, sales: 0, revenue: 0 }
            val.sales += item.quantity
            val.revenue += Number(item.price) * item.quantity
            stats.set(key, val)
        })

        return Array.from(stats.values()).sort((a, b) => b.revenue - a.revenue).slice(0, limit)
    } catch (e) {
        console.error("[DASHBOARD_TOP_PRODUCTS_CRITICAL]", e)
        return []
    }
}

// --- TOP CUSTOMERS ---
export async function getTopCustomers(limit = 5, range?: { from: Date; to: Date }) {
    try {
        const supabase = await createAdminClient()
        let query = supabase.from("orders")
            .select("email, total, created_at")
            .eq("status", "paid")
            .limit(1000)

        if (range) {
            query = query.gte("created_at", range.from.toISOString()).lte("created_at", range.to.toISOString())
        }

        const { data, error } = await query

        if (error) {
            console.error("[DASHBOARD_TOP_CUSTOMERS] Fetch error:", error)
            return []
        }

        const stats = new Map<string, { email: string, orders: number, spent: number }>()

        data?.forEach(o => {
            const key = o.email
            const val = stats.get(key) || { email: key, orders: 0, spent: 0 }
            val.orders += 1
            val.spent += Number(o.total)
            stats.set(key, val)
        })

        return Array.from(stats.values()).sort((a, b) => b.spent - a.spent).slice(0, limit)
    } catch (e) {
        console.error("[DASHBOARD_TOP_CUSTOMERS_CRITICAL]", e)
        return []
    }
}

function formatPaymentMethod(method: string | undefined): string {
    if (!method) return "Crypto"
    if (method.toLowerCase() === 'oxapay') return "Crypto"
    return method
}
