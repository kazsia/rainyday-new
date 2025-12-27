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
    Loader2
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
import { StockInput } from "@/components/ui/stock-input"
import Link from "next/link"
import { StockManager } from "@/components/admin/products/stock-manager"
import { VariantManager } from "@/components/admin/products/variant-manager"
import { BadgeManager } from "@/components/admin/products/badge-manager"

export default function EditProductPage() {
    const router = useRouter()
    const { id } = useParams()
    const [categories, setCategories] = useState<any[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isUploading, setIsUploading] = useState(false)

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
        image_url: "",
        hide_stock: false,
        delivery_type: "serials", // serials, service, dynamic
        webhook_url: "",
        status_label: "In Stock!",
        status_color: "green",
        show_view_count: false,
        show_sales_count: true,
        show_sales_notifications: true,
        min_quantity: 1,
        max_quantity: 10,
        badges: [] as string[],
        custom_fields: [] as any[]
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
                    slug: productData.slug || productData.id.slice(0, 8),
                    description: productData.description || "",
                    instructions: productData.instructions || "",
                    price: productData.price,
                    slashed_price: productData.slashed_price || 0,
                    currency: productData.currency || "USD",
                    category_id: productData.category_id || "none",
                    stock_count: productData.stock_count || 0,
                    is_active: productData.is_active,
                    image_url: productData.image_url || "",
                    hide_stock: !!productData.hide_stock,
                    delivery_type: productData.delivery_type || "serials",
                    webhook_url: productData.webhook_url || "",
                    status_label: productData.status_label || "In Stock!",
                    status_color: productData.status_color || "green",
                    show_view_count: !!productData.show_view_count,
                    show_sales_count: productData.show_sales_count !== undefined ? productData.show_sales_count : true,
                    show_sales_notifications: productData.show_sales_notifications !== undefined ? productData.show_sales_notifications : true,
                    min_quantity: productData.min_quantity || 1,
                    max_quantity: productData.max_quantity || 10,
                    badges: productData.badge_links?.map((bl: any) => bl.badge.id) || [],
                    custom_fields: productData.custom_fields || []
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
            await updateProduct(id as string, {
                ...formData,
                category_id: (formData.category_id === "none" || formData.category_id === "") ? null : formData.category_id,
                price: Number(formData.price),
                slashed_price: formData.slashed_price ? Number(formData.slashed_price) : undefined,
                stock_count: Number(formData.stock_count),
                min_quantity: Number(formData.min_quantity),
                max_quantity: Number(formData.max_quantity),
                custom_fields: formData.custom_fields
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
            <form onSubmit={(e) => handleSubmit(e)} className="max-w-[1200px] mx-auto space-y-8 pb-20">
                {/* Header */}
                <div className="flex items-center justify-between pb-6">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/products" className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                        </Link>
                        <h1 className="text-2xl font-black text-white tracking-tight">Edit Product</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/5"
                            onClick={() => router.push("/admin/products")}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleDelete}
                            className="h-8 w-8 text-red-500/60 hover:text-red-500 hover:bg-red-500/10"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                            type="submit"
                            className="h-8 px-4 bg-[var(--sa-accent)] hover:bg-[var(--sa-accent-bright)] text-black font-black text-[10px] uppercase tracking-widest"
                            disabled={isSubmitting}
                        >
                            <Save className="w-3.5 h-3.5 mr-2" />
                            {isSubmitting ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* General Section */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-white/5">
                                <h2 className="text-sm font-bold text-white uppercase tracking-wider">General</h2>
                            </div>
                            <div className="p-4 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Name</label>
                                    <Input
                                        required
                                        placeholder="Product Name"
                                        className="bg-background/40 border-white/10 h-12"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                                        URL Path <span className="text-[10px] lowercase normal-case opacity-40 font-normal">(optional)</span>
                                    </label>
                                    <div className="flex items-center">
                                        <div className="h-12 px-4 bg-white/5 border border-r-0 border-white/10 rounded-l-lg flex items-center text-sm text-white/20">
                                            product-url-path
                                        </div>
                                        <Input
                                            placeholder="product-name"
                                            className="bg-background/40 border-white/10 h-12 rounded-l-none"
                                            value={formData.slug}
                                            onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Description</label>
                                    <Textarea
                                        placeholder="Describe your product..."
                                        className="bg-background/40 border-white/10 min-h-[150px] resize-none"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Image Section */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-white/5">
                                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Image</h2>
                            </div>
                            <div className="p-4 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div
                                        className="aspect-video bg-background/40 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3 group hover:border-brand-primary/20 transition-colors cursor-pointer relative overflow-hidden"
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
                                        {formData.image_url ? (
                                            <>
                                                <img src={formData.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <p className="text-white text-xs font-bold uppercase tracking-widest">Change Image</p>
                                                </div>
                                            </>
                                        ) : isUploading ? (
                                            <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
                                        ) : (
                                            <>
                                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-brand-primary/10 transition-colors">
                                                    <Plus className="w-6 h-6 text-white/20 group-hover:text-brand-primary transition-colors" />
                                                </div>
                                                <p className="text-xs text-white/20 group-hover:text-white/40 transition-colors uppercase font-bold tracking-widest">Upload Gallery</p>
                                            </>
                                        )}
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Or provide image URL</label>
                                        <Input
                                            placeholder="https://example.com/image.png"
                                            className="bg-background/40 border-white/10 h-12"
                                            value={formData.image_url}
                                            onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                        />
                                        <p className="text-[10px] text-white/20">Using a high-quality square or 16:9 image is recommended for best display in your store.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Instructions Section */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-white/5">
                                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Instructions</h2>
                                <p className="text-[9px] text-white/30 uppercase font-bold tracking-wider mt-0.5">Visible after purchase</p>
                            </div>
                            <div className="p-4">
                                <Textarea
                                    placeholder="Add instructions for your customers (e.g. how to redeem, support info)..."
                                    className="bg-background/40 border-white/10 min-h-[150px] resize-none"
                                    value={formData.instructions}
                                    onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Deliverables Type */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-white/5">
                                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Deliverables Type</h2>
                            </div>
                            <div className="p-4 space-y-4">
                                <div className="grid grid-cols-1 gap-4">
                                    {[
                                        { id: "serials", title: "Serials", desc: "Automatically delivers serial keys. Stock count is based on the number of entered serials.", icon: Layers },
                                        { id: "service", title: "Service", desc: "Automatically delivers ONLY instructions. Stock count is entered manually and can be infinite.", icon: Share2 },
                                        { id: "dynamic", title: "Dynamic", desc: "Automatically delivers content from a specified webhook URL. Stock count is entered manually and can be infinite.", icon: Activity }
                                    ].map((type) => (
                                        <div
                                            key={type.id}
                                            onClick={() => setFormData({ ...formData, delivery_type: type.id })}
                                            className={cn(
                                                "p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-4 group",
                                                formData.delivery_type === type.id
                                                    ? "bg-brand-primary/5 border-brand-primary"
                                                    : "bg-white/[0.02] border-white/5 hover:border-white/10"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                                                formData.delivery_type === type.id ? "bg-brand-primary/20" : "bg-white/5 group-hover:bg-white/10"
                                            )}>
                                                <type.icon className={cn("w-5 h-5", formData.delivery_type === type.id ? "text-brand-primary" : "text-white/20")} />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-sm font-bold text-white">{type.title}</h3>
                                                <p className="text-[11px] text-white/40">{type.desc}</p>
                                            </div>
                                            <div className={cn(
                                                "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                                formData.delivery_type === type.id ? "border-brand-primary" : "border-white/10"
                                            )}>
                                                {formData.delivery_type === type.id && <div className="w-2.5 h-2.5 rounded-full bg-brand-primary" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {formData.delivery_type === 'dynamic' && (
                                    <div className="space-y-4 pt-4 border-t border-white/5">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Webhook URL</label>
                                            <Input
                                                placeholder="https://your-api.com/callback"
                                                value={formData.webhook_url}
                                                onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                                                className="bg-background/40 border-white/10 h-12"
                                            />
                                            <p className="text-[10px] text-white/20">We will send a POST request to this URL when a purchase is made.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Custom Fields Section */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden shadow-xl">
                            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-white/40" />
                                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">Custom Fields</h2>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-[10px] font-bold text-brand-primary hover:bg-white/5 gap-2 uppercase tracking-widest"
                                    onClick={() => setFormData({
                                        ...formData,
                                        custom_fields: [...formData.custom_fields, { id: Math.random().toString(36).substr(2, 9), name: "", hint: "", default_value: "", required: false }]
                                    })}
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Add Field
                                </Button>
                            </div>
                            <div className="p-4 space-y-4">
                                {formData.custom_fields.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-white/5 rounded-xl">
                                        <FileText className="w-8 h-8 text-white/10 mb-2" />
                                        <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">No custom fields defined</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {formData.custom_fields.map((field, idx) => (
                                            <div key={field.id || idx} className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-4 group">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20 group-hover:text-white/40 transition-colors">
                                                            <Layers className="w-4 h-4" />
                                                        </div>
                                                        <Input
                                                            placeholder="Field Name (e.g. Invite)"
                                                            className="bg-transparent border-0 focus-visible:ring-0 h-8 text-sm font-bold text-white p-0 w-64"
                                                            value={field.name}
                                                            onChange={(e) => {
                                                                const newFields = [...formData.custom_fields]
                                                                newFields[idx].name = e.target.value
                                                                setFormData({ ...formData, custom_fields: newFields })
                                                            }}
                                                        />
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-white/10 hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                                                        onClick={() => {
                                                            const newFields = formData.custom_fields.filter((_, i) => i !== idx)
                                                            setFormData({ ...formData, custom_fields: newFields })
                                                        }}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-white/20 uppercase tracking-widest">Hint / Description</label>
                                                        <Input
                                                            placeholder="Help text for the field"
                                                            className="bg-background/40 border-white/10 h-10"
                                                            value={field.hint}
                                                            onChange={(e) => {
                                                                const newFields = [...formData.custom_fields]
                                                                newFields[idx].hint = e.target.value
                                                                setFormData({ ...formData, custom_fields: newFields })
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-white/20 uppercase tracking-widest">Default Value</label>
                                                        <Input
                                                            placeholder="Optional default value"
                                                            className="bg-background/40 border-white/10 h-10"
                                                            value={field.default_value}
                                                            onChange={(e) => {
                                                                const newFields = [...formData.custom_fields]
                                                                newFields[idx].default_value = e.target.value
                                                                setFormData({ ...formData, custom_fields: newFields })
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Required Field</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newFields = [...formData.custom_fields]
                                                                newFields[idx].required = !newFields[idx].required
                                                                setFormData({ ...formData, custom_fields: newFields })
                                                            }}
                                                            className={cn(
                                                                "w-9 h-5 rounded-full transition-colors relative flex items-center px-1",
                                                                field.required ? "bg-brand-primary" : "bg-white/10"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "w-3 h-3 bg-white rounded-full transition-all",
                                                                field.required ? "translate-x-4" : "translate-x-0"
                                                            )} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Variants Section */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-white/5">
                                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Options & Variants</h2>
                            </div>
                            <div className="p-4">
                                <VariantManager productId={id as string} deliveryType={formData.delivery_type} />
                            </div>
                        </div>

                        {/* Stock Management for Serials */}
                        {formData.delivery_type === 'serials' && (
                            <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                                <div className="px-4 py-3 border-b border-white/5">
                                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">Stock Management</h2>
                                </div>
                                <div className="p-4">
                                    <StockManager
                                        productId={id as string}
                                        onStockChange={(count) => setFormData(prev => ({ ...prev, stock_count: count }))}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Currency & Tax Section */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-white/5">
                                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Pricing</h2>
                            </div>
                            <div className="p-4 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Price</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            className="bg-background/40 border-white/10 h-12"
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Slashed <span className="text-[8px] opacity-40 lowercase normal-case">(optional)</span></label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            className="bg-background/40 border-white/10 h-10"
                                            value={formData.slashed_price}
                                            onChange={e => setFormData({ ...formData, slashed_price: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Currency</label>
                                    <div className="relative">
                                        <select
                                            className="w-full h-10 px-3 pr-10 rounded-lg bg-background/40 border border-white/10 text-sm text-white appearance-none focus:outline-none focus:border-brand-primary/50 transition-colors"
                                            value={formData.currency}
                                            onChange={e => setFormData({ ...formData, currency: e.target.value })}
                                        >
                                            <option value="USD">USD ($)</option>
                                            <option value="EUR">EUR (€)</option>
                                            <option value="GBP">GBP (£)</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Min Quantity <span className="text-[8px] opacity-40 lowercase normal-case">(optional)</span></label>
                                        <Input
                                            type="number"
                                            min="1"
                                            placeholder="1"
                                            className="bg-background/40 border-white/10 h-10"
                                            value={formData.min_quantity}
                                            onChange={e => setFormData({ ...formData, min_quantity: parseInt(e.target.value) || 1 })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Max Quantity <span className="text-[8px] opacity-40 lowercase normal-case">(optional)</span></label>
                                        <Input
                                            type="number"
                                            min="1"
                                            placeholder="10"
                                            className="bg-background/40 border-white/10 h-10"
                                            value={formData.max_quantity}
                                            onChange={e => setFormData({ ...formData, max_quantity: parseInt(e.target.value) || 1 })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Visibility & Group Section */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-white/5">
                                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Visibility & Group</h2>
                            </div>
                            <div className="p-4 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Visibility</label>
                                    <Select
                                        value={formData.is_active ? "public" : "hidden"}
                                        onValueChange={(val) => setFormData({ ...formData, is_active: val === "public" })}
                                    >
                                        <SelectTrigger className="w-full h-10 bg-background/40 border-white/10 rounded-xl px-4 text-sm text-white focus:ring-0 focus:ring-offset-0">
                                            <SelectValue placeholder="Select visibility" />
                                        </SelectTrigger>
                                        <SelectContent position="popper" className="bg-background border-white/10 text-white">
                                            <SelectItem value="public">Public</SelectItem>
                                            <SelectItem value="hidden">Hidden</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Group (Category)</label>
                                    <Select
                                        value={formData.category_id}
                                        onValueChange={(val) => setFormData({ ...formData, category_id: val })}
                                    >
                                        <SelectTrigger className="w-full h-10 bg-background/40 border-white/10 rounded-xl px-4 text-sm text-white focus:ring-0 focus:ring-offset-0">
                                            <SelectValue placeholder="Select..." />
                                        </SelectTrigger>
                                        <SelectContent position="popper" className="bg-background border-white/10 text-white">
                                            <SelectItem value="none">None</SelectItem>
                                            {categories.map(cat => (
                                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {formData.delivery_type !== 'serials' && (
                                    <div className="space-y-2 pt-4 border-t border-white/5">
                                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-1">Total Stock</label>
                                        <StockInput
                                            value={formData.stock_count}
                                            onChange={(val) => setFormData({ ...formData, stock_count: val })}
                                        />
                                        <p className="text-[9px] text-white/20">Enter -1 for unlimited stock</p>
                                    </div>
                                )}
                                {formData.delivery_type === 'serials' && (
                                    <div className="space-y-2 pt-4 border-t border-white/5">
                                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-1">Total Stock</label>
                                        <div className="h-12 px-4 bg-background/40 border border-white/10 rounded-lg flex items-center justify-between">
                                            <span className="text-lg font-bold text-brand-primary">{formData.stock_count}</span>
                                            <span className="text-[10px] text-white/30 uppercase tracking-widest">From Stock Manager</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Live Stats */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-white/5">
                                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Live Stats</h2>
                            </div>
                            <div className="p-4 space-y-3">
                                {[
                                    { id: "show_view_count", label: "Show Views Count", icon: Eye },
                                    { id: "show_sales_count", label: "Show Sales Count", icon: Monitor },
                                    { id: "show_sales_notifications", label: "Sales Notifications", icon: BellRing }
                                ].map(toggle => (
                                    <div key={toggle.id} className="flex items-center justify-between p-3 bg-background/20 border border-white/5 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <toggle.icon className="w-4 h-4 text-white/40" />
                                            <span className="text-[11px] text-white/60 font-bold uppercase tracking-wider">{toggle.label}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, [toggle.id]: !(formData as any)[toggle.id] })}
                                            className={cn(
                                                "w-10 h-6 rounded-full transition-colors relative flex items-center px-1",
                                                (formData as any)[toggle.id] ? "bg-brand-primary" : "bg-white/10"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-4 h-4 bg-white rounded-full transition-all",
                                                (formData as any)[toggle.id] ? "translate-x-4" : "translate-x-0"
                                            )} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Badges */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-white/5">
                                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Badges</h2>
                            </div>
                            <div className="p-4">
                                <BadgeManager
                                    productId={id as string}
                                    initialBadgeIds={(formData as any).badges || []}
                                />
                            </div>
                        </div>

                        {/* Status */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Status</h2>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                    className={cn(
                                        "w-10 h-6 rounded-full transition-colors relative flex items-center px-1",
                                        formData.is_active ? "bg-[var(--sa-accent)]" : "bg-white/10"
                                    )}
                                >
                                    <div className={cn(
                                        "w-4 h-4 bg-white rounded-full transition-all",
                                        formData.is_active ? "translate-x-4" : "translate-x-0"
                                    )} />
                                </button>
                            </div>
                            <div className="p-4 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Status Color</label>
                                    <div className="flex items-center gap-2">
                                        {['red', 'orange', 'yellow', 'green', 'blue'].map(color => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, status_color: color })}
                                                className={cn(
                                                    "w-7 h-7 rounded-full border-2 transition-all",
                                                    formData.status_color === color ? "border-white scale-110 shadow-lg shadow-white/10" : "border-transparent opacity-40 hover:opacity-100",
                                                    color === 'red' ? 'bg-[#ff4b4b]' :
                                                        color === 'orange' ? 'bg-[#ff8c00]' :
                                                            color === 'yellow' ? 'bg-[#ffcc00]' :
                                                                color === 'green' ? 'bg-[#00e676]' :
                                                                    'bg-[#00e5ff]'
                                                )}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Status Label</label>
                                    <Input
                                        className="bg-background/40 border-white/10 h-10"
                                        value={formData.status_label}
                                        onChange={e => setFormData({ ...formData, status_label: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/5 flex flex-col gap-2">
                            <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Danger Zone</span>
                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full text-red-500/40 hover:text-red-500 hover:bg-red-500/5 justify-start px-0"
                                onClick={handleDelete}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Product
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </AdminLayout >
    )
}
