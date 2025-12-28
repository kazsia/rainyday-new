"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2, X, Save, Trash2, Copy, RefreshCcw } from "lucide-react"
import { addStock, getStock, deleteStock, replaceStock, StockItem } from "@/lib/db/stock"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface StockDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    productId: string
    variantId?: string
    variantName?: string
    onStockChange?: (newCount: number) => void
}

export function StockDialog({
    open,
    onOpenChange,
    productId,
    variantId,
    variantName,
    onStockChange
}: StockDialogProps) {
    const [activeTab, setActiveTab] = useState<"add" | "update">("add")
    const [stockItems, setStockItems] = useState<StockItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isAdding, setIsAdding] = useState(false)
    const [bulkContent, setBulkContent] = useState("")
    const [totalCount, setTotalCount] = useState(0)

    useEffect(() => {
        if (open) {
            loadStock()
        }
    }, [open, productId, variantId])

    // Reset bulk content when switching tabs to avoid confusion
    useEffect(() => {
        if (activeTab === "add") {
            setBulkContent("")
        } else {
            // When switching to update, pre-fill with current stock
            // We need to fetch ALL stock for editing, so we might need a different fetch strategy or just fetch a large amount
            // For now, let's use the stockItems we have, but ideally we should fetch all
            loadStockForEditing()
        }
    }, [activeTab])

    async function loadStock() {
        setIsLoading(true)
        try {
            const { data, count } = await getStock(productId, 1, 50, variantId)
            setStockItems(data || [])
            setTotalCount(count || 0)
            onStockChange?.(count || 0)
        } catch (error) {
            toast.error("Failed to load stock")
        } finally {
            setIsLoading(false)
        }
    }

    async function loadStockForEditing() {
        setIsLoading(true)
        try {
            // Fetch up to 1000 items for editing context
            // In a real app with huge stock, we might need a different approach or specialized endpoint
            const { data } = await getStock(productId, 1, 1000, variantId)
            if (data) {
                const content = data.map(item => item.content).join('\n')
                setBulkContent(content)
            }
        } catch (error) {
            toast.error("Failed to load stock for editing")
        } finally {
            setIsLoading(false)
        }
    }

    async function handleAddStock() {
        if (!bulkContent.trim()) return

        setIsAdding(true)
        try {
            const items = bulkContent.split('\n').map(s => s.trim()).filter(s => s.length > 0)
            if (items.length === 0) return

            await addStock(productId, items, 'text', variantId)
            toast.success(`Added ${items.length} items to stock`)
            setBulkContent("")
            // Switch back to Add or close? Let's just reload
            loadStock()
            setActiveTab("add") // Reset to add or keep? User probably wants to add more or close.
            onOpenChange(false)
        } catch (error) {
            toast.error("Failed to add stock")
        } finally {
            setIsAdding(false)
        }
    }

    async function handleReplaceStock() {
        // Even if empty, we might want to allow clearing stock
        setIsAdding(true)
        try {
            const items = bulkContent.split('\n').map(s => s.trim()).filter(s => s.length > 0)

            await replaceStock(productId, items, 'text', variantId)
            toast.success("Stock updated successfully")
            onStockChange?.(items.length)
            onOpenChange(false)
        } catch (error) {
            toast.error("Failed to update stock")
        } finally {
            setIsAdding(false)
        }
    }

    function handleCancel() {
        setBulkContent("")
        onOpenChange(false)
    }

    function handleSave() {
        if (activeTab === "add") {
            handleAddStock()
        } else {
            handleReplaceStock()
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-[550px] bg-[#0a0c10] border-white/5 p-0 gap-0 shadow-2xl overflow-hidden"
                showCloseButton={false}
            >
                {/* Header */}
                <DialogHeader className="p-6 pb-4">
                    <DialogTitle className="text-lg font-bold text-white tracking-tight">
                        Set Stock For {variantName || "Product"}
                    </DialogTitle>
                </DialogHeader>

                {/* Tab Switcher */}
                <div className="px-6">
                    <div className="flex p-1 bg-[#0f111a] border border-white/5 rounded-xl">
                        <button
                            onClick={() => setActiveTab("add")}
                            className={cn(
                                "flex-1 py-2 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all",
                                activeTab === "add"
                                    ? "bg-[#a4f8ff] text-black shadow-lg shadow-[#a4f8ff]/20"
                                    : "bg-transparent text-white/30 hover:text-white/50"
                            )}
                        >
                            Add
                        </button>
                        <button
                            onClick={() => setActiveTab("update")}
                            className={cn(
                                "flex-1 py-2 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all",
                                activeTab === "update"
                                    ? "bg-[#a4f8ff] text-black shadow-lg shadow-[#a4f8ff]/20"
                                    : "bg-transparent text-white/30 hover:text-white/50"
                            )}
                        >
                            Update
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {activeTab === "add" ? (
                        <>
                            <div className="space-y-1">
                                <h4 className="text-[12px] font-black text-white uppercase tracking-wider">Deliverables</h4>
                                <p className="text-[10px] text-white/40 font-bold">
                                    Enter one deliverable per line. Upon purchase, the latest line is delivered to the customer.
                                </p>
                            </div>
                            <div className="relative">
                                <Textarea
                                    value={bulkContent}
                                    onChange={(e) => setBulkContent(e.target.value)}
                                    placeholder="Enter deliverables here..."
                                    className="min-h-[200px] font-medium text-sm bg-[#0a0c14] border-white/10 text-white placeholder:text-white/10 resize-none rounded-xl focus-visible:ring-[#a4f8ff]/50 focus-visible:border-[#a4f8ff]/50 transition-all p-4"
                                />
                                <div className="absolute bottom-4 right-4 bg-[#a4f8ff] w-5 h-5 rounded-full flex items-center justify-center shadow-lg shadow-[#a4f8ff]/20">
                                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M1 4L3.5 6.5L9 1" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="space-y-1">
                                <h4 className="text-[12px] font-black text-white uppercase tracking-wider">Update Deliverables</h4>
                                <p className="text-[10px] text-white/40 font-bold">
                                    Edit the deliverables below. Each line represents one item. Saving will replace the current stock.
                                </p>
                            </div>
                            <div className="relative">
                                {isLoading ? (
                                    <div className="min-h-[200px] flex items-center justify-center border border-white/5 rounded-xl bg-[#0a0c14]">
                                        <Loader2 className="w-6 h-6 animate-spin text-white/20" />
                                    </div>
                                ) : (
                                    <Textarea
                                        value={bulkContent}
                                        onChange={(e) => setBulkContent(e.target.value)}
                                        placeholder="No stock items currently..."
                                        className="min-h-[200px] font-medium text-sm bg-[#0a0c14] border-white/10 text-white placeholder:text-white/10 resize-none rounded-xl focus-visible:ring-[#a4f8ff]/50 focus-visible:border-[#a4f8ff]/50 transition-all p-4"
                                    />
                                )}
                                <div className="absolute bottom-4 right-4 bg-orange-500 w-5 h-5 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/20 group cursor-help">
                                    <span className="text-[10px] font-bold text-white">!</span>
                                    <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-black border border-white/10 rounded-lg text-[10px] text-white/60 hidden group-hover:block z-10">
                                        This will replace all unused stock items with the content of this box.
                                    </div>
                                </div>
                            </div>
                        </>
                    )
                    }
                </div >

                {/* Footer */}
                < div className="flex items-center justify-end gap-3 p-6 pt-0" >
                    <Button
                        onClick={handleCancel}
                        variant="ghost"
                        className="h-11 px-6 text-[11px] font-black uppercase tracking-widest bg-[#0f111a] border border-white/5 text-white/40 hover:text-white hover:bg-white/5 rounded-xl gap-2 transition-all"
                    >
                        <X className="w-4 h-4" />
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={activeTab === "add" && isAdding}
                        className="h-11 px-8 text-[11px] font-black uppercase tracking-widest bg-[#a4f8ff] hover:opacity-90 text-black shadow-lg shadow-[#a4f8ff]/20 rounded-xl gap-2 transition-all border-none"
                    >
                        {isAdding ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        Save
                    </Button>
                </div >
            </DialogContent >
        </Dialog >
    )
}
