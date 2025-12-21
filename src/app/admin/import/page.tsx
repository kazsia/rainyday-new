"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import {
    Upload,
    FileJson,
    Database,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    Info,
    History,
    RefreshCw,
    ArrowDownToLine
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function AdminImportPage() {
    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Import Data</h1>
                        <p className="text-sm text-white/40">Bulk import products, orders, or customers</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Import Area */}
                    <div className="space-y-6">
                        <div className="bg-white/5 border-2 border-dashed border-white/10 rounded-3xl p-12 flex flex-col items-center justify-center text-center space-y-4 hover:border-brand/40 hover:bg-white/[0.02] transition-all cursor-pointer group">
                            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Upload className="w-8 h-8 text-brand" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-white">Click or drag to upload</h3>
                                <p className="text-sm text-white/40">Support JSON, CSV, or XML files</p>
                            </div>
                            <Button className="bg-brand text-black font-bold h-10 px-8 rounded-xl shadow-lg shadow-brand/20">
                                Select File
                            </Button>
                        </div>

                        <div className="bg-white/5 border border-white/5 rounded-3xl p-8 space-y-6">
                            <div className="flex items-center gap-3">
                                <Info className="w-5 h-5 text-brand" />
                                <h2 className="text-sm font-bold text-white uppercase tracking-widest">Instructions</h2>
                            </div>
                            <div className="space-y-4 text-sm text-white/40">
                                <div className="flex gap-3">
                                    <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center text-[10px] font-bold text-white shrink-0">1</div>
                                    <p>Download the <button className="text-brand hover:underline">sample template</button> for your data type.</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center text-[10px] font-bold text-white shrink-0">2</div>
                                    <p>Format your file correctly to avoid validation errors.</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center text-[10px] font-bold text-white shrink-0">3</div>
                                    <p>Upload and preview the data before finalizing the import.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* History */}
                    <div className="bg-white/5 border border-white/5 rounded-3xl p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <History className="w-5 h-5 text-brand" />
                                <h2 className="text-sm font-bold text-white uppercase tracking-widest">Recent Imports</h2>
                            </div>
                            <button className="text-white/20 hover:text-white transition-colors">
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {[
                                { name: "products_v2.json", date: "2h ago", status: "completed", count: "142 items" },
                                { name: "customer_migration.csv", date: "昨天", status: "completed", count: "1,204 items" },
                                { name: "legacy_orders.xml", date: "3 days ago", status: "failed", count: "0 items" },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-[#0a1628]/40 rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center">
                                            <FileJson className="w-5 h-5 text-white/20" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{item.name}</p>
                                            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{item.date} • {item.count}</p>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "w-2 h-2 rounded-full",
                                        item.status === "completed" ? "bg-green-500" : "bg-red-500"
                                    )} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}
