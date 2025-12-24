"use client"

import { AdminLayout } from "@/components/admin/admin-layout"
import { Download, Users, ShoppingCart, Package, ShieldCheck, Database, FileSpreadsheet, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { adminGetOrders } from "@/lib/db/orders"
import { getCustomers } from "@/lib/actions/admin-customers"
import { toast } from "sonner"

export default function AdminExportPage() {
    const [isExporting, setIsExporting] = useState<string | null>(null)

    const exportToCSV = (data: any[], filename: string, headers: string[]) => {
        const csvContent = [
            headers.join(","),
            ...data.map(row => headers.map(h => {
                const val = row[h.toLowerCase().replace(/ /g, '_')]
                return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
            }).join(","))
        ].join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`)
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
                email: o.email,
                status: o.status,
                total: o.total,
                created_at: o.created_at
            }))
            exportToCSV(formatted, "orders_export", ["ID", "Email", "Status", "Total", "Created At"])
            toast.success("Orders exported successfully")
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
                created_at: c.created_at
            }))
            exportToCSV(formatted, "customers_export", ["ID", "Email", "Full Name", "Created At"])
            toast.success("Customers exported successfully")
        } catch (error) {
            toast.error("Export failed")
        } finally {
            setIsExporting(null)
        }
    }

    return (
        <AdminLayout>
            <div className="max-w-5xl mx-auto space-y-6 pb-20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight">Data Forge</h1>
                        <p className="text-[11px] font-medium text-[var(--sa-fg-dim)] mt-0.5">Extract and export platform data into portable formats</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded bg-black/20 border border-white/5">
                        <Database className="w-3 h-3 text-[var(--sa-accent)]/40" />
                        <span className="text-[9px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest">Snapshot Ready</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <ExportCard
                        title="Platform Orders"
                        description="Transaction history, status and financial totals."
                        icon={ShoppingCart}
                        onExport={handleExportOrders}
                        isLoading={isExporting === 'orders'}
                    />
                    <ExportCard
                        title="Customer Base"
                        description="User directory with identity and metadata."
                        icon={Users}
                        onExport={handleExportCustomers}
                        isLoading={isExporting === 'customers'}
                    />
                    <ExportCard
                        title="Inventory Sync"
                        description="Stock list with pricing and availability."
                        icon={Package}
                        onExport={() => toast.info("Inventory export sync coming in next cluster")}
                    />
                </div>

                {/* Security Audit Log Export - Advanced Section */}
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--sa-accent)]/20 to-purple-500/20 rounded-xl blur opacity-10 group-hover:opacity-30 transition duration-1000"></div>
                    <div className="relative sa-card-premium p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-lg bg-[var(--sa-accent)]/5 flex items-center justify-center border border-[var(--sa-accent)]/10 shrink-0">
                                <ShieldCheck className="w-6 h-6 text-[var(--sa-accent)]" />
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="text-sm font-black text-white uppercase tracking-tight">Advanced Audit Logs</h3>
                                <p className="text-[11px] font-medium text-[var(--sa-fg-dim)] max-w-lg leading-relaxed">Download high-fidelity interaction logs for security audits, including IP tracking and admin events.</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="h-10 px-6 border-white/5 bg-white/5 text-white/40 font-black uppercase tracking-widest text-[10px] rounded-lg hover:bg-white/10 transition-all cursor-not-allowed"
                            disabled
                        >
                            <FileSpreadsheet className="w-3.5 h-3.5 mr-2" />
                            Lock Active
                        </Button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}

function ExportCard({ title, description, icon: Icon, onExport, isLoading }: { title: string, description: string, icon: any, onExport: () => void, isLoading?: boolean }) {
    return (
        <div className="bg-[var(--sa-card)] border border-[var(--sa-border)] rounded-xl p-6 flex flex-col items-center text-center group hover:bg-white/[0.01] transition-all shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-center mb-4 group-hover:scale-105 group-hover:bg-[var(--sa-accent-muted)] transition-all">
                <Icon className="w-6 h-6 text-[var(--sa-fg-dim)] group-hover:text-[var(--sa-accent)] transition-colors" />
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-tight mb-1.5">{title}</h3>
            <p className="text-[11px] font-medium text-[var(--sa-fg-dim)] leading-relaxed mb-6">{description}</p>
            <Button
                onClick={onExport}
                disabled={isLoading}
                className="w-full h-8 bg-black/20 border border-white/5 text-[10px] text-white/60 hover:text-white hover:bg-[var(--sa-accent)] hover:text-black font-black uppercase tracking-widest rounded-lg transition-all"
            >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 mr-1.5" />}
                Export CSV
            </Button>
        </div>
    )
}
