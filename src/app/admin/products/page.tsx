"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Package,
    Image as ImageIcon,
    Copy,
    ChevronDown,
    Filter,
    HelpCircle,
    LayoutList,
    MoreHorizontal,
    RefreshCw,
    FolderTree
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    getProducts,
    deleteProduct,
    cloneProduct,
    archiveProduct
} from "@/lib/db/products"
import { toast } from "@/components/ui/sonner"
import Image from "next/image"
import { cn } from "@/lib/utils"
import Link from "next/link"

import { CategoryManager } from "@/components/admin/products/category-manager"
import { ProductReorderDialog } from "@/components/admin/products/reorder-dialog"

export default function AdminProductsPage() {
    const router = useRouter()
    const [products, setProducts] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterStatus, setFilterStatus] = useState<"all" | "active" | "hidden" | "archived">("all")
    const [selectedProducts, setSelectedProducts] = useState<string[]>([])

    // New Dialog states
    const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false)
    const [isReorderDialogOpen, setIsReorderDialogOpen] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setIsLoading(true)
        try {
            const productsData = await getProducts({ activeOnly: false })
            setProducts(productsData)
        } catch (error) {
            toast.error("Failed to load products")
        } finally {
            setIsLoading(false)
        }
    }

    async function handleDeleteProduct(id: string) {
        if (!confirm("Are you sure you want to delete this product?")) return
        try {
            const result = await deleteProduct(id)
            if (result && !result.success) {
                toast.error(result.message || "Failed to delete product")
                return
            }
            toast.success("Product deleted")
            loadData()
        } catch (error) {
            toast.error("Failed to delete product")
        }
    }

    async function handleCloneProduct(id: string) {
        const promise = cloneProduct(id)
        toast.promise(promise, {
            loading: 'Cloning product...',
            success: () => {
                loadData()
                return 'Product cloned successfully'
            },
            error: 'Failed to clone product'
        })
    }

    const filteredProducts = products.filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.id.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesStatus = filterStatus === "all" ||
            (filterStatus === "active" && p.is_active) ||
            (filterStatus === "hidden" && !p.is_active)

        return matchesSearch && matchesStatus
    })

    const toggleSelectAll = () => {
        if (selectedProducts.length === filteredProducts.length) {
            setSelectedProducts([])
        } else {
            setSelectedProducts(filteredProducts.map(p => p.id))
        }
    }

    const toggleSelectProduct = (id: string) => {
        setSelectedProducts(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        )
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight">Products</h1>
                        <p className="text-[11px] font-medium text-[var(--sa-fg-dim)] mt-0.5">Manage your digital products and categories.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            asChild
                            variant="outline"
                            className="h-8 px-4 bg-white/5 border-white/5 text-[var(--sa-fg-muted)] hover:text-white hover:bg-white/10 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
                        >
                            <Link href="/admin/group">
                                <FolderTree className="w-3.5 h-3.5 mr-2 stroke-[3]" />
                                Manage Groups
                            </Link>
                        </Button>
                        <Button
                            asChild
                            className="h-8 px-4 bg-[var(--sa-accent)] hover:bg-[var(--sa-accent-bright)] text-black text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
                        >
                            <Link href="/admin/products/create">
                                <Plus className="w-3.5 h-3.5 mr-2 stroke-[3]" />
                                Create Product
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Dialogs */}
                <CategoryManager
                    isOpen={isCategoryManagerOpen}
                    onClose={() => setIsCategoryManagerOpen(false)}
                    onUpdate={loadData}
                />
                <ProductReorderDialog
                    isOpen={isReorderDialogOpen}
                    onClose={() => setIsReorderDialogOpen(false)}
                    onUpdate={loadData}
                />

                {/* Toolbar */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 bg-[var(--sa-card)] border border-[var(--sa-border)] p-2 rounded-xl">
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                        <Button
                            variant="outline"
                            className="h-8 bg-white/5 border-white/5 text-[var(--sa-fg-muted)] hover:text-white hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest px-3"
                            onClick={() => loadData()}
                        >
                            <RefreshCw className={cn("w-3.5 h-3.5 mr-2", isLoading && "animate-spin text-[var(--sa-accent)]")} />
                            Refresh
                        </Button>
                        <div className="w-px h-4 bg-white/5 mx-1" />
                        <Button
                            variant="outline"
                            onClick={() => setIsReorderDialogOpen(true)}
                            className="h-8 bg-white/5 border-white/5 text-[var(--sa-fg-muted)] hover:text-white hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest px-3"
                        >
                            <LayoutList className="w-3.5 h-3.5 mr-1.5" />
                            Reorder
                        </Button>
                        <div className="w-px h-4 bg-white/5 mx-1" />
                        <div className="relative group">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as any)}
                                className="h-8 pl-8 pr-4 bg-transparent border border-white/5 text-[var(--sa-fg-muted)] hover:text-white rounded-lg appearance-none cursor-pointer transition-all focus:border-[var(--sa-accent-glow)] focus:ring-0 text-[10px] font-bold uppercase tracking-widest"
                            >
                                <option value="all">Status</option>
                                <option value="active">Visible</option>
                                <option value="hidden">Hidden</option>
                                <option value="archived">Archived</option>
                            </select>
                            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--sa-fg-dim)] pointer-events-none" />
                        </div>
                    </div>

                    <div className="relative flex-1 lg:max-w-xs ml-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--sa-fg-dim)]" />
                        <Input
                            placeholder="Quick Search by Name..."
                            className="pl-9 bg-black/20 border-white/5 h-8 text-[11px] text-white placeholder:text-[var(--sa-fg-dim)] focus:border-[var(--sa-accent-glow)] transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Products Table */}
                <div className="bg-[var(--sa-card)] border border-[var(--sa-border)] rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5 bg-black/20">
                                    <th className="px-5 py-3 w-10">
                                        <input
                                            type="checkbox"
                                            className="w-3.5 h-3.5 rounded border-white/10 bg-white/5 checked:bg-[var(--sa-accent)] transition-all cursor-pointer appearance-none checked:border-[var(--sa-accent)] relative after:content-[''] after:absolute after:hidden checked:after:block after:left-[4px] after:top-[1px] after:w-[4px] after:h-[8px] after:border-r-2 after:border-b-2 after:border-black after:rotate-45"
                                            checked={selectedProducts.length > 0 && selectedProducts.length === filteredProducts.length}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th className="px-5 py-3 text-[9px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest">ID</th>
                                    <th className="px-5 py-3 text-[9px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest">Name</th>
                                    <th className="px-5 py-3 text-[9px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest">Price</th>
                                    <th className="px-5 py-3 text-[9px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest">Stock</th>
                                    <th className="px-5 py-3 text-[9px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest">Group</th>
                                    <th className="px-5 py-3 text-[9px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest">Visibility</th>
                                    <th className="px-5 py-3 text-[9px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest">Sales</th>
                                    <th className="px-5 py-3 text-[9px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {isLoading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={8} className="px-5 py-6 bg-white/[0.005]" />
                                        </tr>
                                    ))
                                ) : filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-5 py-12 text-center text-[var(--sa-fg-dim)] text-[10px] font-bold uppercase tracking-widest">
                                            No products found
                                        </td>
                                    </tr>
                                ) : filteredProducts.map((product) => (
                                    <tr
                                        key={product.id}
                                        className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                                        onClick={() => router.push(`/admin/products/edit/${product.id}`)}
                                    >
                                        <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                className="w-3.5 h-3.5 rounded border-white/10 bg-white/5 checked:bg-[var(--sa-accent)] transition-all cursor-pointer appearance-none checked:border-[var(--sa-accent)] relative after:content-[''] after:absolute after:hidden checked:after:block after:left-[4px] after:top-[1px] after:w-[4px] after:h-[8px] after:border-r-2 after:border-b-2 after:border-black after:rotate-45"
                                                checked={selectedProducts.includes(product.id)}
                                                onChange={() => toggleSelectProduct(product.id)}
                                            />
                                        </td>
                                        <td className="px-5 py-3 font-mono text-[10px] text-[var(--sa-fg-dim)]">
                                            {product.id.slice(0, 8)}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className="text-xs font-bold text-white group-hover:text-[var(--sa-accent)] transition-colors">{product.name}</span>
                                        </td>
                                        <td className="px-5 py-3 text-xs text-white/80 font-black">
                                            ${product.price}
                                        </td>
                                        <td className="px-5 py-3">
                                            {(() => {
                                                // Calculate effective stock
                                                const stockDeliveryEnabled = product.payment_restrictions_enabled
                                                const hasVariants = product.variants && product.variants.length > 0

                                                let effectiveStock = 0
                                                let isUnlimited = false

                                                if (stockDeliveryEnabled) {
                                                    // Stock & Delivery is enabled - use product-level stock
                                                    effectiveStock = product.stock_count || 0
                                                    isUnlimited = product.is_unlimited
                                                } else if (hasVariants) {
                                                    // Stock & Delivery disabled but has variants - sum variant stock
                                                    effectiveStock = product.variants.reduce((sum: number, v: any) => sum + (v.stock_count || 0), 0)
                                                    isUnlimited = product.variants.some((v: any) => v.is_unlimited)
                                                } else {
                                                    // Stock & Delivery disabled and no variants - stock is 0
                                                    effectiveStock = 0
                                                    isUnlimited = false
                                                }

                                                return (
                                                    <span className={cn(
                                                        "text-[10px] font-black px-1.5 py-0.5 rounded border",
                                                        (isUnlimited || effectiveStock > 0)
                                                            ? "text-emerald-400 bg-emerald-400/5 border-emerald-400/10"
                                                            : "text-rose-400 bg-rose-400/5 border-rose-500/10"
                                                    )}>
                                                        {isUnlimited ? "∞" : effectiveStock}
                                                    </span>
                                                )
                                            })()}
                                        </td>
                                        <td className="px-5 py-3 text-[11px] text-[var(--sa-fg-dim)]">
                                            {product.category?.name || "—"}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border",
                                                product.is_active
                                                    ? "bg-sky-500/5 text-sky-400 border-sky-500/10"
                                                    : "bg-white/5 text-white/20 border-white/5"
                                            )}>
                                                {product.is_active ? "Public" : "Hidden"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <span className="text-xs font-bold text-white">
                                                {product.sales_count || 0}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-[var(--sa-fg-dim)] hover:text-white transition-colors">
                                                        <MoreHorizontal className="w-3.5 h-3.5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-[var(--sa-card)] border-[var(--sa-border)] text-white p-1">
                                                    <DropdownMenuItem asChild className="text-[11px] font-bold cursor-pointer focus:bg-[var(--sa-accent-muted)] focus:text-[var(--sa-accent)]">
                                                        <Link href={`/admin/products/edit/${product.id}`} className="flex items-center gap-2">
                                                            <Edit2 className="w-3.5 h-3.5" /> Edit
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleCloneProduct(product.id)} className="text-[11px] font-bold cursor-pointer focus:bg-[var(--sa-accent-muted)] focus:text-[var(--sa-accent)]">
                                                        <Copy className="w-3.5 h-3.5" /> Clone
                                                    </DropdownMenuItem>
                                                    <div className="h-px bg-white/5 my-1" />
                                                    <DropdownMenuItem onClick={() => handleDeleteProduct(product.id)} className="text-[11px] font-bold cursor-pointer text-rose-400 focus:bg-rose-400/10 focus:text-rose-400">
                                                        <Trash2 className="w-3.5 h-3.5" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile View */}
                <div className="md:hidden divide-y divide-white/5">
                    {isLoading ? (
                        <div className="px-6 py-8 text-center text-white/40 text-sm">Loading products...</div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="px-6 py-8 text-center text-white/40 text-sm">No products found.</div>
                    ) : filteredProducts.map((product) => (
                        <div
                            key={product.id}
                            className="p-4 space-y-4 hover:bg-white/[0.02] transition-colors"
                            onClick={() => router.push(`/admin/products/edit/${product.id}`)}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 overflow-hidden">
                                    <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-white/10 bg-white/5 checked:bg-brand-primary transition-all cursor-pointer appearance-none checked:border-brand-primary relative after:content-[''] after:absolute after:hidden checked:after:block after:left-[5px] after:top-[1px] after:w-[5px] after:h-[10px] after:border-r-2 after:border-b-2 after:border-white after:rotate-45"
                                            checked={selectedProducts.includes(product.id)}
                                            onChange={() => toggleSelectProduct(product.id)}
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-bold text-white truncate">{product.name}</h3>
                                        <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest">{product.id.slice(0, 8)}</p>
                                    </div>
                                </div>
                                <div onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-background border-white/10 text-white">
                                            <DropdownMenuItem asChild>
                                                <Link href={`/admin/products/edit/${product.id}`} className="flex items-center gap-2">
                                                    <Edit2 className="w-4 h-4" /> Edit
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleCloneProduct(product.id)} className="flex items-center gap-2">
                                                <Copy className="w-4 h-4" /> Clone
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDeleteProduct(product.id)} className="flex items-center gap-2 text-red-400 focus:text-red-400">
                                                <Trash2 className="w-4 h-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Price & Sales</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-white">${product.price}</span>
                                        <span className="text-[10px] text-white/40">• {product.sales_count || 0} sales</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Stock & Status</p>
                                    <div className="flex items-center gap-2">
                                        {(() => {
                                            // Calculate effective stock (same logic as desktop)
                                            const stockDeliveryEnabled = product.payment_restrictions_enabled
                                            const hasVariants = product.variants && product.variants.length > 0

                                            let effectiveStock = 0
                                            let isUnlimited = false

                                            if (stockDeliveryEnabled) {
                                                effectiveStock = product.stock_count || 0
                                                isUnlimited = product.is_unlimited
                                            } else if (hasVariants) {
                                                effectiveStock = product.variants.reduce((sum: number, v: any) => sum + (v.stock_count || 0), 0)
                                                isUnlimited = product.variants.some((v: any) => v.is_unlimited)
                                            } else {
                                                effectiveStock = 0
                                                isUnlimited = false
                                            }

                                            return (
                                                <span className={cn(
                                                    "text-xs font-bold",
                                                    (isUnlimited || effectiveStock > 0) ? "text-brand-primary" : "text-red-500"
                                                )}>
                                                    {isUnlimited ? "∞" : `${effectiveStock} left`}
                                                </span>
                                            )
                                        })()}
                                        <span className="text-[10px] text-white/40">• {product.is_active ? 'Public' : 'Hidden'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                    {product.category?.name || "Uncategorized"}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AdminLayout>
    )
}
