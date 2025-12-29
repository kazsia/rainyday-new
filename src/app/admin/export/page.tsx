"use client"

import { AdminLayout } from "@/components/admin/admin-layout"
import {
    Download,
    Users,
    ShoppingCart,
    Package,
    ShieldCheck,
    Database,
    FileSpreadsheet,
    Loader2,
    FileJson,
    Table,
    Calendar,
    CheckCircle2,
    Clock,
    BarChart3
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { adminGetOrders } from "@/lib/db/orders"
import { getCustomers } from "@/lib/actions/admin-customers"
import { getProducts } from "@/lib/db/products"
import { toast } from "@/components/ui/sonner"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export default function AdminExportPage() {
    const [isExporting, setIsExporting] = useState<string | null>(null)
    const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv')
    const [lastExport, setLastExport] = useState<{ type: string; time: string } | null>(null)

    const exportToCSV = (data: any[], filename: string, headers: string[]) => {
        const csvContent = [
            headers.join(","),
            ...data.map(row => headers.map(h => {
                const key = h.toLowerCase().replace(/ /g, '_')
                const val = row[key]
                if (val === null || val === undefined) return ""
                return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
            }).join(","))
        ].join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        downloadBlob(blob, `${filename}_${new Date().toISOString().slice(0, 10)}.csv`)
    }

    const exportToJSON = (data: any[], filename: string) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
        downloadBlob(blob, `${filename}_${new Date().toISOString().slice(0, 10)}.json`)
    }

    const downloadBlob = (blob: Blob, filename: string) => {
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", filename)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handleExportOrders = async () => {
        setIsExporting('orders')
        try {
            const data = await adminGetOrders()
            if (!data || data.length === 0) return toast.error("No orders found")
            const formatted = data.map((o: any) => ({
                id: o.id,
                readable_id: o.readable_id || o.id.slice(0, 8),
                email: o.email,
                status: o.status,
                total: o.total,
                created_at: o.created_at
            }))

            if (exportFormat === 'csv') {
                exportToCSV(formatted, "orders_export", ["ID", "Readable ID", "Email", "Status", "Total", "Created At"])
            } else {
                exportToJSON(formatted, "orders_export")
            }
            setLastExport({ type: "Orders", time: new Date().toLocaleTimeString() })
            toast.success(`Orders exported as ${exportFormat.toUpperCase()}`)
        } catch (error) {
            toast.error("Export failed")
        } finally {
            setIsExporting(null)
        }
    }

    const handleExportCustomers = async () => {
        setIsExporting('customers')
        try {
            const res = await getCustomers(1, "", "all")
            if (!res.success || !res.users || res.users.length === 0) return toast.error("No customers found")
            const formatted = res.users.map((c: any) => ({
                id: c.id,
                email: c.email,
                full_name: c.full_name || "N/A",
                orders_count: c.orders_count || 0,
                total_spent: c.total_spent || 0,
                created_at: c.created_at
            }))

            if (exportFormat === 'csv') {
                exportToCSV(formatted, "customers_export", ["ID", "Email", "Full Name", "Orders Count", "Total Spent", "Created At"])
            } else {
                exportToJSON(formatted, "customers_export")
            }
            setLastExport({ type: "Customers", time: new Date().toLocaleTimeString() })
            toast.success(`Customers exported as ${exportFormat.toUpperCase()}`)
        } catch (error) {
            toast.error("Export failed")
        } finally {
            setIsExporting(null)
        }
    }

    const handleExportProducts = async () => {
        setIsExporting('products')
        try {
            const data = await getProducts()
            if (!data || data.length === 0) return toast.error("No products found")
            const formatted = data.map((p: any) => ({
                id: p.id,
                name: p.name,
                price: p.price,
                stock: p.stock_count || 0,
                delivery_type: p.delivery_type,
                status: p.is_active ? "Active" : "Inactive",
                created_at: p.created_at
            }))

            if (exportFormat === 'csv') {
                exportToCSV(formatted, "products_export", ["ID", "Name", "Price", "Stock", "Delivery Type", "Status", "Created At"])
            } else {
                exportToJSON(formatted, "products_export")
            }
            setLastExport({ type: "Products", time: new Date().toLocaleTimeString() })
            toast.success(`Products exported as ${exportFormat.toUpperCase()}`)
        } catch (error) {
            toast.error("Export failed")
        } finally {
            setIsExporting(null)
        }
    }

    return (
        <AdminLayout>
            <div className="max-w-5xl mx-auto space-y-8 pb-20">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--sa-accent)]/20 to-purple-500/20 flex items-center justify-center border border-[var(--sa-accent)]/20">
                                <Database className="w-6 h-6 text-[var(--sa-accent)]" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-white tracking-tight">Data Export</h1>
                                <p className="text-xs font-medium text-white/40">Extract platform data into portable formats</p>
                            </div>
                        </div>
                    </div>

                    {/* Format Toggle */}
                    <div className="flex items-center gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
                        <button
                            onClick={() => setExportFormat('csv')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
                                exportFormat === 'csv'
                                    ? "bg-white text-black"
                                    : "text-white/40 hover:text-white/60"
                            )}
                        >
                            <Table className="w-3.5 h-3.5" />
                            CSV
                        </button>
                        <button
                            onClick={() => setExportFormat('json')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
                                exportFormat === 'json'
                                    ? "bg-white text-black"
                                    : "text-white/40 hover:text-white/60"
                            )}
                        >
                            <FileJson className="w-3.5 h-3.5" />
                            JSON
                        </button>
                    </div>
                </div>

                {/* Last Export Status */}
                {lastExport && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
                    >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-bold text-emerald-500">
                            {lastExport.type} exported at {lastExport.time}
                        </span>
                    </motion.div>
                )}

                {/* Export Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ExportCard
                        title="Orders"
                        description="Transaction history with status, totals, and customer info."
                        icon={ShoppingCart}
                        color="#3B82F6"
                        stats={{ label: "Records", value: "All" }}
                        onExport={handleExportOrders}
                        isLoading={isExporting === 'orders'}
                        format={exportFormat}
                    />
                    <ExportCard
                        title="Customers"
                        description="User directory with purchase history and metadata."
                        icon={Users}
                        color="#8B5CF6"
                        stats={{ label: "Records", value: "All" }}
                        onExport={handleExportCustomers}
                        isLoading={isExporting === 'customers'}
                        format={exportFormat}
                    />
                    <ExportCard
                        title="Products"
                        description="Inventory with pricing, stock levels, and status."
                        icon={Package}
                        color="#F59E0B"
                        stats={{ label: "Records", value: "All" }}
                        onExport={handleExportProducts}
                        isLoading={isExporting === 'products'}
                        format={exportFormat}
                    />
                </div>

                {/* Advanced Audit Section */}
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--sa-accent)]/20 to-purple-500/20 rounded-2xl blur opacity-10 group-hover:opacity-30 transition duration-1000" />
                    <div className="relative bg-black/40 border border-white/5 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-start gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-[var(--sa-accent)]/10 flex items-center justify-center border border-[var(--sa-accent)]/20 shrink-0">
                                <ShieldCheck className="w-7 h-7 text-[var(--sa-accent)]" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-black text-white uppercase tracking-tight">Security Audit Logs</h3>
                                <p className="text-xs font-medium text-white/40 max-w-lg leading-relaxed">
                                    High-fidelity interaction logs for compliance and security audits. Includes IP tracking, admin actions, and authentication events.
                                </p>
                                <div className="flex items-center gap-2 pt-2">
                                    <Clock className="w-3 h-3 text-white/20" />
                                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Coming Soon</span>
                                </div>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="h-12 px-8 border-white/10 bg-white/5 text-white/30 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-white/10 transition-all cursor-not-allowed"
                            disabled
                        >
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            Locked
                        </Button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard icon={Calendar} label="Export Period" value="All Time" />
                    <StatCard icon={Table} label="Default Format" value={exportFormat.toUpperCase()} />
                    <StatCard icon={BarChart3} label="Data Sources" value="3 Active" />
                    <StatCard icon={CheckCircle2} label="Last Export" value={lastExport?.time || "Never"} />
                </div>
            </div>
        </AdminLayout>
    )
}

