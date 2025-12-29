"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/sonner"
import { Loader2, Trash2, Plus, Edit2, Save, X, Layers, ChevronDown, ChevronUp, GripVertical, Box, Zap, Share2, Activity } from "lucide-react"
import { getVariants, createVariant, updateVariant, deleteVariant, reorderVariants, updateProduct } from "@/lib/db/products"
import { cn } from "@/lib/utils"
import { StockDialog } from "./stock-dialog"
import { Reorder, useDragControls } from "framer-motion"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { GripHorizontal, RotateCcw, Shuffle, ArrowRightLeft, Ban } from "lucide-react"

interface Variant {
    id: string
    name: string
    description: string | null
    price: number
    slashed_price: number | null
    stock_count: number
    min_quantity: number
    max_quantity: number
    is_active: boolean
    webhook_url: string | null
    instructions: string | null
    volume_discounts: { quantity: number; percentage: number }[]
    disable_volume_discounts_on_coupon: boolean
    deliverable_selection_method: 'last' | 'first' | 'random'
    disabled_payment_methods: string[]
    delivery_type: 'serials' | 'service' | 'dynamic'
    is_unlimited: boolean
}

interface VariantManagerProps {
    productId: string
    deliveryType?: string
    onStockDeliveryDisabled?: () => void
    stockDeliveryEnabled?: boolean
    variantsEnabled?: boolean
    onVariantsEnabledChange?: (enabled: boolean) => void
}

interface VariantItemProps {
    variant: Variant
    isExpanded: boolean
    setExpandedId: (id: string | null) => void
    editData: Partial<Variant>
    setEditData: (data: Partial<Variant>) => void
    editingId: string | null
    setEditingId: (id: string | null) => void
    handleUpdate: (id: string) => void
    handleDeleteVariant: (id: string) => void
    setStockDialogVariant: (variant: Variant) => void
}

