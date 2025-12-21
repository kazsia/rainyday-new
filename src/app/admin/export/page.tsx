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
            <div className="max-w-6xl mx-auto space-y-12 pb-20">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-white italic tracking-tight uppercase">Data Forge</h1>
                        <p className="text-white/40 text-sm">Extract and export platform data into portable formats.</p>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-2 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <Database className="w-4 h-4 text-brand/40" />
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest italic">Database Snapshot Ready</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <ExportCard
                        title="Platform Orders"
                        description="Comprehensive list of all transactions, including status and totals."
                        icon={ShoppingCart}
                        onExport={handleExportOrders}
                        isLoading={isExporting === 'orders'}
                    />
                    <ExportCard
                        title="Customer Base"
                        description="Complete user directory with profile metadata and registration dates."
                        icon={Users}
                        onExport={handleExportCustomers}
                        isLoading={isExporting === 'customers'}
                    />
                    <ExportCard
                        title="Inventory Sync"
                        description="Full stock list with pricing, categories, and availability status."
                        icon={Package}
                        onExport={() => toast.info("Inventory export sync coming in next cluster")}
                    />
                </div>

                {/* Security Audit Log Export - Advanced Section */}
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-brand/20 to-purple-500/20 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                    <div className="relative bg-[#0b1016] border border-white/5 p-10 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex items-start gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center border border-brand/20 shrink-0">
                                <ShieldCheck className="w-8 h-8 text-brand" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Advanced Audit Logs</h3>
                                <p className="text-white/40 text-sm max-w-xl">Download high-fidelity interaction logs for security audits. Includes IP tracking, admin actions, and system events.</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="h-14 px-10 border-brand/20 text-brand font-black uppercase tracking-[0.2em] italic rounded-2xl hover:bg-brand hover:text-black transition-all group/btn"
                            disabled
                        >
                            <FileSpreadsheet className="w-5 h-5 mr-3 group-hover/btn:scale-110 transition-transform" />
                            Export Audit
                        </Button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}

function ExportCard({ title, description, icon: Icon, onExport, isLoading }: { title: string, description: string, icon: any, onExport: () => void, isLoading?: boolean }) {
    return (
        <div className="bg-[#0b1016] border border-white/5 rounded-3xl p-8 flex flex-col items-center text-center group hover:border-brand/20 transition-all hover:bg-white/[0.01]">
            <div className="w-20 h-20 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Icon className="w-10 h-10 text-white/20 group-hover:text-brand transition-colors" />
            </div>
            <h3 className="text-xl font-black text-white italic uppercase tracking-tight mb-2">{title}</h3>
            <p className="text-white/40 text-sm leading-relaxed mb-8">{description}</p>
            <Button
                onClick={onExport}
                disabled={isLoading}
                className="w-full h-12 bg-white/5 border border-white/5 text-white/60 hover:text-white hover:bg-brand/10 hover:border-brand/40 font-black uppercase tracking-widest italic rounded-xl transition-all"
            >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Export CSV
            </Button>
        </div>
    )
}