function ExportCard({
    title,
    description,
    icon: Icon,
    color,
    stats,
    onExport,
    isLoading,
    format
}: {
    title: string
    description: string
    icon: any
    color: string
    stats: { label: string; value: string }
    onExport: () => void
    isLoading?: boolean
    format: 'csv' | 'json'
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col group hover:border-white/10 transition-all"
        >
            <div className="flex items-start justify-between mb-6">
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center border transition-all group-hover:scale-110"
                    style={{
                        backgroundColor: `${color}10`,
                        borderColor: `${color}20`
                    }}
                >
                    <Icon className="w-6 h-6" style={{ color }} />
                </div>
                <div className="text-right">
                    <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{stats.label}</p>
                    <p className="text-sm font-black text-white">{stats.value}</p>
                </div>
            </div>

            <h3 className="text-lg font-black text-white tracking-tight mb-2">{title}</h3>
            <p className="text-xs font-medium text-white/40 leading-relaxed mb-6 flex-1">{description}</p>

            <Button
                onClick={onExport}
                disabled={isLoading}
                className="w-full h-11 bg-white/5 border border-white/10 text-white/60 hover:bg-white hover:text-black font-bold text-xs uppercase tracking-widest rounded-xl transition-all group-hover:border-white/20"
            >
                {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <>
                        <Download className="w-4 h-4 mr-2" />
                        Export {format.toUpperCase()}
                    </>
                )}
            </Button>
        </motion.div>
    )
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
    return (
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <Icon className="w-5 h-5 text-white/20" />
            </div>
            <div>
                <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{label}</p>
                <p className="text-sm font-bold text-white">{value}</p>
            </div>
        </div>
    )
}
