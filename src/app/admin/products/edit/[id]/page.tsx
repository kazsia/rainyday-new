"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Plus,
    Share2,
    Repeat,
    Layers,
    ShieldCheck,
    Activity,
    BellRing,
    Award,
    Zap,
    History,
    Megaphone,
    Monitor,
    ChevronLeft,
    ChevronDown,
    X,
    Save,
    Layout,
    ImageIcon,
    FileText,
    DollarSign,
    Eye,
    Trash2,
    Loader2,
    Banknote,
    Activity as Waveform,
    ChevronRight,
    Search,
    Link2,
    Check,
    BarChart3,
    Star,
    Package,
    TextCursorInput,
    Timer,
    Shuffle,
    Ban
} from "lucide-react"
import { getProduct, updateProduct, deleteProduct, getCategories } from "@/lib/db/products"
import { uploadAsset } from "@/lib/db/settings"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { VariantManager } from "@/components/admin/products/variant-manager"
import { BadgeManager } from "@/components/admin/products/badge-manager"
import { StockDialog } from "@/components/admin/products/stock-dialog"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export default function EditProductPage() {
    const router = useRouter()
    const { id } = useParams()
    const [categories, setCategories] = useState<any[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isUploading, setIsUploading] = useState(false)
    const [isCustomFieldDialogOpen, setIsCustomFieldDialogOpen] = useState(false)
    const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null)
    const [fieldData, setFieldData] = useState({ name: "", placeholder: "", required: false })
    const [isStockDialogOpen, setIsStockDialogOpen] = useState(false)
    const [variantCount, setVariantCount] = useState(0)
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        instructions: "",
        price: 0,
        slashed_price: 0,
        currency: "USD",
        category_id: "",
        stock_count: 0,
        is_active: true,
        visibility: "public",
        image_url: "",
        hide_stock: false,
        delivery_type: "serials", // serials, service, dynamic
        webhook_url: "",
        status_label: "In Stock!",
        status_color: "green",
        show_view_count: false,
        show_sales_count: true,
        show_sales_notifications: true,

        badges: [] as string[],
        custom_fields: [] as any[],
        sales_timespan: "all_time",
        deliverable_selection_method: 'last',
        is_unlimited: false,
    })

    useEffect(() => {
        async function loadData() {
            try {
                const [productData, categoriesData] = await Promise.all([
                    getProduct(id as string),
                    getCategories()
                ])
                setCategories(categoriesData)
                setFormData({
                    name: productData.name,
                    slug: productData.slug || '',
                    description: productData.description || "",
                    instructions: productData.instructions || "",
                    price: productData.price,
                    slashed_price: productData.slashed_price || 0,
                    currency: productData.currency || "USD",
                    category_id: productData.category_id || "none",
                    stock_count: productData.stock_count || 0,
                    is_active: productData.is_active,
                    visibility: productData.visibility || (productData.is_active ? "public" : "hidden"),
                    image_url: productData.image_url || "",
                    hide_stock: !!productData.hide_stock,
                    delivery_type: productData.delivery_type || "serials",
                    webhook_url: productData.webhook_url || "",
                    status_label: productData.status_label || "In Stock!",
                    status_color: productData.status_color || "green",
                    show_view_count: !!productData.show_view_count,
                    show_sales_count: productData.show_sales_count !== undefined ? productData.show_sales_count : true,
                    show_sales_notifications: productData.show_sales_notifications !== undefined ? productData.show_sales_notifications : true,

                    badges: productData.badge_links?.map((bl: any) => bl.badge.id) || [],
                    custom_fields: productData.custom_fields || [],
                    sales_timespan: productData.sales_timespan || "all_time",
                    deliverable_selection_method: productData.deliverable_selection_method || 'last',
                    is_unlimited: !!productData.is_unlimited,
                })
            } catch (error) {
                toast.error("Failed to load product data")
                router.push("/admin/products")
            } finally {
                setIsLoading(false)
            }
        }
        if (id) loadData()
    }, [id])

    async function handleSubmit(e: React.FormEvent, exitAfter = true) {
        e.preventDefault()
        if (isSubmitting) return

        setIsSubmitting(true)
        try {
            const { sales_timespan, badges, ...cleanFormData } = formData as any
            await updateProduct(id as string, {
                ...cleanFormData,
                category_id: (formData.category_id === "none" || formData.category_id === "") ? null : formData.category_id,
                price: Number(formData.price),
                slashed_price: formData.slashed_price ? Number(formData.slashed_price) : undefined,
                stock_count: Number(formData.stock_count),
                custom_fields: formData.custom_fields,
                is_unlimited: !!formData.is_unlimited
            })
            toast.success("Product updated successfully")
            if (exitAfter) {
                router.push("/admin/products")
            }
        } catch (error) {
            toast.error("Failed to update product")
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleUpload(file: File) {
        setIsUploading(true)
        try {
            const url = await uploadAsset(file)
            if (url) {
                setFormData(prev => ({ ...prev, image_url: url }))
                toast.success("Image uploaded successfully")
            } else {
                toast.error("Failed to upload image")
            }
        } catch (error) {
            toast.error("Error uploading image")
        } finally {
            setIsUploading(false)
        }
    }

    async function handleDelete() {
        if (!confirm("Are you sure you want to delete this product?")) return
        try {
            await deleteProduct(id as string)
            toast.success("Product deleted")
            router.push("/admin/products")
        } catch (error) {
            toast.error("Failed to delete product")
        }
    }

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout>
            <>
                <form onSubmit={(e) => handleSubmit(e)} className="max-w-[1280px] mx-auto space-y-8 pb-32 pt-4 px-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1.5">
                            <h1 className="text-3xl font-black text-white tracking-tight">Edit Product</h1>
                            <p className="text-[13px] text-white/40 font-medium">Edit the product details below.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                className="h-11 px-6 bg-[#0f111a] border-white/5 hover:border-white/10 hover:bg-white/5 text-white/60 hover:text-white font-bold text-xs uppercase tracking-[0.15em] rounded-xl transition-all"
                                onClick={() => router.push("/admin/products")}
                            >
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="h-11 px-6 bg-[#0f111a] border-[#a4f8ff]/20 hover:border-[#a4f8ff]/40 hover:bg-[#a4f8ff]/5 text-[#a4f8ff] hover:text-[#8aefff] font-bold text-xs uppercase tracking-[0.15em] rounded-xl transition-all"
                                onClick={(e) => handleSubmit(e as any, true)}
                                disabled={isSubmitting}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Save & Exit
                            </Button>
                            <Button
                                type="submit"
                                className="h-11 px-8 bg-[#a4f8ff] hover:bg-[#8aefff] text-black font-bold text-xs uppercase tracking-[0.15em] rounded-xl shadow-xl shadow-[#a4f8ff]/20 transition-all active:scale-[0.98]"
                                disabled={isSubmitting}
                                onClick={(e) => {
                                    e.preventDefault()
                                    handleSubmit(e as any, false)
                                }}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {isSubmitting ? "Saving..." : "Save"}
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* General Section */}
                            <div className="bg-[#0a0c14] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                                <div className="px-5 py-4 border-b border-white/5 flex items-center gap-4 bg-[#0a0c14]">
                                    <div className="w-10 h-10 rounded-xl bg-[#0f111a] border border-white/5 flex items-center justify-center">
                                        <Layout className="w-5 h-5 text-white/40" />
                                    </div>
                                    <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">General</h2>
                                </div>
                                <div className="p-6 space-y-8">
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Name</label>
                                        <Input
                                            required
                                            placeholder="Product Name"
                                            className="bg-[#0f111a] border-white/5 h-14 text-sm font-medium focus-visible:border-[#a4f8ff]/50 focus-visible:ring-0 transition-all rounded-xl px-4"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                            URL Path <span className="text-[10px] lowercase normal-case opacity-40 font-bold tracking-tight">(optional)</span>
                                        </label>
                                        <Input
                                            placeholder={formData.name ? formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : "e.g. nitro-boost"}
                                            className="bg-[#0f111a] border-white/5 h-14 text-sm font-medium focus-visible:border-[#a4f8ff]/50 focus-visible:ring-0 transition-all rounded-xl px-4"
                                            value={formData.slug}
                                            onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                        />
                                        <div className="flex items-center gap-2 ml-1">
                                            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                                                Product URL: <span className="text-[#a4f8ff]/60 tracking-normal lower-case font-medium">/product/{formData.slug || (formData.name ? formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : 'your-product')}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Description</label>
                                        <RichTextEditor
                                            value={formData.description}
                                            onChange={(val) => setFormData({ ...formData, description: val })}
                                            placeholder="Describe your product..."
                                            className="bg-[#0f111a] border-white/5"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Image Section */}
                            <div className="bg-[#0a0c14] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                                <div className="px-5 py-4 border-b border-white/5 flex items-center gap-4 bg-[#0a0c14]">
                                    <div className="w-10 h-10 rounded-xl bg-[#0f111a] border border-white/5 flex items-center justify-center">
                                        <ImageIcon className="w-5 h-5 text-white/40" />
                                    </div>
                                    <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Product Image</h2>
                                </div>
                                <div className="p-6">
                                    <p className="text-[12px] text-white/40 font-bold mb-6">Select or upload a high-quality image for your product. This will be the main cover image shown in the store.</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div
                                            className="aspect-video bg-[#0f111a] border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-4 group hover:border-white/10 transition-all cursor-pointer relative overflow-hidden active:scale-[0.98]"
                                            onClick={() => document.getElementById('gallery-upload')?.click()}
                                        >
                                            <input
                                                type="file"
                                                id="gallery-upload"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0]
                                                    if (file) handleUpload(file)
                                                }}
                                            />
                                            <div className="w-12 h-12 rounded-xl bg-[#0a0c14] border border-white/5 flex items-center justify-center group-hover:scale-110 transition-all">
                                                <Plus className="w-6 h-6 text-white/20 group-hover:text-white/40" />
                                            </div>
                                            <p className="text-[11px] font-black text-white/20 text-center uppercase tracking-widest group-hover:text-white/40 transition-colors">
                                                Upload Image
                                            </p>
                                        </div>

                                        {formData.image_url ? (
                                            <div className="aspect-video bg-[#0f111a] border-2 border-[#a4f8ff]/20 rounded-2xl relative overflow-hidden group shadow-2xl shadow-[#a4f8ff]/5">
                                                <img src={formData.image_url} alt="" className="w-full h-full object-cover" />
                                                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent flex items-end p-5">
                                                    <div className="flex items-center justify-between w-full">
                                                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Preview</span>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setFormData({ ...formData, image_url: "" });
                                                            }}
                                                            className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : isUploading ? (
                                            <div className="aspect-video bg-[#0f111a] border border-white/5 rounded-2xl flex items-center justify-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <Loader2 className="w-8 h-8 text-[#a4f8ff] animate-spin" />
                                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest animate-pulse">Uploading...</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="aspect-video bg-[#0f111a] border border-white/5 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3">
                                                <ImageIcon className="w-8 h-8 text-white/5" />
                                                <p className="text-[10px] font-black text-white/10 uppercase tracking-widest">No Image Preview</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Instructions Section */}
                            <div className="bg-[#0a0c14] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                                <div className="px-5 py-4 border-b border-white/5 flex items-center gap-4 bg-[#0a0c14]">
                                    <div className="w-10 h-10 rounded-xl bg-[#0f111a] border border-white/5 flex items-center justify-center">
                                        <Monitor className="w-5 h-5 text-white/40" />
                                    </div>
                                    <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Instructions</h2>
                                </div>
                                <div className="p-6">
                                    <p className="text-[12px] text-white/40 font-bold mb-6">This will be shown to the customer on the invoice page and in their confirmation email.</p>
                                    <RichTextEditor
                                        value={formData.instructions}
                                        onChange={(val) => setFormData({ ...formData, instructions: val })}
                                        placeholder="To use this product, follow these instructions..."
                                        className="bg-[#0f111a] border-white/5"
                                    />
                                </div>
                            </div>


                            {/* Custom Fields */}
                            <div className="bg-[#0a0c14] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                                <div className="px-5 py-4 flex items-center justify-between border-b border-white/5 bg-[#0a0c14]">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-[#0f111a] border border-white/5 flex items-center justify-center">
                                            <TextCursorInput className="w-5 h-5 text-white/40" />
                                        </div>
                                        <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Custom Fields</h2>
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            setFieldData({ name: "", placeholder: "", required: false })
                                            setEditingFieldIndex(null)
                                            setIsCustomFieldDialogOpen(true)
                                        }}
                                        variant="outline"
                                        className="h-9 px-4 bg-transparent border-[#a4f8ff]/20 hover:border-[#a4f8ff]/40 hover:bg-[#a4f8ff]/5 text-[#a4f8ff] hover:text-[#8aefff] font-bold text-[10px] uppercase tracking-[0.1em] rounded-lg transition-all"
                                    >
                                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                                        Add Field
                                    </Button>
                                </div>
                                <div className="p-6 space-y-6">
                                    <p className="text-[10px] text-white/20 font-bold leading-relaxed px-1">
                                        Collect additional information from your customers by adding custom fields to your products.
                                    </p>

                                    {formData.custom_fields.length > 0 && (
                                        <div className="grid grid-cols-1 gap-3">
                                            {formData.custom_fields.map((field, idx) => (
                                                <div key={field.id} className="flex items-center justify-between p-4 bg-[#0f111a] border border-white/5 rounded-xl group hover:border-[#a4f8ff]/30 transition-all">
                                                    <div
                                                        className="flex items-center gap-4 cursor-pointer flex-1"
                                                        onClick={() => {
                                                            setFieldData({ name: field.name, placeholder: field.placeholder, required: field.required })
                                                            setEditingFieldIndex(idx)
                                                            setIsCustomFieldDialogOpen(true)
                                                        }}
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-[#0a0c14] border border-white/5 flex items-center justify-center group-hover:text-[#a4f8ff] transition-colors">
                                                            <span className="text-[10px] font-black text-white/40 group-hover:text-[#a4f8ff]">{idx + 1}</span>
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <h3 className="text-[13px] font-bold text-white group-hover:text-[#a4f8ff] transition-colors">{field.name}</h3>
                                                            {field.placeholder && <p className="text-[11px] text-white/40">{field.placeholder}</p>}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        {field.required && (
                                                            <div className="px-2 py-0.5 rounded-md bg-[#a4f8ff]/10 border border-[#a4f8ff]/20">
                                                                <span className="text-[9px] font-bold text-[#a4f8ff] uppercase tracking-wider">Required</span>
                                                            </div>
                                                        )}
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => {
                                                                const newFields = [...formData.custom_fields]
                                                                newFields.splice(idx, 1)
                                                                setFormData({ ...formData, custom_fields: newFields })
                                                            }}
                                                            className="h-8 w-8 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Options & Variants */}
                            <div className="space-y-6">
                                <VariantManager productId={id as string} deliveryType={formData.delivery_type} />
                            </div>






                        </div>

                        {/* Sidebar */}
                        <div className="space-y-8">
                            {/* Currency & Tax Section */}
                            <div className="bg-[#0a0c14] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                                <div className="px-5 py-4 border-b border-white/5 flex items-center gap-4 bg-[#0a0c14]">
                                    <div className="w-10 h-10 rounded-xl bg-[#0f111a] border border-white/5 flex items-center justify-center">
                                        <Banknote className="w-5 h-5 text-white/40" />
                                    </div>
                                    <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Currency & Tax</h2>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Currency</label>
                                        <div className="relative">
                                            <select
                                                className="w-full h-14 px-4 pr-12 rounded-xl bg-[#0f111a] border border-white/5 text-sm font-bold text-white appearance-none focus:outline-none focus:border-[#a4f8ff]/50 transition-all cursor-pointer"
                                                value={formData.currency}
                                                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                                            >
                                                <option value="USD">USD ($)</option>
                                                <option value="EUR">EUR (€)</option>
                                                <option value="GBP">GBP (£)</option>
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Visibility & Group Section */}
                            <div className="bg-[#0a0c14] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                                <div className="px-5 py-4 border-b border-white/5 flex items-center gap-4 bg-[#0a0c14]">
                                    <div className="w-10 h-10 rounded-xl bg-[#0f111a] border border-white/5 flex items-center justify-center">
                                        <Eye className="w-5 h-5 text-white/40" />
                                    </div>
                                    <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Visibility & Group</h2>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Visibility</label>
                                        <Select
                                            value={formData.visibility}
                                            onValueChange={(val) => setFormData({ ...formData, visibility: val, is_active: val === "public" })}
                                        >
                                            <SelectTrigger className="w-full h-10 bg-background/40 border-white/10 rounded-xl px-4 text-sm text-white focus:ring-0 focus:ring-offset-0">
                                                <SelectValue placeholder="Select visibility" />
                                            </SelectTrigger>
                                            <SelectContent position="popper" className="bg-background border-white/10 text-white">
                                                <SelectItem value="public">Public</SelectItem>
                                                <SelectItem value="on_hold">On Hold</SelectItem>
                                                <SelectItem value="hidden">Hidden</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Group</label>
                                        <Select
                                            value={formData.category_id}
                                            onValueChange={(val) => setFormData({ ...formData, category_id: val })}
                                        >
                                            <SelectTrigger className="w-full h-14 bg-[#0f111a] border-white/5 rounded-xl px-4 text-sm font-bold text-white focus:ring-0 focus:ring-offset-0">
                                                <div className="flex items-center justify-between w-full pr-2">
                                                    <SelectValue placeholder="Select..." />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent position="popper" className="bg-[#0a0c14] border-white/10 text-white">
                                                <SelectItem value="none">None</SelectItem>
                                                {categories.map(cat => (
                                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>


                                </div>
                            </div>

                            {/* Stock & Delivery Section */}
                            <div className="bg-[#0a0c14] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                                <div className="px-5 py-4 border-b border-white/5 flex items-center gap-4 bg-[#0a0c14]">
                                    <div className="w-10 h-10 rounded-xl bg-[#0f111a] border border-white/5 flex items-center justify-center">
                                        <Package className="w-5 h-5 text-white/40" />
                                    </div>
                                    <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Stock & Delivery</h2>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="space-y-1">
                                                <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Stock Status</label>
                                                <p className="text-[10px] text-white/20 font-bold leading-relaxed px-1">
                                                    {formData.delivery_type === 'serials'
                                                        ? "Stock is managed via deliverables for serials."
                                                        : "Choose if this product has unlimited stock."}
                                                </p>
                                            </div>
                                            {formData.delivery_type !== 'serials' && (
                                                <div className="flex items-center gap-3 bg-[#0f111a] border border-white/5 rounded-xl px-4 py-2">
                                                    <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Unlimited</span>
                                                    <Switch
                                                        checked={formData.is_unlimited}
                                                        onCheckedChange={(checked) => setFormData({ ...formData, is_unlimited: checked })}
                                                        className="data-[state=checked]:bg-[#a4f8ff]"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {formData.delivery_type !== 'serials' && !formData.is_unlimited && (
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Stock Count</label>
                                                <Input
                                                    type="number"
                                                    className="bg-[#0f111a] border-white/5 h-14 text-sm font-medium focus-visible:border-[#a4f8ff]/50 focus-visible:ring-0 transition-all rounded-xl px-4"
                                                    value={formData.stock_count}
                                                    onChange={e => setFormData({ ...formData, stock_count: parseInt(e.target.value) })}
                                                    placeholder="0"
                                                />
                                            </div>
                                        )}

                                        {formData.delivery_type === 'serials' && (
                                            <div className="space-y-3">
                                                <div className="p-4 bg-[#0f111a] border border-white/5 rounded-xl flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Package className="w-4 h-4 text-white/20" />
                                                        <span className="text-sm font-medium text-white/60">Current Stock Assets:</span>
                                                    </div>
                                                    <span className="text-sm font-bold text-[#a4f8ff]">{formData.stock_count}</span>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setIsStockDialogOpen(true)}
                                                    className="w-full h-12 border-[#a4f8ff]/30 bg-[#a4f8ff]/5 hover:bg-[#a4f8ff]/10 text-[#a4f8ff] hover:text-[#8aefff] font-bold text-[11px] uppercase tracking-[0.1em] rounded-xl transition-all gap-2"
                                                >
                                                    <Layers className="w-4 h-4" />
                                                    Manage Stock Assets
                                                </Button>
                                            </div>
                                        )}

                                        {formData.is_unlimited && formData.delivery_type !== 'serials' && (
                                            <div className="p-4 bg-[#a4f8ff]/5 border border-[#a4f8ff]/20 rounded-xl flex items-center gap-3">
                                                <Zap className="w-4 h-4 text-[#a4f8ff] animate-pulse" />
                                                <span className="text-sm font-bold text-[#a4f8ff]">Unlimited Stock Enabled</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Delivery Method</label>
                                        <div className="relative">
                                            <select
                                                className="w-full h-14 px-4 pr-12 rounded-xl bg-[#0f111a] border border-white/5 text-sm font-bold text-white appearance-none focus:outline-none focus:border-[#a4f8ff]/50 transition-all cursor-pointer"
                                                value={formData.delivery_type}
                                                onChange={e => setFormData({ ...formData, delivery_type: e.target.value })}
                                            >
                                                <option value="serials">Serials (Manual/Bulk)</option>
                                                <option value="dynamic">Dynamic (Webhook)</option>
                                                <option value="service">Service (Manual fulfillment)</option>
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 pointer-events-none" />
                                        </div>
                                    </div>

                                    {formData.delivery_type === 'dynamic' && (
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Webhook URL</label>
                                            <Input
                                                value={formData.webhook_url}
                                                onChange={e => setFormData({ ...formData, webhook_url: e.target.value })}
                                                className="bg-[#0f111a] border-white/5 h-14 text-sm font-medium focus-visible:border-[#a4f8ff]/50 focus-visible:ring-0 transition-all rounded-xl px-4"
                                                placeholder="https://your-api.com/callback"
                                            />
                                            <p className="text-[10px] text-white/20 font-bold leading-relaxed px-1">
                                                A POST request will be sent to this URL upon purchase to generate the delivery content.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Live Stats */}
                            <div className="bg-[#0a0c14] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                                <div className="px-5 py-4 border-b border-white/5 flex items-center gap-4 bg-[#0a0c14]">
                                    <div className="w-10 h-10 rounded-xl bg-[#0f111a] border border-white/5 flex items-center justify-center">
                                        <BarChart3 className="w-5 h-5 text-white/40" />
                                    </div>
                                    <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Live Stats</h2>
                                </div>
                                <div className="p-6 space-y-6">
                                    {[
                                        { id: "show_view_count", label: "Live Product Views Count", desc: "If enabled, the live views count will be displayed on the product page." },
                                        { id: "show_sales_count", label: "Live Product Sales Count", desc: "If enabled, the live sales count will be displayed on the product page." }
                                    ].map(toggle => (
                                        <div key={toggle.id} className="space-y-3">
                                            <label className="text-[11px] font-black text-white uppercase tracking-[0.2em] ml-1">{toggle.label}</label>
                                            <p className="text-[10px] text-white/20 font-bold leading-relaxed px-1">{toggle.desc}</p>
                                            <div
                                                className="h-14 px-4 bg-[#0f111a] border border-white/5 rounded-xl flex items-center gap-3 cursor-pointer group hover:border-white/10 transition-all"
                                                onClick={() => setFormData({ ...formData, [toggle.id]: !formData[toggle.id as keyof typeof formData] })}
                                            >
                                                <div className={cn(
                                                    "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                                                    formData[toggle.id as keyof typeof formData] ? "bg-[#a4f8ff] border-[#a4f8ff]" : "border-white/10 group-hover:border-white/20"
                                                )}>
                                                    {formData[toggle.id as keyof typeof formData] && <Check className="w-3.5 h-3.5 text-white" />}
                                                </div>
                                                <span className="text-[12px] font-black text-white/60 tracking-tight">Show {toggle.id.includes('view') ? 'Views' : 'Sales'} Count</span>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-white uppercase tracking-[0.2em] ml-1">Live Sales Count Timespan</label>
                                        <p className="text-[10px] text-white/20 font-bold leading-relaxed px-1">The timespan for which the live sales count will be displayed.</p>
                                        <div className="relative">
                                            <select
                                                className="w-full h-14 px-4 pr-12 rounded-xl bg-[#0f111a] border border-white/5 text-sm font-bold text-white appearance-none focus:outline-none focus:border-[#a4f8ff]/50 transition-all cursor-pointer"
                                                value={formData.sales_timespan || 'all_time'}
                                                onChange={e => setFormData({ ...formData, sales_timespan: e.target.value })}
                                            >
                                                <option value="all_time">All Time</option>
                                                <option value="24h">Last 24 Hours</option>
                                                <option value="7d">Last 7 Days</option>
                                                <option value="30d">Last 30 Days</option>
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-white uppercase tracking-[0.2em] ml-1">Live Sales Notifications</label>
                                        <p className="text-[10px] text-white/20 font-bold leading-relaxed px-1">If enabled, the latest orders will be displayed as live notifications on the bottom left of the product page.</p>
                                        <div
                                            className="h-14 px-4 bg-[#0f111a] border border-white/5 rounded-xl flex items-center gap-3 cursor-pointer group hover:border-white/10 transition-all"
                                            onClick={() => setFormData({ ...formData, show_sales_notifications: !formData.show_sales_notifications })}
                                        >
                                            <div className={cn(
                                                "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                                                formData.show_sales_notifications ? "bg-[#a4f8ff] border-[#a4f8ff]" : "border-white/10 group-hover:border-white/20"
                                            )}>
                                                {formData.show_sales_notifications && <Check className="w-3.5 h-3.5 text-white" />}
                                            </div>
                                            <span className="text-[12px] font-black text-white/60 tracking-tight">Show Sales Notifications</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Badges */}
                            <div className="bg-[#0a0c14] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-[#0a0c14]">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-[#0f111a] border border-white/5 flex items-center justify-center">
                                            <Star className="w-5 h-5 text-white/40" />
                                        </div>
                                        <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Badges</h2>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-9 px-4 bg-transparent border-[#a4f8ff]/20 hover:border-[#a4f8ff]/40 hover:bg-[#a4f8ff]/5 text-[#a4f8ff] hover:text-[#8aefff] font-bold text-[10px] uppercase tracking-[0.1em] rounded-lg transition-all"
                                        onClick={() => {/* Trigger badge manager add */ }}
                                    >
                                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                                        Add Badge
                                    </Button>
                                </div>
                                <div className="p-6">
                                    <BadgeManager
                                        productId={id as string}
                                        initialBadgeIds={formData.badges || []}
                                    />
                                </div>
                            </div>

                            {/* Status */}
                            <div className="bg-[#0a0c14] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-[#0a0c14]">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-[#0f111a] border border-white/5 flex items-center justify-center">
                                            <Waveform className="w-5 h-5 text-white/40" />
                                        </div>
                                        <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Status</h2>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const next = formData.visibility === 'public' ? 'hidden' : formData.visibility === 'hidden' ? 'on_hold' : 'public'
                                            setFormData({ ...formData, visibility: next, is_active: next === 'public' })
                                        }}
                                        className={cn(
                                            "w-10 h-6 rounded-full transition-colors relative flex items-center px-1",
                                            formData.visibility === 'public' ? "bg-brand-primary" : formData.visibility === 'on_hold' ? "bg-orange-500" : "bg-white/10"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-4 h-4 bg-white rounded-full transition-all",
                                            formData.visibility === 'public' ? "translate-x-4" : formData.visibility === 'on_hold' ? "translate-x-2" : "translate-x-0"
                                        )} />
                                    </button>
                                </div>
                                <div className="p-6 space-y-6">
                                    <p className="text-[10px] text-white/20 font-bold leading-relaxed px-1">
                                        Let your customers know about the current product status before buying. Unlike the Badge, the Status of all products is also visible on a separate status page.
                                    </p>
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Status Color</label>
                                        <div className="flex items-center gap-3 px-1">
                                            {['red', 'orange', 'yellow', 'green', 'blue'].map(color => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, status_color: color })}
                                                    className={cn(
                                                        "w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center",
                                                        formData.status_color === color ? "border-[#a4f8ff] bg-[#a4f8ff]/10" : "border-white/5 hover:border-white/10",
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-4 h-4 rounded-full",
                                                        color === 'red' ? 'bg-[#ff4b4b]' :
                                                            color === 'orange' ? 'bg-[#ff8c00]' :
                                                                color === 'yellow' ? 'bg-[#ffcc00]' :
                                                                    color === 'green' ? 'bg-[#00e676]' :
                                                                        'bg-[#00e5ff]'
                                                    )} />
                                                </button>
                                            ))}
                                            <button className="w-8 h-8 rounded-full border-2 border-white/5 flex items-center justify-center text-white/20" onClick={() => setFormData({ ...formData, status_color: "" })}>
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Status Label</label>
                                        <Input
                                            className="bg-[#0f111a] border-white/5 h-14 text-sm font-medium focus-visible:border-[#a4f8ff]/50 focus-visible:ring-0 transition-all rounded-xl px-4"
                                            value={formData.status_label}
                                            onChange={e => setFormData({ ...formData, status_label: e.target.value })}
                                            placeholder="In Stock!"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 flex flex-col gap-3">
                                <div className="flex flex-col gap-1 px-1">
                                    <span className="text-[11px] text-white/40 font-black uppercase tracking-[0.2em]">Danger Zone</span>
                                    <p className="text-[10px] text-white/20 font-bold tracking-tight">Irreversibly delete this product and all its association data.</p>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full h-14 border border-red-500/10 hover:border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 font-bold text-xs uppercase tracking-[0.15em] rounded-xl justify-start px-5 group transition-all"
                                    onClick={handleDelete}
                                >
                                    <Trash2 className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform" />
                                    Delete Product
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>



                <Dialog open={isCustomFieldDialogOpen} onOpenChange={setIsCustomFieldDialogOpen}>
                    <DialogContent className="sm:max-w-[425px] bg-[#0a0c14] border-white/5">
                        <DialogHeader>
                            <DialogTitle className="text-white">{editingFieldIndex !== null ? "Edit Field" : "Add Custom Field"}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Field Name</Label>
                                <Input
                                    value={fieldData.name}
                                    onChange={(e) => setFieldData({ ...fieldData, name: e.target.value })}
                                    placeholder="e.g. Discord Username"
                                    className="bg-[#0f111a] border-white/5 h-11 focus-visible:ring-[#a4f8ff]/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Placeholder / Hint</Label>
                                <Input
                                    value={fieldData.placeholder}
                                    onChange={(e) => setFieldData({ ...fieldData, placeholder: e.target.value })}
                                    placeholder="Instruction for customer"
                                    className="bg-[#0f111a] border-white/5 h-11 focus-visible:ring-[#a4f8ff]/50"
                                />
                            </div>
                            <div className="flex items-center justify-between pt-2">
                                <Label className="text-[11px] font-bold text-white uppercase tracking-widest opacity-60">Required Field</Label>
                                <Switch
                                    checked={fieldData.required}
                                    onCheckedChange={(checked) => setFieldData({ ...fieldData, required: checked })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-4">
                            <Button
                                variant="ghost"
                                onClick={() => setIsCustomFieldDialogOpen(false)}
                                className="bg-white/5 border-white/5 hover:bg-white/10 text-white"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => {
                                    const newFields = [...formData.custom_fields]
                                    if (editingFieldIndex !== null) {
                                        newFields[editingFieldIndex] = { ...newFields[editingFieldIndex], ...fieldData }
                                    } else {
                                        newFields.push({ id: Math.random().toString(36).substr(2, 9), ...fieldData })
                                    }
                                    setFormData({ ...formData, custom_fields: newFields })
                                    setIsCustomFieldDialogOpen(false)
                                }}
                                className="bg-[#6366f1] hover:bg-[#818cf8] text-white font-bold"
                            >
                                {editingFieldIndex !== null ? "Update" : "Add Field"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Stock Dialog for product-level stock management */}
                <StockDialog
                    productId={id as string}
                    variantId={undefined}
                    open={isStockDialogOpen}
                    onOpenChange={(open) => setIsStockDialogOpen(open)}
                    onStockChange={async (newCount) => {
                        setFormData(prev => ({ ...prev, stock_count: newCount }))
                    }}
                />
            </>
        </AdminLayout >
    )
}
