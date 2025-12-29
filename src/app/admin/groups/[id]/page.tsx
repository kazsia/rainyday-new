"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Plus,
    X,
    Save,
    Layout,
    ImageIcon,
    Loader2,
    ChevronLeft,
    Check,
    Search,
    Trash2,
    Eye,
    Award
} from "lucide-react"
import {
    getCategory,
    updateCategory,
    getProducts,
    updateCategoryProducts
} from "@/lib/db/products"
import { uploadAsset } from "@/lib/db/settings"
import { toast } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import Link from "next/link"

export default function EditGroupPage() {
    const router = useRouter()
    const params = useParams()
    const id = params.id as string

    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

    // Data
    const [category, setCategory] = useState<any>(null)
    const [allProducts, setAllProducts] = useState<any[]>([])

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        image_url: "",
        is_active: true,
        badge_text: "",
        badge_bg_color: "",
        product_ids: [] as string[]
    })

    // Product Selection Dialog
    const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
    const [productSearch, setProductSearch] = useState("")

    useEffect(() => {
        loadData()
    }, [id])

    async function loadData() {
        setIsLoading(true)
        try {
            const [catData, productsData] = await Promise.all([
                getCategory(id),
                getProducts({ activeOnly: false })
            ])

            if (!catData) {
                toast.error("Group not found")
                router.push("/admin/groups")
                return
            }

            setCategory(catData)
            setAllProducts(productsData)

            // Find products currently in this category
            const currentProductIds = productsData
                .filter((p: any) => p.category_id === id)
                .map((p: any) => p.id)

            setFormData({
                name: catData.name || "",
                slug: catData.slug || "",
                description: catData.description || "",
                image_url: catData.image_url || "",
                is_active: catData.is_active !== false, // Default to true if undefined
                badge_text: catData.badge_text || "",
                badge_bg_color: catData.badge_bg_color || "",
                product_ids: currentProductIds
            })
        } catch (error) {
            toast.error("Failed to load data")
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    async function handleUpload(file: File) {
        setIsUploading(true)
        try {
            const url = await uploadAsset(file)
            if (url) {
                setFormData(prev => ({ ...prev, image_url: url }))
                toast.success("Image uploaded")
            } else {
                toast.error("Failed to upload image")
            }
        } catch (error) {
            toast.error("Error uploading image")
        } finally {
            setIsUploading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (isSubmitting) return

        setIsSubmitting(true)
        try {
            // Update Category Details
            await updateCategory(id, {
                name: formData.name,
                slug: formData.name.toLowerCase().replace(/ /g, '-'),
                description: formData.description || null,
                image_url: formData.image_url || null,
                is_active: formData.is_active,
                badge_text: formData.badge_text || null,
                badge_bg_color: formData.badge_bg_color || null
            })

            // Update Products
            await updateCategoryProducts(id, formData.product_ids)

            toast.success("Group saved successfully")
            router.push("/admin/groups")
        } catch (error) {
            toast.error("Failed to save group")
            console.error(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const filteredProductsForDialog = allProducts.filter(p =>
        (p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
            p.id.toLowerCase().includes(productSearch.toLowerCase())) &&
        !formData.product_ids.includes(p.id)
    )

    const selectedProductsList = allProducts.filter(p => formData.product_ids.includes(p.id))

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-[50vh]">
                    <Loader2 className="w-8 h-8 animate-spin text-[var(--sa-accent)]" />
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout>
            <form onSubmit={handleSubmit} className="max-w-[1000px] mx-auto space-y-8 pb-20">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Link href="/admin/groups" className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                                <ChevronLeft className="w-4 h-4" />
                            </Link>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Edit Group</h1>
                        </div>
                        <p className="text-sm text-white/40">Manage group details and products.</p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            className="flex-1 sm:flex-none h-9 text-[10px] font-bold text-white/40 hover:text-white hover:bg-white/5 gap-2 uppercase tracking-widest"
                            onClick={() => router.push("/admin/groups")}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 sm:flex-none h-9 bg-[var(--sa-accent)] hover:bg-[var(--sa-accent-bright)] text-black font-black transition-opacity gap-2 min-w-[100px] text-[10px] uppercase tracking-widest border-none"
                            disabled={isSubmitting}
                        >
                            <Save className="w-4 h-4" />
                            {isSubmitting ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="general" className="w-full space-y-6">
                    <TabsList className="bg-black/20 border border-[var(--sa-border)] p-1 h-auto rounded-xl">
                        <TabsTrigger value="general" className="data-[state=active]:bg-[var(--sa-accent)] data-[state=active]:text-black text-[var(--sa-fg-muted)] uppercase tracking-widest text-[10px] font-bold h-8 px-4 rounded-lg">
                            <Layout className="w-3.5 h-3.5 mr-2" />
                            General
                        </TabsTrigger>
                        <TabsTrigger value="products" className="data-[state=active]:bg-[var(--sa-accent)] data-[state=active]:text-black text-[var(--sa-fg-muted)] uppercase tracking-widest text-[10px] font-bold h-8 px-4 rounded-lg">
                            <Search className="w-3.5 h-3.5 mr-2" />
                            Products
                        </TabsTrigger>
                    </TabsList>

                    {/* General Tab */}
                    <TabsContent value="general" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                        <div className="bg-[var(--sa-card)] border border-[var(--sa-border)] rounded-2xl overflow-hidden p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Name</label>
                                <Input
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="bg-black/20 border-white/10 h-11 text-white"
                                    placeholder="Group Name"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Description</label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="bg-black/20 border-white/10 text-white min-h-[80px] resize-none"
                                    placeholder="Brief description of this category (shown on category cards)"
                                />
                                <p className="text-[10px] text-[var(--sa-fg-dim)]">This text will appear on the category card in the store.</p>
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Image</label>
                                <div className="flex gap-6">
                                    <div
                                        onClick={() => document.getElementById('group-image-upload')?.click()}
                                        className="w-40 h-24 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-[var(--sa-accent)] hover:bg-[var(--sa-accent)]/5 transition-all group relative overflow-hidden bg-black/20"
                                    >
                                        <input
                                            type="file"
                                            id="group-image-upload"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0]
                                                if (file) handleUpload(file)
                                            }}
                                        />
                                        {formData.image_url ? (
                                            <>
                                                <img src={formData.image_url} className="absolute inset-0 w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <p className="text-[10px] font-bold text-white uppercase tracking-widest">Change</p>
                                                </div>
                                            </>
                                        ) : isUploading ? (
                                            <Loader2 className="w-6 h-6 animate-spin text-[var(--sa-accent)]" />
                                        ) : (
                                            <>
                                                <ImageIcon className="w-6 h-6 text-white/20 group-hover:text-[var(--sa-accent)] transition-colors mb-2" />
                                                <span className="text-[9px] font-bold text-[var(--sa-fg-dim)] uppercase tracking-widest">Upload</span>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Or Image URL</label>
                                        <Input
                                            value={formData.image_url}
                                            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                            className="bg-black/20 border-white/10 h-10 text-[11px] text-white"
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Visibility</label>
                                <Select
                                    value={formData.is_active ? "public" : "hidden"}
                                    onValueChange={(val) => setFormData({ ...formData, is_active: val === "public" })}
                                >
                                    <SelectTrigger className="w-full h-11 bg-black/20 border-white/10 rounded-xl px-4 text-sm text-white">
                                        <SelectValue placeholder="Select visibility" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[var(--sa-card)] border-white/10 text-white">
                                        <SelectItem value="public">Public</SelectItem>
                                        <SelectItem value="hidden">Hidden</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Badge Section */}
                        <div className="bg-[var(--sa-card)] border border-[var(--sa-border)] rounded-2xl overflow-hidden">
                            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-[var(--sa-accent)]/10 flex items-center justify-center">
                                        <Award className="w-4 h-4 text-[var(--sa-accent)]" />
                                    </div>
                                    <h2 className="text-sm font-bold text-white uppercase tracking-widest">Badge (Optional)</h2>
                                </div>
                            </div>
                            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Badge Text</label>
                                    <Input
                                        value={formData.badge_text}
                                        onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                                        className="bg-black/20 border-white/10 h-10 text-white"
                                        placeholder="e.g. NEW!"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Background Color</label>
                                    <div className="flex gap-2">
                                        <div className="h-10 w-10 rounded-lg border border-white/10" style={{ backgroundColor: formData.badge_bg_color || 'transparent' }} />
                                        <Input
                                            value={formData.badge_bg_color}
                                            onChange={(e) => setFormData({ ...formData, badge_bg_color: e.target.value })}
                                            className="bg-black/20 border-white/10 h-10 text-white flex-1"
                                            placeholder="#FF0000 or red"
                                        />
                                    </div>
                                    <p className="text-[10px] text-[var(--sa-fg-dim)]">Leave empty for default theme color.</p>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Products Tab */}
                    <TabsContent value="products" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                        <div className="bg-[var(--sa-card)] border border-[var(--sa-border)] rounded-2xl overflow-hidden">
                            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-sm font-bold text-white uppercase tracking-widest">Products</h2>
                                    <span className="bg-white/10 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{formData.product_ids.length}</span>
                                </div>
                                <Button
                                    type="button"
                                    onClick={() => setIsProductDialogOpen(true)}
                                    size="sm"
                                    className="h-8 text-[10px] font-bold bg-[var(--sa-accent)] hover:bg-[var(--sa-accent-bright)] text-black uppercase tracking-widest"
                                >
                                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                                    Add Products
                                </Button>
                            </div>

                            <div className="p-2">
                                {selectedProductsList.length === 0 ? (
                                    <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                                        <Search className="w-8 h-8 mb-2" />
                                        <p className="text-sm font-bold uppercase tracking-widest">No products in this group</p>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {selectedProductsList.map(product => (
                                            <div key={product.id} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5 group hover:border-white/10 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                                        <Search className="w-4 h-4 text-white/20" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xs font-bold text-white">{product.name}</h3>
                                                        <p className="text-[10px] text-[var(--sa-fg-dim)] font-mono">{product.id.substring(0, 8)}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setFormData(prev => ({
                                                        ...prev,
                                                        product_ids: prev.product_ids.filter(id => id !== product.id)
                                                    }))}
                                                    className="h-8 w-8 text-white/20 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Add Product Dialog */}
                <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                    <DialogContent className="bg-[var(--sa-card)] border-[var(--sa-border)] text-white sm:max-w-[500px] h-[500px] flex flex-col p-0 gap-0">
                        <DialogHeader className="p-4 border-b border-white/5">
                            <DialogTitle className="text-sm font-bold uppercase tracking-widest">Add Products</DialogTitle>
                        </DialogHeader>

                        <div className="p-4 border-b border-white/5">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--sa-fg-dim)]" />
                                <Input
                                    placeholder="Search products..."
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                    className="pl-9 bg-black/20 border-white/10 h-10 text-[12px] text-white"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                            {filteredProductsForDialog.length === 0 ? (
                                <p className="text-center py-8 text-[11px] text-[var(--sa-fg-dim)] font-bold uppercase tracking-widest">No matching products found</p>
                            ) : (
                                filteredProductsForDialog.map(product => (
                                    <div
                                        key={product.id}
                                        onClick={() => setFormData(prev => ({
                                            ...prev,
                                            product_ids: [...prev.product_ids, product.id]
                                        }))}
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group"
                                    >
                                        <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center group-hover:bg-[var(--sa-accent)]/10 group-hover:text-[var(--sa-accent)] transition-colors">
                                            <Plus className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-bold text-white">{product.name}</h3>
                                            <p className="text-[10px] text-[var(--sa-fg-dim)]">${product.price}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-3 border-t border-white/5 bg-black/20">
                            <Button
                                onClick={() => setIsProductDialogOpen(false)}
                                className="w-full bg-[var(--sa-accent)] hover:bg-[var(--sa-accent-bright)] text-black font-bold uppercase text-[10px] tracking-widest h-9"
                            >
                                Done
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </form>
        </AdminLayout>
    )
}
