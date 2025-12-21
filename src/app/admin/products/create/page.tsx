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
    Eye
} from "lucide-react"
import { createProduct, getCategories } from "@/lib/db/products"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function CreateProductPage() {
    const router = useRouter()
    const [categories, setCategories] = useState<any[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

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
        status_label: "In Stock!",
        status_color: "green",
        show_view_count: false,
        show_sales_count: true,
        show_sales_notifications: true,
        min_quantity: 1,
        max_quantity: 10
    })

    useEffect(() => {
        async function loadCategories() {
            try {
                const data = await getCategories()
                setCategories(data)
                if (data.length > 0) {
                    setFormData(prev => ({ ...prev, category_id: data[0].id }))
                }
            } catch (error) {
                toast.error("Failed to load categories")
            } finally {
                setIsLoading(false)
            }
        }
        loadCategories()
    }, [])

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

            await createProduct({
                ...formData,
                price: Number(formData.price),
                slashed_price: formData.slashed_price ? Number(formData.slashed_price) : undefined,
                stock_count: Number(formData.stock_count),
                min_quantity: Number(formData.min_quantity),
                max_quantity: Number(formData.max_quantity)
            })
            toast.success("Product created successfully")
            if (exitAfter) {
                router.push("/admin/products")
            } else {
                setFormData({
                    name: "",
                    slug: "",
                    description: "",
                    instructions: "",
                    price: 0,
                    slashed_price: 0,
                    currency: "USD",
                    category_id: categories[0]?.id || "",
                    stock_count: 0,
                    is_active: true,
                    image_url: "",
                    hide_stock: false,
                    delivery_type: "serials",
                    status_label: "In Stock!",
                    status_color: "green",
                    show_view_count: false,
                    show_sales_count: true,
                    show_sales_notifications: true,
                    min_quantity: 1,
                    max_quantity: 10
                })
            }
        } catch (error: any) {
            console.error("DEBUG: Create Product Error:", error)
            toast.error(error.message || "Failed to create product")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <AdminLayout>
            <form onSubmit={(e) => handleSubmit(e)} className="max-w-[1200px] mx-auto space-y-8 pb-20">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Link href="/admin/products" className="text-white/40 hover:text-white transition-colors">
                                <ChevronLeft className="w-4 h-4" />
                            </Link>
                            <h1 className="text-2xl font-bold text-white">Create Product</h1>
                        </div>
                        <p className="text-sm text-white/40">Fill in the details below to create a new product.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            className="text-white/40 hover:text-white hover:bg-white/5 gap-2"
                            onClick={() => router.push("/admin/products")}
                        >
                            <X className="w-4 h-4" />
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="border-white/10 bg-white/5 hover:bg-white/10 text-white gap-2"
                            onClick={(e) => handleSubmit(e as any, true)}
                            disabled={isSubmitting}
                        >
                            <Save className="w-4 h-4" />
                            Create & Exit
                        </Button>
                        <Button
                            type="submit"
                            className="bg-brand-primary text-white font-bold hover:opacity-90 transition-opacity gap-2 min-w-[100px]"
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
                                        className="bg-black/40 border-white/10 h-12"
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
                                            className="bg-black/40 border-white/10 h-12 rounded-l-none"
                                            value={formData.slug}
                                            onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Description</label>
                                    <div className="bg-black/40 border border-white/10 rounded-xl overflow-hidden min-h-[250px] flex flex-col">
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
                                    <div className="aspect-video bg-black/40 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3 group hover:border-brand-primary/20 transition-colors cursor-pointer relative overflow-hidden">
                                        {formData.image_url ? (
                                            <img src={formData.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
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
                                            className="bg-black/40 border-white/10 h-12"
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
                                <div className="bg-black/40 border border-white/10 rounded-xl overflow-hidden min-h-[250px] flex flex-col">
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

                        {/* Deliverables Type */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                            <div className="p-6 border-b border-white/5 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                                    <Zap className="w-5 h-5 text-green-500" />
                                </div>
                                <h2 className="text-lg font-bold text-white">Deliverables Type</h2>
                            </div>
                            <div className="p-6 space-y-4">
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
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-8">
                        {/* Currency & Tax Section */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                            <div className="p-6 border-b border-white/5 flex items-center gap-3">
                                <DollarSign className="w-5 h-5 text-white/40" />
                                <h2 className="text-sm font-bold text-white uppercase tracking-widest">Currency & Tax</h2>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Price</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            className="bg-black/40 border-white/10 h-10"
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
                                            className="bg-black/40 border-white/10 h-10"
                                            value={formData.slashed_price}
                                            onChange={e => setFormData({ ...formData, slashed_price: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Currency</label>
                                    <div className="relative">
                                        <select
                                            className="w-full h-10 px-3 pr-10 rounded-lg bg-black/40 border border-white/10 text-sm text-white appearance-none focus:outline-none focus:border-brand-primary/50 transition-colors"
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
                                <h2 className="text-sm font-bold text-white uppercase tracking-widest">Visibility & Group</h2>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Visibility</label>
                                    <div className="relative">
                                        <select
                                            className="w-full h-10 px-3 pr-10 rounded-lg bg-black/40 border border-white/10 text-sm text-white appearance-none focus:outline-none focus:border-brand-primary/50 transition-colors"
                                            value={formData.is_active ? "public" : "hidden"}
                                            onChange={e => setFormData({ ...formData, is_active: e.target.value === "public" })}
                                        >
                                            <option value="public">Public</option>
                                            <option value="hidden">Hidden</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Group (Category)</label>
                                    <div className="relative">
                                        <select
                                            className="w-full h-10 px-3 pr-10 rounded-lg bg-black/40 border border-white/10 text-sm text-white appearance-none focus:outline-none focus:border-brand-primary/50 transition-colors"
                                            value={formData.category_id}
                                            onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                                        >
                                            <option value="">Select...</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-2 pt-4 border-t border-white/5">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-4">Stock Count Visibility</label>
                                    <div className="flex items-center justify-between p-3 bg-black/20 border border-white/5 rounded-xl">
                                        <span className="text-xs text-white/60">Hide Stock Count</span>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, hide_stock: !formData.hide_stock })}
                                            className={cn(
                                                "w-10 h-6 rounded-full transition-colors relative flex items-center px-1",
                                                formData.hide_stock ? "bg-brand-primary" : "bg-white/10"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-4 h-4 bg-white rounded-full transition-all",
                                                formData.hide_stock ? "translate-x-4" : "translate-x-0"
                                            )} />
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-white/20 mt-2">
                                        If hidden, customers will see "In Stock" instead of "X In Stock".
                                    </p>
                                </div>
                                <div className="space-y-2 pt-4 border-t border-white/5">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-1">Total Stock</label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        className="bg-black/40 border-white/10 h-10"
                                        value={formData.stock_count}
                                        onChange={e => setFormData({ ...formData, stock_count: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Live Stats */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                            <div className="p-6 border-b border-white/5 flex items-center gap-3">
                                <Activity className="w-5 h-5 text-white/40" />
                                <h2 className="text-sm font-bold text-white uppercase tracking-widest">Live Stats</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                {[
                                    { id: "show_view_count", label: "Show Views Count", icon: Eye },
                                    { id: "show_sales_count", label: "Show Sales Count", icon: Monitor },
                                    { id: "show_sales_notifications", label: "Sales Notifications", icon: BellRing }
                                ].map(toggle => (
                                    <div key={toggle.id} className="flex items-center justify-between p-3 bg-black/20 border border-white/5 rounded-xl">
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
                                {[
                                    { label: "BEST SELLER", icon: Zap },
                                    { label: "ULTRA HQ", icon: ShieldCheck },
                                    { label: "VERIFIED", icon: Award },
                                    { label: "TRENDING NOW", icon: Activity }
                                ].map((badge, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl group hover:bg-white/10 transition-colors cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <badge.icon className="w-4 h-4 text-white/20 group-hover:text-white/40" />
                                            <span className="text-[11px] text-white/60 font-black uppercase tracking-widest">{badge.label}</span>
                                        </div>
                                        <ChevronDown className="w-4 h-4 text-white/20 group-hover:text-white/40" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Status */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Activity className="w-5 h-5 text-white/40" />
                                    <h2 className="text-sm font-bold text-white uppercase tracking-widest">Status</h2>
                                </div>
                                <button type="button" className="w-10 h-6 bg-brand-primary rounded-full relative flex items-center px-1">
                                    <div className="w-4 h-4 bg-white rounded-full translate-x-4" />
                                </button>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Status Color</label>
                                    <div className="flex items-center gap-2">
                                        {['red', 'orange', 'yellow', 'green', 'blue'].map(color => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, status_color: color })}
                                                className={cn(
                                                    "w-6 h-6 rounded-full border-2 transition-all",
                                                    formData.status_color === color ? "border-white scale-110 shadow-lg" : "border-transparent opacity-40 hover:opacity-100",
                                                    `bg-${color === 'red' ? 'red-500' : color === 'orange' ? 'orange-500' : color === 'yellow' ? 'yellow-500' : color === 'green' ? 'green-500' : 'brand-primary'}`
                                                )}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Status Label</label>
                                    <Input
                                        className="bg-black/40 border-white/10 h-10"
                                        value={formData.status_label}
                                        onChange={e => setFormData({ ...formData, status_label: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </AdminLayout>
    )
}