function VariantItem({
    variant,
    isExpanded,
    setExpandedId,
    editData,
    setEditData,
    editingId,
    setEditingId,
    handleUpdate,
    handleDeleteVariant,
    setStockDialogVariant
}: VariantItemProps) {
    const controls = useDragControls()

    return (
        <Reorder.Item
            value={variant}
            dragListener={false}
            dragControls={controls}
            className={cn(
                "bg-[#101320] border rounded-2xl overflow-hidden transition-all duration-200",
                isExpanded ? "border-[#a4f8ff]/30 shadow-2xl shadow-[#a4f8ff]/5 z-10" : "border-white/5 hover:border-white/10"
            )}
        >
            <div
                className={cn(
                    "px-5 py-4 flex items-center justify-between cursor-pointer group transition-colors",
                    isExpanded ? "bg-[#a4f8ff]/5" : "hover:bg-white/[0.02]"
                )}
                onClick={() => setExpandedId(isExpanded ? null : variant.id)}
            >
                <div className="flex items-center gap-4">
                    <div
                        className="p-1.5 text-white/10 hover:text-white/40 transition-colors cursor-grab active:cursor-grabbing"
                        onPointerDown={(e) => controls.start(e)}
                    >
                        <GripVertical className="w-4 h-4" />
                    </div>
                    <span className={cn(
                        "text-[12px] font-black uppercase tracking-wider transition-colors",
                        isExpanded ? "text-[#a4f8ff]" : "text-white/60 group-hover:text-white"
                    )}>
                        {variant.name}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-white/20" /> : <ChevronDown className="w-4 h-4 text-white/20" />}
                </div>
            </div>

            {isExpanded && (
                <div className="p-8 space-y-8 border-t border-white/5">
                    <div className="space-y-3">
                        <label className="text-[14px] font-medium text-white mb-2 ml-1 block">Name</label>
                        <Input
                            value={editData.name !== undefined ? editData.name : variant.name}
                            onChange={e => {
                                setEditingId(variant.id)
                                setEditData({ ...editData, name: e.target.value })
                            }}
                            className="bg-[#0b0d16] border-[#1e202e] h-12 text-sm font-medium rounded-lg px-3 focus-visible:border-[#a4f8ff] focus-visible:ring-0 transition-all placeholder:text-white/20"
                            placeholder="Variant Name"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[14px] font-medium text-white mb-2 ml-1 block">Description <span className="text-[12px] text-white/40 font-normal ml-1">(optional)</span></label>
                        <Input
                            value={editData.description !== undefined ? editData.description || "" : variant.description || ""}
                            onChange={e => {
                                setEditingId(variant.id)
                                setEditData({ ...editData, description: e.target.value })
                            }}
                            className="bg-[#0b0d16] border-[#1e202e] h-12 text-sm font-medium rounded-lg px-3 focus-visible:border-[#a4f8ff] focus-visible:ring-0 transition-all placeholder:text-white/20"
                            placeholder="Variant Description"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[14px] font-medium text-white mb-2 ml-1 block">Price</label>
                            <Input
                                type="number"
                                value={editData.price !== undefined ? editData.price : variant.price}
                                onChange={e => {
                                    setEditingId(variant.id)
                                    setEditData({ ...editData, price: parseFloat(e.target.value) })
                                }}
                                className="bg-[#0b0d16] border-[#1e202e] h-12 text-sm font-medium rounded-lg px-4 focus-visible:border-[#a4f8ff] focus-visible:ring-0 transition-all placeholder:text-white/20"
                                placeholder="Variant Price"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[14px] font-medium text-white mb-2 ml-1 block">Slashed Price <span className="text-[12px] text-white/40 font-normal ml-1">(optional)</span></label>
                            <Input
                                type="number"
                                value={editData.slashed_price !== undefined ? editData.slashed_price || "" : variant.slashed_price || ""}
                                onChange={e => {
                                    setEditingId(variant.id)
                                    setEditData({ ...editData, slashed_price: e.target.value === "" ? null : parseFloat(e.target.value) })
                                }}
                                className="bg-[#0b0d16] border-[#1e202e] h-12 text-sm font-medium rounded-lg px-3 focus-visible:border-[#a4f8ff] focus-visible:ring-0 transition-all placeholder:text-white/20"
                                placeholder="1.00"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                        <div className="space-y-1">
                            <label className="text-[14px] font-medium text-white ml-1 block">Stock Status</label>
                            <p className="text-[12px] text-white/40 font-normal ml-1">
                                {(editData.delivery_type || variant.delivery_type) === 'serials'
                                    ? "Stock is managed via deliverables for serials."
                                    : "Choose if this variant has unlimited stock or a fixed number."}
                            </p>
                        </div>
                        {(editData.delivery_type || variant.delivery_type) !== 'serials' && (
                            <div className="flex items-center gap-3 bg-[#0b0d16] border border-[#1e202e] rounded-xl px-4 py-2 hover:border-white/10 transition-all">
                                <span className="text-[12px] font-bold text-white/60">Unlimited Stock</span>
                                <Switch
                                    checked={editData.is_unlimited !== undefined ? editData.is_unlimited : variant.is_unlimited}
                                    onCheckedChange={(checked) => {
                                        setEditingId(variant.id)
                                        setEditData({ ...editData, is_unlimited: checked })
                                    }}
                                    className="data-[state=checked]:bg-[#a4f8ff] data-[state=unchecked]:bg-white/10"
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        {(editData.delivery_type || variant.delivery_type || 'serials') === 'serials' ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setStockDialogVariant(variant)}
                                className="h-12 px-6 border-[#a4f8ff] bg-transparent hover:bg-[#a4f8ff]/10 text-[#a4f8ff] hover:text-[#8aefff] font-medium text-[13px] gap-3 rounded-lg transition-all"
                            >
                                <Box className="w-4 h-4" />
                                Manage Stock Assets <span className="opacity-60 text-[12px]">({variant.stock_count} items)</span>
                            </Button>
                        ) : (
                            (editData.is_unlimited !== undefined ? editData.is_unlimited : variant.is_unlimited) ? (
                                <div className="h-12 px-6 border border-[#a4f8ff]/20 bg-[#a4f8ff]/5 text-[#a4f8ff] font-medium text-[13px] gap-3 rounded-lg flex items-center shadow-lg shadow-[#a4f8ff]/5 transition-all">
                                    <Zap className="w-4 h-4 animate-pulse" />
                                    Unlimited Stock Enabled
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2 w-full md:w-auto">
                                    <div className="relative group">
                                        <Box className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-hover:text-[#a4f8ff] transition-colors" />
                                        <Input
                                            type="number"
                                            value={editData.stock_count !== undefined ? editData.stock_count : variant.stock_count}
                                            onChange={e => {
                                                setEditingId(variant.id)
                                                setEditData({ ...editData, stock_count: parseInt(e.target.value) })
                                            }}
                                            className="bg-[#0b0d16] border-[#1e202e] h-12 w-full md:w-[180px] text-sm font-medium rounded-lg pl-12 focus-visible:border-[#a4f8ff] focus-visible:ring-0 transition-all"
                                            placeholder="0"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/20 uppercase tracking-widest">Qty</div>
                                    </div>
                                </div>
                            )
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[14px] font-medium text-white mb-2 ml-1 block">Min Quantity <span className="text-[12px] text-white/40 font-normal ml-1">(optional)</span></label>
                            <Input
                                type="number"
                                value={editData.min_quantity !== undefined ? editData.min_quantity : variant.min_quantity}
                                onChange={e => {
                                    setEditingId(variant.id)
                                    setEditData({ ...editData, min_quantity: e.target.value === "" ? 1 : parseInt(e.target.value) })
                                }}
                                className="bg-[#0b0d16] border-[#1e202e] h-12 text-sm font-medium rounded-lg px-3 focus-visible:border-[#a4f8ff] focus-visible:ring-0 transition-all placeholder:text-white/20"
                                placeholder="1"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[14px] font-medium text-white mb-2 ml-1 block">Max Quantity <span className="text-[12px] text-white/40 font-normal ml-1">(optional)</span></label>
                            <Input
                                type="number"
                                value={editData.max_quantity !== undefined ? editData.max_quantity : variant.max_quantity}
                                onChange={e => {
                                    setEditingId(variant.id)
                                    setEditData({ ...editData, max_quantity: e.target.value === "" ? 10 : parseInt(e.target.value) })
                                }}
                                className="bg-[#0b0d16] border-[#1e202e] h-12 text-sm font-medium rounded-lg px-3 focus-visible:border-[#a4f8ff] focus-visible:ring-0 transition-all placeholder:text-white/20"
                                placeholder="10"
                            />
                        </div>
                    </div>



                    <div className="space-y-4 pt-4 border-t border-white/5">
                        <label className="text-[14px] font-medium text-white mb-2 ml-1 block">Deliverables Type</label>
                        <p className="text-[12px] text-white/40 font-normal ml-1 mb-3">Determines how the product is delivered to the customer.</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { id: "serials", title: "Serials", desc: "Delivers serial keys.", icon: Layers },
                                { id: "service", title: "Service", desc: "Delivers instructions.", icon: Share2 },
                                { id: "dynamic", title: "Dynamic", desc: "Delivers from webhook.", icon: Activity }
                            ].map((type) => (
                                <div
                                    key={type.id}
                                    onClick={() => {
                                        setEditingId(variant.id)
                                        setEditData({ ...editData, delivery_type: type.id as any })
                                    }}
                                    className={cn(
                                        "p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-3 group relative",
                                        (editData.delivery_type || variant.delivery_type || 'serials') === type.id
                                            ? "bg-[#a4f8ff]/10 border-[#a4f8ff]/50 shadow-lg shadow-[#a4f8ff]/5"
                                            : "bg-[#0b0d16] border-[#1e202e] hover:border-white/10 active:scale-[0.98]"
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                            (editData.delivery_type || variant.delivery_type || 'serials') === type.id ? "bg-[#a4f8ff]/20 text-[#a4f8ff]" : "bg-white/5 text-white/40 group-hover:bg-white/10"
                                        )}>
                                            <type.icon className="w-4 h-4" />
                                        </div>
                                        {(editData.delivery_type || variant.delivery_type || 'serials') === type.id && (
                                            <div className="w-2.5 h-2.5 rounded-full bg-[#a4f8ff] shadow-[0_0_8px_#a4f8ff]" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className={cn("text-[13px] font-bold mb-1", (editData.delivery_type || variant.delivery_type || 'serials') === type.id ? "text-white" : "text-white/80")}>{type.title}</h3>
                                        <p className="text-[11px] text-white/40 leading-snug">{type.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>



                    {((editData.delivery_type || variant.delivery_type || 'serials') === 'dynamic') && (
                        <div className="space-y-3 pt-2">
                            <label className="text-[14px] font-medium text-white mb-2 ml-1 block">Webhook URL</label>
                            <Input
                                value={editData.webhook_url !== undefined ? editData.webhook_url || "" : variant.webhook_url || ""}
                                onChange={e => {
                                    setEditingId(variant.id)
                                    setEditData({ ...editData, webhook_url: e.target.value })
                                }}
                                className="bg-[#0b0d16] border-[#1e202e] h-12 text-sm font-medium rounded-lg px-3 focus-visible:border-[#a4f8ff] focus-visible:ring-0 transition-all placeholder:text-white/20"
                                placeholder="https://your-api.com/callback"
                            />
                            <p className="text-[11px] text-white/40 ml-1">A POST request will be sent to this URL upon purchase.</p>
                        </div>
                    )}

                    {((editData.delivery_type || variant.delivery_type || 'serials') === 'serials') && (
                        <div className="space-y-3 pt-2">
                            <label className="text-[14px] font-medium text-white mb-2 ml-1 block">Deliverable Selection Method</label>
                            <p className="text-[12px] text-white/40 font-normal ml-1 mb-3">Choose how will the system determine which deliverables to deliver to the customer.</p>

                            <div className="grid grid-cols-1 gap-3">
                                {[
                                    { id: 'last', label: 'Last', sub: 'The last item will be delivered first.', icon: RotateCcw },
                                    { id: 'first', label: 'First', sub: 'The first item will be delivered first.', icon: GripHorizontal },
                                    { id: 'random', label: 'Random', sub: 'A random item will be delivered.', icon: Shuffle }
                                ].map((method) => {
                                    const currentMethod = editData.deliverable_selection_method !== undefined ? editData.deliverable_selection_method : (variant.deliverable_selection_method || 'last')
                                    const isSelected = currentMethod === method.id

                                    return (
                                        <div
                                            key={method.id}
                                            onClick={() => {
                                                setEditingId(variant.id)
                                                setEditData({ ...editData, deliverable_selection_method: method.id as any })
                                            }}
                                            className={cn(
                                                "relative p-4 rounded-xl border cursor-pointer transition-all hover:bg-[#a4f8ff]/5 flex items-center gap-4 group",
                                                isSelected
                                                    ? "bg-[#a4f8ff]/5 border-[#a4f8ff] shadow-[0_0_20px_-10px_#a4f8ff]"
                                                    : "bg-[#0b0d16] border-[#1e202e] hover:border-white/10"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0",
                                                isSelected ? "border-[#a4f8ff] bg-[#a4f8ff]/20" : "border-white/10 group-hover:border-white/20"
                                            )}>
                                                {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#a4f8ff] shadow-[0_0_8px_#a4f8ff]" />}
                                            </div>

                                            <div className="flex-1">
                                                <div className={cn("text-sm font-bold mb-0.5", isSelected ? "text-white" : "text-white/80")}>{method.label}</div>
                                                <div className="text-[11px] text-white/40 leading-snug">{method.sub}</div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    <div className="space-y-3 pt-2">
                        <label className="text-[14px] font-medium text-white mb-2 ml-1 block">Disabled Payment Methods <span className="text-[12px] text-white/40 font-normal ml-1">(optional)</span></label>
                        <p className="text-[12px] text-white/40 font-normal ml-1">Disable specific payment methods on this variant.</p>
                        {/* Simplified dropdown for now since we don't have the full list of methods handy here, can be expanded later */}
                        <div className="flex flex-wrap gap-2">
                            {["PayPal", "Bitcoin", "Ethereum", "Litecoin", "Tether", "Solana", "USDC"].map((method) => {
                                const currentDisabled = editData.disabled_payment_methods !== undefined ? editData.disabled_payment_methods : (variant.disabled_payment_methods || [])
                                const isDisabled = currentDisabled.includes(method)
                                return (
                                    <button
                                        key={method}
                                        type="button"
                                        onClick={() => {
                                            const newDisabled = isDisabled
                                                ? currentDisabled.filter(m => m !== method)
                                                : [...currentDisabled, method]
                                            setEditingId(variant.id)
                                            setEditData({ ...editData, disabled_payment_methods: newDisabled })
                                        }}
                                        className={cn(
                                            "px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all flex items-center gap-2",
                                            isDisabled
                                                ? "bg-red-500/10 border-red-500/50 text-red-500"
                                                : "bg-[#0b0d16] border-[#1e202e] text-white/40 hover:border-white/20 hover:text-white/60"
                                        )}
                                    >
                                        {method}
                                        {isDisabled && <Ban className="w-3 h-3" />}
                                    </button>
                                )
                            })}
                        </div>
                    </div>



                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <button
                            type="button"
                            onClick={() => handleDeleteVariant(variant.id)}
                            className="h-9 px-4 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 hover:text-red-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove Variant
                        </button>
                        <div className="flex items-center gap-3">
                            {editingId === variant.id && (
                                <Button
                                    type="button"
                                    className="bg-[#a4f8ff] hover:bg-[#8aefff] text-black text-[10px] font-black uppercase tracking-widest px-6 h-12 rounded-xl"
                                    onClick={() => handleUpdate(variant.id)}
                                >
                                    Save Changes
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )
            }
        </Reorder.Item >
    )
}

export function VariantManager({ productId, deliveryType, onStockDeliveryDisabled, stockDeliveryEnabled, variantsEnabled, onVariantsEnabledChange }: VariantManagerProps) {
    const [variants, setVariants] = useState<Variant[]>([])
    const [isVariantsLoading, setIsVariantsLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [stockDialogVariant, setStockDialogVariant] = useState<Variant | null>(null)
    const [isCreating, setIsCreating] = useState(false)

    const [editData, setEditData] = useState<Partial<Variant>>({})
    const [expandedId, setExpandedId] = useState<string | null>(null)

    useEffect(() => {
        loadVariants()
    }, [productId])

    async function loadVariants(silent = false) {
        if (!silent) setIsVariantsLoading(true)
        try {
            const data = await getVariants(productId)
            setVariants(data || [])
        } catch (error) {
            toast.error("Failed to load variants")
        } finally {
            if (!silent) setIsVariantsLoading(false)
        }
    }

    async function handleAdd() {
        setIsCreating(true)
        try {
            const nextNumber = variants.length + 1
            const newVariantData = {
                name: `Variant ${nextNumber}`,
                description: "",
                price: 0,
                slashed_price: null,
                stock_count: 0,
                is_unlimited: (deliveryType as 'serials' | 'service' | 'dynamic') !== 'serials',
                min_quantity: 1,
                max_quantity: 10,
                webhook_url: null,
                instructions: "",
                volume_discounts: [],
                disable_volume_discounts_on_coupon: false,
                deliverable_selection_method: 'last',
                disabled_payment_methods: [],
                delivery_type: (deliveryType as 'serials' | 'service' | 'dynamic') || 'serials'
            }

            const created = await createVariant(productId, newVariantData)

            if (created) {
                // Auto-disable Stock & Delivery section when a variant is added
                try {
                    await updateProduct(productId, { payment_restrictions_enabled: false })
                    // Notify parent to update UI in real-time
                    onStockDeliveryDisabled?.()
                } catch (e) {
                    // Silent fail - not critical
                }

                toast.success("Variant added")
                await loadVariants()
                setExpandedId(created.id)
            }
        } catch (error: any) {
            console.error("ADD VARIANT ERROR:", error)
            toast.error("Failed to add variant: " + (error.message || "Unknown error"))
        } finally {
            setIsCreating(false)
        }
    }

    async function handleUpdate(id: string) {
        try {
            await updateVariant(id, {
                ...editData,
                price: editData.price !== undefined ? Number(editData.price) : undefined,
                slashed_price: editData.slashed_price !== undefined ? (editData.slashed_price ? Number(editData.slashed_price) : null) : undefined,
                stock_count: editData.stock_count !== undefined ? Number(editData.stock_count) : undefined,
                min_quantity: editData.min_quantity !== undefined ? Number(editData.min_quantity) : undefined,
                max_quantity: editData.max_quantity !== undefined ? Number(editData.max_quantity) : undefined,
                webhook_url: editData.webhook_url !== undefined ? editData.webhook_url : undefined,
                instructions: editData.instructions !== undefined ? editData.instructions : undefined,
                volume_discounts: editData.volume_discounts !== undefined ? editData.volume_discounts : undefined,
                disable_volume_discounts_on_coupon: editData.disable_volume_discounts_on_coupon !== undefined ? editData.disable_volume_discounts_on_coupon : undefined,
                deliverable_selection_method: editData.deliverable_selection_method !== undefined ? editData.deliverable_selection_method : undefined,
                disabled_payment_methods: editData.disabled_payment_methods !== undefined ? editData.disabled_payment_methods : undefined,
                delivery_type: editData.delivery_type !== undefined ? editData.delivery_type : undefined,
                is_unlimited: editData.is_unlimited !== undefined ? editData.is_unlimited : undefined
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

    async function handleReorder(newOrder: Variant[]) {
        setVariants(newOrder)
        try {
            const variantOrder = newOrder.map((v, index) => ({
                id: v.id,
                sort_order: index
            }))
            await reorderVariants(variantOrder)
        } catch (error) {
            toast.error("Failed to save new order")
        }
    }

    if (isVariantsLoading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-brand-primary" /></div>

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-12 rounded-xl bg-[#0f111a] border border-white/5 flex items-center justify-center">
                        <Layers className="w-5 h-5 text-white/40" />
                    </div>
                    <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Variants</h2>
                </div>
                <div className="flex items-center gap-3">
                    {/* Global Variants Toggle */}
                    <div className="flex items-center gap-2 bg-[#0b0d16] border border-white/5 rounded-lg px-3 py-2">
                        <span className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            variantsEnabled ? "text-emerald-400" : "text-white/30"
                        )}>
                            {variantsEnabled ? "Enabled" : "Disabled"}
                        </span>
                        <Switch
                            checked={variantsEnabled || false}
                            onCheckedChange={(checked) => {
                                onVariantsEnabledChange?.(checked)
                                // If enabling variants, auto-disable Stock & Delivery
                                if (checked) {
                                    onStockDeliveryDisabled?.()
                                }
                            }}
                            disabled={stockDeliveryEnabled}
                            className={cn(
                                "data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-white/10",
                                stockDeliveryEnabled && "opacity-50 cursor-not-allowed"
                            )}
                        />
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        className="h-9 px-4 bg-transparent border-[#a4f8ff]/20 hover:border-[#a4f8ff]/40 hover:bg-[#a4f8ff]/5 text-[#a4f8ff] hover:text-[#8aefff] font-bold text-[10px] uppercase tracking-[0.1em] rounded-lg transition-all"
                        onClick={handleAdd}
                        disabled={isCreating || !variantsEnabled}
                    >
                        {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Plus className="w-3.5 h-3.5 mr-1.5" />}
                        {isCreating ? "Adding..." : "Add Variant"}
                    </Button>
                </div>
            </div>

            <div className={cn(
                "space-y-4 border-t border-white/5",
                (variants.length > 0 || stockDeliveryEnabled) ? "pt-3" : ""
            )}>
                {/* Warning when Stock & Delivery is enabled */}
                {stockDeliveryEnabled && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                            <Zap className="w-4 h-4 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-[12px] font-bold text-amber-500">Stock & Delivery is enabled</p>
                            <p className="text-[11px] text-amber-500/60">Variants are ignored when Stock & Delivery is enabled. Disable it to use variant-based stock.</p>
                        </div>
                    </div>
                )}

                {/* Empty state when no variants */}
                {variants.length === 0 && !stockDeliveryEnabled && (
                    <div className="flex flex-col items-center justify-center py-8 px-4 rounded-xl bg-[#0b0d16] border border-dashed border-white/10">
                        <div className="w-12 h-12 rounded-xl bg-[#a4f8ff]/10 flex items-center justify-center mb-4">
                            <Layers className="w-6 h-6 text-[#a4f8ff]/50" />
                        </div>
                        <p className="text-[13px] font-bold text-white/60 mb-1">No variants yet</p>
                        <p className="text-[11px] text-white/30 text-center max-w-xs">
                            Add variants to offer different options (sizes, tiers, etc.) with separate pricing and stock.
                        </p>
                    </div>
                )}


                <Reorder.Group axis="y" values={variants} onReorder={handleReorder} className="space-y-4">
                    {variants.map(variant => (
                        <VariantItem
                            key={variant.id}
                            variant={variant}
                            isExpanded={expandedId === variant.id}
                            setExpandedId={setExpandedId}
                            editData={editData}
                            setEditData={setEditData}
                            editingId={editingId}
                            setEditingId={setEditingId}
                            handleUpdate={handleUpdate}
                            handleDeleteVariant={handleDeleteVariant}
                            setStockDialogVariant={setStockDialogVariant}
                        />
                    ))}
                </Reorder.Group>
            </div>
            {/* Stock Dialog */}
            {stockDialogVariant && (
                <StockDialog
                    open={!!stockDialogVariant}
                    onOpenChange={(open) => !open && setStockDialogVariant(null)}
                    productId={productId}
                    variantId={stockDialogVariant.id}
                    variantName={stockDialogVariant.name}
                    onStockChange={() => loadVariants(true)}
                />
            )}
        </div>
    )
}
