"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2, Trash2, Plus, Copy, RefreshCcw } from "lucide-react"
import { addStock, getStock, deleteStock, StockItem } from "@/lib/db/stock"

interface StockManagerProps {
    productId: string
    variantId?: string
}

export function StockManager({ productId, variantId }: StockManagerProps) {
    const [stockItems, setStockItems] = useState<StockItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isAdding, setIsAdding] = useState(false)
    const [bulkContent, setBulkContent] = useState("")
    const [totalCount, setTotalCount] = useState(0)

    useEffect(() => {
        loadStock()
    }, [productId, variantId])

    async function loadStock() {
        setIsLoading(true)
        try {
            const { data, count } = await getStock(productId, 1, 50, variantId)
            setStockItems(data || [])
            setTotalCount(count || 0)
        } catch (error) {
            toast.error("Failed to load stock")
        } finally {
            setIsLoading(false)
        }
    }

    async function handleAddStock() {
        if (!bulkContent.trim()) return

        setIsAdding(true)
        try {
            // Split by newline and filter empty
            const items = bulkContent.split('\n').map(s => s.trim()).filter(s => s.length > 0)

            if (items.length === 0) return
            setIsAdding(true)

            await addStock(productId, items, 'text', variantId)
            toast.success(`Added ${items.length} items to stock`)
            setBulkContent("")
            loadStock()
        } catch (error) {
            toast.error("Failed to add stock")
        } finally {
            setIsAdding(false)
        }
    }

    async function handleDelete(ids: string[]) {
        if (!confirm(`Delete ${ids.length} items?`)) return

        try {
            await deleteStock(ids, productId, variantId)
            toast.success("Stock items deleted")
            loadStock()
        } catch (error) {
            toast.error("Failed to delete stock")
        }
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Add Stock Section */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Add Stock</h3>
                    <div className="bg-[#0a1628]/40 border border-white/10 rounded-xl overflow-hidden p-4 space-y-4">
                        <p className="text-xs text-white/40">Paste your serials, keys, or download links below (one per line).</p>
                        <Textarea
                            value={bulkContent}
                            onChange={(e) => setBulkContent(e.target.value)}
                            placeholder={`KEY-1234-5678\nKEY-8765-4321\n...`}
                            className="min-h-[200px] font-mono text-xs bg-[#0a1628]/40 border-white/10"
                        />
                        <Button
                            onClick={handleAddStock}
                            disabled={isAdding || !bulkContent.trim()}
                            className="w-full bg-brand-primary text-white font-bold"
                        >
                            {isAdding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                            Add Stock
                        </Button>
                    </div>
                </div>

                {/* Manage Stock Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">Current Stock ({totalCount})</h3>
                        <Button variant="ghost" size="icon" onClick={loadStock} className="h-6 w-6 text-white/40 hover:text-white">
                            <RefreshCcw className="w-3 h-3" />
                        </Button>
                    </div>

                    <div className="bg-[#0a1628]/40 border border-white/10 rounded-xl overflow-hidden flex flex-col h-[300px]">
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full text-white/20">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                </div>
                            ) : stockItems.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-white/20 text-xs text-center px-6">
                                    No stock available. Add items to sell.
                                </div>
                            ) : (
                                stockItems.map((item) => (
                                    <div key={item.id} className="group flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-transparent hover:border-white/5">
                                        <code className="text-[10px] text-white/60 font-mono truncate max-w-[200px]">{item.content}</code>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-white/20 hover:text-white"
                                                onClick={() => navigator.clipboard.writeText(item.content)}
                                            >
                                                <Copy className="w-3 h-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-white/20 hover:text-red-500"
                                                onClick={() => handleDelete([item.id])}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    {stockItems.length > 0 && (
                        <Button
                            onClick={() => handleDelete(stockItems.map(i => i.id))}
                            variant="outline"
                            className="w-full text-red-500/60 border-white/5 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20"
                        >
                            Clear View (Delete Listed)
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
