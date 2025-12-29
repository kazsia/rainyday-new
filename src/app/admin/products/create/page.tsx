"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
    Loader2,
    Trash2,
    TextCursorInput,
    Search,
    ChevronRight,
    Minus,
    ExternalLink,
    Lock,
    Shuffle,
    Timer,
    CreditCard,
    Ban,
    Package
} from "lucide-react"
import { createProduct, getCategories } from "@/lib/db/products"
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
import Link from "next/link"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export default function CreateProductPage() {
    const router = useRouter()
    const [categories, setCategories] = useState<any[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isUploading, setIsUploading] = useState(false)
    const [isCustomFieldDialogOpen, setIsCustomFieldDialogOpen] = useState(false)
    const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null)
    const [fieldData, setFieldData] = useState({ name: "", placeholder: "", required: false })


    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        instructions: "",
        price: 0,
        slashed_price: 0,
        currency: "USD",
        category_id: "none",
        stock_count: 0,
        is_active: true,
        visibility: "public",
        image_url: "",
        hide_stock: false,
        delivery_type: "serials", // serials, service, dynamic
        webhook_url: "",
        status_label: "",
        status_color: "",
        show_view_count: false,
        show_sales_count: true,
        show_sales_notifications: true,

        custom_fields: [] as any[],
        deliverable_selection_method: 'last', // 'last', 'first', 'random'
        is_unlimited: false,
    })

    useEffect(() => {
        async function loadCategories() {
            try {
                const data = await getCategories()
                setCategories(data)
                if (data.length > 0) {
                    setFormData(prev => ({ ...prev, category_id: data[0].id }))
                } else {
                    setFormData(prev => ({ ...prev, category_id: "none" }))
                }
            } catch (error) {
                toast.error("Failed to load categories")
            } finally {
                setIsLoading(false)
            }
        }
        loadCategories()
    }, [])

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

    async function handleSubmit(e: React.FormEvent, exitAfter = true) {
        e.preventDefault()
        if (isSubmitting) return

        setIsSubmitting(true)
        try {
            // Safety check for price
            if (isNaN(formData.price)) {
                toast.error("Invalid price")
                setIsSubmitting(false)
                return
            }

            // 1. Create the product first
            const product = await createProduct({
                ...formData,
                price: Number(formData.price),
                slashed_price: formData.slashed_price ? Number(formData.slashed_price) : undefined,
                stock_count: Number(formData.stock_count) || 0,
                is_unlimited: !!formData.is_unlimited,
                category_id: (formData.category_id === "none" || formData.category_id === "") ? null : formData.category_id,
            })

            toast.success("Product created successfully")
            if (exitAfter) {
                router.push("/admin/products")
            } else {
                // Reset form
                setFormData({
                    name: "",
                    slug: "",
                    description: "",
                    instructions: "",
                    price: 0,
                    slashed_price: 0,
                    currency: "USD",
                    category_id: categories[0]?.id || "none",
                    stock_count: 0,
                    is_active: true,
                    visibility: "public",
                    image_url: "",
                    hide_stock: false,
                    delivery_type: "serials",
                    webhook_url: "",
                    status_label: "",
                    status_color: "",
                    show_view_count: false,
                    show_sales_count: true,
                    show_sales_notifications: true,
                    custom_fields: [],
                    deliverable_selection_method: 'last',
                    is_unlimited: false,
                })
            }
        } catch (error) {
            console.error("Create product error:", error)
            toast.error("Failed to create product")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <AdminLayout>
            <>
                <form onSubmit={(e) => handleSubmit(e)} className="max-w-[1200px] mx-auto space-y-8 pb-20">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Link href="/admin/products" className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                                    <ChevronLeft className="w-4 h-4" />
                                </Link>
                                <h1 className="text-2xl font-bold text-white tracking-tight">Create Product</h1>
                            </div>
                            <p className="text-sm text-white/40">Configure your new product listing</p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <Button
                                type="button"
                                variant="ghost"
                                className="flex-1 sm:flex-none h-11 sm:h-9 text-[10px] font-bold text-white/40 hover:text-white hover:bg-white/5 gap-2 uppercase tracking-widest"
                                onClick={() => router.push("/admin/products")}
                            >
                                <X className="w-4 h-4" />
                                <span className="sm:inline">Cancel</span>
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1 sm:flex-none h-11 sm:h-9 border-white/10 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold gap-2 uppercase tracking-widest"
                                onClick={(e) => handleSubmit(e as any, true)}
                                disabled={isSubmitting}
                            >
                                <Save className="w-4 h-4" />
                                <span className="hidden sm:inline">Save & Exit</span>
                                <span className="sm:hidden">Exit</span>
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 sm:flex-none h-11 sm:h-9 bg-brand text-black font-black hover:opacity-90 transition-opacity gap-2 min-w-[100px] text-[10px] uppercase tracking-widest border-none"
                                disabled={isSubmitting}
                            >
                                <Plus className="w-4 h-4" />
                                {isSubmitting ? "Creating..." : "Create"}
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* General Section */}
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                                <div className="p-6 border-b border-white/5 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                                        <Layout className="w-5 h-5 text-brand-primary" />
                                    </div>
                                    <h2 className="text-lg font-bold text-white">General</h2>
                                </div>
                                <div className="p-6 space-y-6">
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
                                        <div className="bg-background/40 border border-white/10 rounded-xl overflow-hidden min-h-[250px] flex flex-col">
                                            <div className="p-2 border-b border-white/5 bg-white/[0.02] flex items-center gap-1 flex-wrap">
                                                <Button type="button" variant="ghost" size="icon" className="w-8 h-8 text-white/40 hover:text-white hover:bg-white/5"><History className="w-4 h-4" /></Button>
                                                <div className="w-px h-4 bg-white/10 mx-1" />
                                                <Button type="button" variant="ghost" size="icon" className="w-8 h-8 text-white/40 hover:text-white hover:bg-white/5"><b>B</b></Button>
                                                <Button type="button" variant="ghost" size="icon" className="w-8 h-8 text-white/40 hover:text-white hover:bg-white/5"><i>I</i></Button>
                                                <Button type="button" variant="ghost" size="icon" className="w-8 h-8 text-white/40 hover:text-white hover:bg-white/5"><u>U</u></Button>
                                                <Button type="button" variant="ghost" size="icon" className="w-8 h-8 text-white/40 hover:text-white hover:bg-white/5"><Layers className="w-4 h-4" /></Button>
                                                <div className="w-px h-4 bg-white/10 mx-1" />
                                                <Button type="button" variant="ghost" className="h-8 px-2 text-[10px] font-bold text-white/40 hover:text-white hover:bg-white/5 gap-1 uppercase tracking-widest">
                                                    Normal
                                                    <ChevronDown className="w-3 h-3" />
                                                </Button>
                                            </div>
                                            <Textarea
                                                placeholder="Describe your product..."
                                                className="flex-1 bg-transparent border-0 focus-visible:ring-0 resize-none p-4 min-h-[200px]"
                                                value={formData.description}
                                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Image Section */}
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                                <div className="p-6 border-b border-white/5 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                        <ImageIcon className="w-5 h-5 text-orange-500" />
                                    </div>
                                    <h2 className="text-lg font-bold text-white">Image</h2>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                                <div className="p-6 border-b border-white/5 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-purple-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">Instructions</h2>
                                        <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Visible after purchase</p>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="bg-background/40 border border-white/10 rounded-xl overflow-hidden min-h-[250px] flex flex-col">
                                        <div className="p-2 border-b border-white/5 bg-white/[0.02] flex items-center gap-1 flex-wrap">
                                            <Button type="button" variant="ghost" size="icon" className="w-8 h-8 text-white/40 hover:text-white hover:bg-white/5"><History className="w-4 h-4" /></Button>
                                            <div className="w-px h-4 bg-white/10 mx-1" />
                                            <Button type="button" variant="ghost" size="icon" className="w-8 h-8 text-white/40 hover:text-white hover:bg-white/5"><b>B</b></Button>
                                            <Button type="button" variant="ghost" size="icon" className="w-8 h-8 text-white/40 hover:text-white hover:bg-white/5"><i>I</i></Button>
                                            <Button type="button" variant="ghost" size="icon" className="w-8 h-8 text-white/40 hover:text-white hover:bg-white/5"><u>U</u></Button>
                                        </div>
                                        <Textarea
                                            placeholder="Add instructions for your customers (e.g. how to redeem, support info)..."
                                            className="flex-1 bg-transparent border-0 focus-visible:ring-0 resize-none p-4 min-h-[200px]"
                                            value={formData.instructions}
                                            onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>


                            {/* Custom Fields */}
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                                <div className="px-5 py-4 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center">
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
                                        className="h-9 px-4 bg-transparent border-[#6366f1]/20 hover:border-[#6366f1]/40 hover:bg-[#6366f1]/5 text-[#6366f1] hover:text-[#818cf8] font-bold text-[10px] uppercase tracking-[0.1em] rounded-lg transition-all"
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
                                                <div key={field.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl group hover:border-[#6366f1]/30 transition-all">
                                                    <div
                                                        className="flex items-center gap-4 cursor-pointer flex-1"
                                                        onClick={() => {
                                                            setFieldData({ name: field.name, placeholder: field.placeholder, required: field.required })
                                                            setEditingFieldIndex(idx)
                                                            setIsCustomFieldDialogOpen(true)
                                                        }}
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-[#0a0c14] border border-white/5 flex items-center justify-center group-hover:text-[#6366f1] transition-colors">
                                                            <span className="text-[10px] font-black text-white/40 group-hover:text-[#6366f1]">{idx + 1}</span>
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <h3 className="text-[13px] font-bold text-white group-hover:text-[#6366f1] transition-colors">{field.name}</h3>
                                                            {field.placeholder && <p className="text-[11px] text-white/40">{field.placeholder}</p>}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        {field.required && (
                                                            <div className="px-2 py-0.5 rounded-md bg-[#6366f1]/10 border border-[#6366f1]/20">
                                                                <span className="text-[9px] font-bold text-[#6366f1] uppercase tracking-wider">Required</span>
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

                            {/* Deliverables Type */}
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                                <div className="p-6 border-b border-white/5 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                                        <Zap className="w-5 h-5 text-green-500" />
                                    </div>
                                    <h2 className="text-lg font-bold text-white">Deliverables Type</h2>
                                </div>
                                <div className="p-6 space-y-6">
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

                                    {formData.delivery_type === 'serials' && (
                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <div className="space-y-3">
                                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Deliverable Selection Method</label>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {[
                                                        { id: "last", title: "Last (LIFO)", desc: "The last item added will be delivered first.", icon: History },
                                                        { id: "first", title: "First (FIFO)", desc: "The first item added will be delivered first.", icon: Timer },
                                                        { id: "random", title: "Random", desc: "A random item will be delivered.", icon: Shuffle }
                                                    ].map((method) => (
                                                        <div
                                                            key={method.id}
                                                            onClick={() => setFormData({ ...formData, deliverable_selection_method: method.id })}
                                                            className={cn(
                                                                "p-3 rounded-lg border transition-all cursor-pointer flex items-center gap-3",
                                                                formData.deliverable_selection_method === method.id
                                                                    ? "bg-brand-primary/10 border-brand-primary/50 text-brand-primary"
                                                                    : "bg-white/5 border-white/5 text-white/40 hover:border-white/10"
                                                            )}
                                                        >
                                                            <method.icon className="w-4 h-4" />
                                                            <div className="flex-1">
                                                                <div className="text-xs font-bold">{method.title}</div>
                                                                <div className="text-[10px] opacity-60">{method.desc}</div>
                                                            </div>
                                                            <div className={cn(
                                                                "w-4 h-4 rounded-full border flex items-center justify-center",
                                                                formData.deliverable_selection_method === method.id ? "border-brand-primary" : "border-white/10"
                                                            )}>
                                                                {formData.deliverable_selection_method === method.id && <div className="w-2 h-2 rounded-full bg-brand-primary" />}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>




                            {/* Variants & Stock Section - Managed After Save */}
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                                <div className="p-6 border-b border-white/5 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                        <Layers className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-white uppercase tracking-widest">Variants & Stock</h2>
                                        <p className="text-[10px] text-white/30 mt-0.5">Create product options and manage stock</p>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="p-8 text-center border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                                        <Layers className="w-10 h-10 text-white/10 mx-auto mb-4" />
                                        <h3 className="text-sm font-bold text-white/60 mb-2">Manage After Saving</h3>
                                        <p className="text-xs text-white/40 max-w-sm mx-auto">
                                            Save your product first, then you can add variants, configure options, and manage stock from the Edit page.
                                        </p>
                                    </div>
                                </div>
                            </div>


                        </div>

                        {/* Sidebar */}
                        <div className="space-y-8">
                            {/* Stock & Delivery Section */}
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                                <div className="p-6 border-b border-white/5 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                        <Package className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <h2 className="text-sm font-bold text-white uppercase tracking-widest">Stock & Delivery</h2>
                                </div>
                                <div className="p-6 space-y-6">
                                    {/* Product-level stock */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Stock Status</label>
                                                <p className="text-[10px] text-white/20 font-bold leading-relaxed">
                                                    {formData.delivery_type === 'serials'
                                                        ? "Add your serial keys or licenses below (one per line)"
                                                        : "Choose if this product has unlimited stock."}
                                                </p>
                                            </div>
                                            {formData.delivery_type !== 'serials' && (
                                                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
                                                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Unlimited</span>
                                                    <Switch
                                                        checked={formData.is_unlimited}
                                                        onCheckedChange={(checked) => setFormData({ ...formData, is_unlimited: checked })}
                                                        className="data-[state=checked]:bg-brand-primary"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Serials: Stock managed after save */}
                                        {formData.delivery_type === 'serials' && (
                                            <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3">
                                                <Package className="w-4 h-4 text-white/40" />
                                                <span className="text-sm text-white/60">Stock keys are managed via the Edit page after saving the product.</span>
                                            </div>
                                        )}

                                        {/* Dynamic/Service: Stock count */}
                                        {formData.delivery_type !== 'serials' && !formData.is_unlimited && (
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Stock Count</label>
                                                <Input
                                                    type="number"
                                                    className="bg-background/40 border-white/10 h-11 text-sm font-medium focus-visible:border-brand-primary/50 focus-visible:ring-0 transition-all rounded-xl px-4"
                                                    value={formData.stock_count}
                                                    onChange={e => setFormData({ ...formData, stock_count: parseInt(e.target.value) || 0 })}
                                                    placeholder="0"
                                                />
                                            </div>
                                        )}

                                        {formData.is_unlimited && formData.delivery_type !== 'serials' && (
                                            <div className="p-4 bg-brand-primary/5 border border-brand-primary/20 rounded-xl flex items-center gap-3">
                                                <Zap className="w-4 h-4 text-brand-primary animate-pulse" />
                                                <span className="text-sm font-bold text-brand-primary">Unlimited Stock Enabled</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Currency & Tax Section */}
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                                <div className="p-6 border-b border-white/5 flex items-center gap-3">
                                    <DollarSign className="w-5 h-5 text-white/40" />
                                    <h2 className="text-sm font-bold text-white uppercase tracking-widest">Currency & Tax</h2>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="space-y-3">
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

                                </div>
                            </div>

                            {/* Visibility & Group Section */}
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                                <div className="p-6 border-b border-white/5 flex items-center gap-3">
                                    <Eye className="w-5 h-5 text-white/40" />
                                    <h1 className="text-sm font-bold text-white uppercase tracking-widest">Visibility & Group</h1>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Visibility</label>
                                        <Select
                                            value={formData.visibility}
                                            onValueChange={(val) => setFormData({ ...formData, visibility: val })}
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

                                </div>
                            </div>


                            {/* Badges */}
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Award className="w-5 h-5 text-white/40" />
                                        <h2 className="text-sm font-bold text-white uppercase tracking-widest">Badges</h2>
                                    </div>
                                    <Button type="button" variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-brand-primary hover:bg-brand-primary/10 gap-1.5">
                                        <Plus className="w-3 h-3" />
                                        ADD BADGE
                                    </Button>
                                </div>
                                <div className="p-6 space-y-3">
                                    <div className="p-8 text-center border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                                        <Award className="w-10 h-10 text-white/10 mx-auto mb-4" />
                                        <h3 className="text-sm font-bold text-white/60 mb-2">Manage After Saving</h3>
                                        <p className="text-xs text-white/40 max-w-sm mx-auto">
                                            Save your product first, then you can add badges from the Edit page.
                                        </p>
                                    </div>
                                </div>
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
                                    className="bg-[#0f111a] border-white/5 h-11 focus-visible:ring-[#6366f1]/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Placeholder / Hint</Label>
                                <Input
                                    value={fieldData.placeholder}
                                    onChange={(e) => setFieldData({ ...fieldData, placeholder: e.target.value })}
                                    placeholder="Instruction for customer"
                                    className="bg-[#0f111a] border-white/5 h-11 focus-visible:ring-[#6366f1]/50"
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
            </>
        </AdminLayout>
    )
}
