"use client"

import { useState, useEffect } from "react"
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
    FolderOpen,
    FolderSync
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
    cloneProduct
} from "@/lib/db/products"
import { toast } from "sonner"
import Image from "next/image"
import { cn } from "@/lib/utils"
import Link from "next/link"

import { CategoryManager } from "@/components/admin/products/category-manager"
import { ProductReorderDialog } from "@/components/admin/products/reorder-dialog"

export default function AdminProductsPage() {
    const [products, setProducts] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
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
            await deleteProduct(id)
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

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Products</h1>
                        <p className="text-sm text-white/40">Manage your product inventory and display priority.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setIsCategoryManagerOpen(true)}
                            className="h-9 bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10 text-xs font-medium"
                        >
                            <FolderOpen className="w-4 h-4 mr-2" />
                            Categories
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setIsReorderDialogOpen(true)}
                            className="h-9 bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10 text-xs font-medium"
                        >
                            <LayoutList className="w-4 h-4 mr-2" />
                            Reorder Products
                        </Button>
                        <Button asChild className="h-9 bg-brand text-black font-bold text-xs border-none shadow-[0_0_20px_rgba(var(--brand-rgb),0.2)]">
                            <Link href="/admin/products/create">
                                <Plus className="w-4 h-4 mr-2" />
                                Create
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

                {/* Filters */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#0a1628] border border-white/5 p-4 rounded-xl">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" className="text-white/40 hover:text-white hover:bg-white/5 gap-2 text-sm font-medium">
                            <Edit2 className="w-4 h-4" />
                            Bulk Edit
                            <ChevronDown className="w-3 h-3" />
                        </Button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 lg:justify-end">
                        <Button variant="outline" className="bg-transparent border-white/10 text-white/60 hover:text-white hover:bg-white/5 h-10 gap-2 justify-center">
                            <Filter className="w-4 h-4" />
                            Filter
                        </Button>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                            <Input
                                placeholder="Quick Search by Name"
                                className="pl-10 bg-[#070b14] border-white/10 h-10 text-sm text-white placeholder:text-white/20 focus:border-brand-primary/50"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-[#0a1628] border border-white/5 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="px-6 py-4 w-10">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-white/10 bg-white/5 checked:bg-brand-primary transition-all cursor-pointer appearance-none checked:border-brand-primary relative after:content-[''] after:absolute after:hidden checked:after:block after:left-[5px] after:top-[1px] after:w-[5px] after:h-[10px] after:border-r-2 after:border-b-2 after:border-white after:rotate-45"
                                            checked={selectedProducts.length > 0 && selectedProducts.length === filteredProducts.length}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-1 cursor-pointer hover:text-white/60">
                                        ID
                                        <ChevronDown className="w-3 h-3" />
                                    </th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-wider">Price</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-wider">Stock</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-wider">Group</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-wider">Visibility</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-wider">Sales</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-wider text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-8 text-center text-white/40 text-sm">Loading products...</td>
                                    </tr>
                                ) : filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-8 text-center text-white/40 text-sm">No products found.</td>
                                    </tr>
                                ) : filteredProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-white/10 bg-white/5 checked:bg-brand-primary transition-all cursor-pointer appearance-none checked:border-brand-primary relative after:content-[''] after:absolute after:hidden checked:after:block after:left-[5px] after:top-[1px] after:w-[5px] after:h-[10px] after:border-r-2 after:border-b-2 after:border-white after:rotate-45"
                                                checked={selectedProducts.includes(product.id)}
                                                onChange={() => toggleSelectProduct(product.id)}
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-sm text-white/40 font-mono">
                                            {product.id.slice(0, 6)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {/* <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 overflow-hidden">
                                                    {product.image_url ? (
                                                        <Image src={product.image_url} alt="" width={32} height={32} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Package className="w-4 h-4 text-white/20" />
                                                    )}
                                                </div> */}
                                                <span className="text-sm font-medium text-white">{product.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-white/80 font-medium">
                                            ${product.price}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "text-sm font-medium",
                                                product.stock_count > 0 ? "text-white/80" : "text-white/40"
                                            )}>
                                                {product.stock_count}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-white/60">
                                            {product.category?.name || "None"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {product.is_active ? (
                                                    <span className="text-white text-sm">Public</span>
                                                ) : (
                                                    <span className="text-white/40 text-sm">Hidden</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-white">
                                            {product.sales_count || 0}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-[#0a1628] border-white/10 text-white">
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
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}
