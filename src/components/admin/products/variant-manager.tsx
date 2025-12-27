"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Loader2, Trash2, Plus, Edit2, Save, X, Layers, ChevronDown, ChevronUp } from "lucide-react"
import { getVariants, createVariant, updateVariant, deleteVariant } from "@/lib/db/products"
import { cn } from "@/lib/utils"
import { StockManager } from "./stock-manager"

interface Variant {
    id: string
    name: string
    price: number
    slashed_price: number | null
    stock_count: number
    is_active: boolean
    webhook_url: string | null
}

interface VariantManagerProps {
    productId: string
    deliveryType?: string
}

export function VariantManager({ productId, deliveryType }: VariantManagerProps) {
    const [variants, setVariants] = useState<Variant[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [isAdding, setIsAdding] = useState(false)
    const [expandedStockId, setExpandedStockId] = useState<string | null>(null)

    const [newVariant, setNewVariant] = useState({
        name: "",
        price: 0,
        slashed_price: "",
        stock_count: 0,
        webhook_url: ""
    })

    const [editData, setEditData] = useState<Partial<Variant>>({})

    useEffect(() => {
        loadVariants()
    }, [productId])

    async function loadVariants() {
        setIsLoading(true)
        try {
            const data = await getVariants(productId)
            setVariants(data || [])
        } catch (error) {
            toast.error("Failed to load variants")
        } finally {
            setIsLoading(false)
        }
    }

    async function handleAdd() {
        if (!newVariant.name) return
        try {
            await createVariant(productId, {
                ...newVariant,
                price: Number(newVariant.price),
                slashed_price: newVariant.slashed_price ? Number(newVariant.slashed_price) : null,
                stock_count: Number(newVariant.stock_count),
                webhook_url: newVariant.webhook_url || null
            })
            toast.success("Variant added")
            setIsAdding(false)
            setNewVariant({ name: "", price: 0, slashed_price: "", stock_count: 0, webhook_url: "" })
            loadVariants()
        } catch (error) {
            toast.error("Failed to add variant")
        }
    }

    async function handleUpdate(id: string) {
        try {
            await updateVariant(id, {
                ...editData,
                price: editData.price !== undefined ? Number(editData.price) : undefined,
                slashed_price: editData.slashed_price !== undefined ? (editData.slashed_price ? Number(editData.slashed_price) : null) : undefined,
                stock_count: editData.stock_count !== undefined ? Number(editData.stock_count) : undefined
            })
            toast.success("Variant updated")
            setEditingId(null)
            loadVariants()
        } catch (error) {
            toast.error("Failed to update variant")
        }
    }

    async function handleDeleteVariant(id: string) {
        if (!confirm("Are you sure? This will delete the variant and its history.")) return
        try {
            await deleteVariant(id)
            toast.success("Variant deleted")
            loadVariants()
        } catch (error) {
            toast.error("Failed to delete variant")
        }
    }

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-brand-primary" /></div>

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Product Variants</h3>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAdding(true)}
                    className="h-8 text-xs font-bold text-brand-primary hover:bg-brand-primary/10 gap-2"
                >
                    <Plus className="w-3.5 h-3.5" />
                    ADD VARIANT
                </Button>
            </div>

            <div className="space-y-3">
                {isAdding && (
                    <div className="p-4 rounded-xl bg-brand-primary/5 border border-brand-primary/20 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-white/40 uppercase">Name (e.g. Monthly)</label>
                                <Input
                                    value={newVariant.name}
                                    onChange={e => setNewVariant({ ...newVariant, name: e.target.value })}
                                    className="bg-black/20 border-white/10 h-9 text-sm"
                                    placeholder="Variant Name"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-white/40 uppercase">Price</label>
                                    <Input
                                        type="number"
                                        value={newVariant.price}
                                        onChange={e => setNewVariant({ ...newVariant, price: parseFloat(e.target.value) })}
                                        className="bg-black/20 border-white/10 h-9 text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">Stock (optional)</label>
                                    <Input
                                        type="number"
                                        value={newVariant.stock_count}
                                        onChange={e => setNewVariant({ ...newVariant, stock_count: parseInt(e.target.value) })}
                                        className="bg-black/20 border-white/10 h-9 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {deliveryType === 'dynamic' && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-white/40 uppercase">Webhook URL (Optional Override)</label>
                                <Input
                                    value={newVariant.webhook_url}
                                    onChange={e => setNewVariant({ ...newVariant, webhook_url: e.target.value })}
                                    className="bg-black/20 border-white/10 h-9 text-sm"
                                    placeholder="https://your-api.com/callback"
                                />
                                <p className="text-[10px] text-white/20">Overrides the product-level webhook URL if provided.</p>
                            </div>
                        )}

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)} className="h-8 text-xs font-bold text-white/40 hover:text-white">CANCEL</Button>
                            <Button type="button" size="sm" onClick={handleAdd} className="h-8 text-xs font-bold bg-brand-primary text-white">SAVE VARIANT</Button>
                        </div>
                    </div>
                )}

                {variants.length === 0 && !isAdding && (
                    <div className="p-8 text-center bg-white/[0.02] border border-dashed border-white/5 rounded-xl">
                        <p className="text-xs text-white/20">No variants created yet. Add options like "Monthly", "Yearly", or "Lifetime".</p>
                    </div>
                )}

                {variants.map(variant => (
                    <div key={variant.id} className={cn(
                        "rounded-xl border transition-all overflow-hidden",
                        editingId === variant.id ? "bg-white/[0.05] border-white/20" : "bg-white/[0.02] border-white/5 hover:border-white/10"
                    )}>
                        <div className="p-3">
                            {editingId === variant.id ? (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <Input
                                            value={editData.name || variant.name}
                                            onChange={e => setEditData({ ...editData, name: e.target.value })}
                                            className="bg-black/20 border-white/10 h-8 text-xs font-bold text-white"
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input
                                                type="number"
                                                value={editData.price !== undefined ? editData.price : variant.price}
                                                onChange={e => setEditData({ ...editData, price: parseFloat(e.target.value) })}
                                                className="bg-black/20 border-white/10 h-8 text-xs text-brand-primary"
                                            />
                                            <Input
                                                type="number"
                                                value={editData.stock_count !== undefined ? editData.stock_count : variant.stock_count}
                                                onChange={e => setEditData({ ...editData, stock_count: parseInt(e.target.value) })}
                                                className="bg-black/20 border-white/10 h-8 text-xs text-white/60"
                                            />
                                        </div>
                                    </div>
                                    {deliveryType === 'dynamic' && (
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-white/40 uppercase">Webhook URL Override</label>
                                            <Input
                                                value={editData.webhook_url !== undefined ? editData.webhook_url : (variant.webhook_url || "")}
                                                onChange={e => setEditData({ ...editData, webhook_url: e.target.value })}
                                                className="bg-black/20 border-white/10 h-8 text-xs text-white"
                                                placeholder="https://..."
                                            />
                                        </div>
                                    )}
                                    <div className="flex justify-end gap-2">
                                        <Button type="button" variant="ghost" size="icon" onClick={() => setEditingId(null)} className="h-7 w-7 text-white/40 hover:text-white"><X className="w-3.5 h-3.5" /></Button>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => handleUpdate(variant.id)} className="h-7 w-7 text-brand-primary hover:bg-brand-primary/10"><Save className="w-3.5 h-3.5" /></Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="space-y-0.5">
                                            <div className="text-sm font-bold text-white">{variant.name}</div>
                                            <div className="text-[10px] text-white/20 uppercase font-bold tracking-widest">{variant.stock_count} in stock</div>
                                        </div>
                                        <div className="px-2 py-0.5 rounded bg-brand-primary/10 border border-brand-primary/20 text-[10px] font-bold text-brand-primary">
                                            ${variant.price}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 transition-opacity">
                                        {(deliveryType === 'serials' || deliveryType === 'dynamic') && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setExpandedStockId(expandedStockId === variant.id ? null : variant.id)}
                                                className={cn(
                                                    "h-8 w-8 transition-colors",
                                                    expandedStockId === variant.id ? "text-brand-primary bg-brand-primary/5" : "text-white/20 hover:text-white"
                                                )}
                                            >
                                                <Layers className="w-3.5 h-3.5" />
                                            </Button>
                                        )}
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                setEditingId(variant.id)
                                                setEditData(variant)
                                            }}
                                            className="h-8 w-8 text-white/20 hover:text-white"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteVariant(variant.id)}
                                            className="h-8 w-8 text-white/20 hover:text-red-500 hover:bg-red-500/5"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {expandedStockId === variant.id && deliveryType === 'serials' && (
                            <div className="border-t border-white/5 p-4 bg-black/20">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                                        <Layers className="w-3 h-3" />
                                        Manage Stock for {variant.name}
                                    </h4>
                                    <Button variant="ghost" size="icon" onClick={() => setExpandedStockId(null)} className="h-5 w-5 text-white/20 hover:text-white">
                                        <X className="w-3 h-3" />
                                    </Button>
                                </div>
                                <StockManager productId={productId} variantId={variant.id} />
                            </div>
                        )}

                        {expandedStockId === variant.id && deliveryType === 'dynamic' && (
                            <div className="border-t border-white/5 p-4 bg-black/20">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                                        <Layers className="w-3 h-3" />
                                        Dynamic Delivery Details for {variant.name}
                                    </h4>
                                    <Button variant="ghost" size="icon" onClick={() => setExpandedStockId(null)} className="h-5 w-5 text-white/20 hover:text-white">
                                        <X className="w-3 h-3" />
                                    </Button>
                                </div>
                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                    <p className="text-xs text-white/60 mb-2">This variant uses dynamic delivery via webhook.</p>
                                    <div className="p-3 bg-black/40 rounded border border-white/5 flex items-center justify-between">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] uppercase font-bold text-white/20">Webhook URL</span>
                                            <span className="text-xs font-mono text-brand-primary break-all">{variant.webhook_url || "Using product default"}</span>
                                        </div>
                                    </div>
                                    {!variant.webhook_url && (
                                        <p className="text-[10px] text-white/20 mt-2 italic">Note: If no webhook is set here, the global product webhook will be used.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <p className="text-[10px] text-white/20 mt-2">
                If variants are added, the customer will be prompted to choose an option before checkout.
            </p>
        </div>
    )
}
