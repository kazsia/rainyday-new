"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Plus,
    Trash2,
    Loader2,
    Search,
    Edit2,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal
} from "lucide-react"
import {
    getCategoriesWithProducts,
    createCategory,
    deleteCategory,
    updateCategory
} from "@/lib/db/products"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
// Use relative imports for UI components to avoid circular dependencies if any
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function AdminGroupsPage() {
    const router = useRouter()
    const [categories, setCategories] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 8

    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [categoryName, setCategoryName] = useState("")
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        loadCategories()
    }, [])

    async function loadCategories() {
        setIsLoading(true)
        try {
            const data = await getCategoriesWithProducts()
            setCategories(data)
        } catch (error) {
            toast.error("Failed to load categories")
        } finally {
            setIsLoading(false)
        }
    }

    // Filter categories
    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.id.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Pagination logic
    const totalPages = Math.ceil(filteredCategories.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedCategories = filteredCategories.slice(startIndex, startIndex + itemsPerPage)

    function handleOpenDialog() {
        setCategoryName("")
        setIsDialogOpen(true)
    }

    async function handleSaveCategory() {
        if (!categoryName.trim()) return

        setIsSaving(true)
        try {
            const newCategory = await createCategory(categoryName)
            toast.success("Category created")
            setIsDialogOpen(false)
            if (newCategory?.id) {
                router.push(`/admin/groups/${newCategory.id}`)
            } else {
                loadCategories()
            }
        } catch (error) {
            toast.error("Failed to save category")
        } finally {
            setIsSaving(false)
        }
    }

    async function handleDeleteCategory(id: string) {
        if (!confirm("Are you sure? This will not delete products in this category, but they will be uncategorized.")) return
        try {
            await deleteCategory(id)
            toast.success("Category deleted")
            loadCategories()
        } catch (error) {
            toast.error("Failed to delete category")
        }
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-xl font-bold text-white">Groups</h1>
                    <p className="text-sm text-[var(--sa-fg-muted)]">Manage your product groups.</p>
                </div>

                <div className="bg-[var(--sa-card)] border border-[var(--sa-border)] rounded-xl overflow-hidden shadow-sm">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-[var(--sa-border)] flex flex-col sm:flex-row gap-4 justify-between items-center bg-black/20">
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--sa-fg-dim)]" />
                            <Input
                                placeholder="Search"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value)
                                    setCurrentPage(1) // Reset page on search
                                }}
                                className="pl-9 h-9 bg-black/40 border-[var(--sa-border)] text-[13px] text-white placeholder:text-[var(--sa-fg-dim)] focus:border-[var(--sa-accent-glow)] transition-all rounded-lg"
                            />
                        </div>
                        <Button
                            onClick={() => handleOpenDialog()}
                            className="bg-[var(--sa-accent)] hover:bg-[var(--sa-accent-bright)] text-black font-bold text-[13px] h-9 px-4 rounded-lg transition-colors"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create
                        </Button>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b-[var(--sa-border)] hover:bg-transparent">
                                    <TableHead className="w-[100px] text-[var(--sa-fg-dim)] text-[11px] font-bold uppercase tracking-wider pl-6">ID</TableHead>
                                    <TableHead className="text-[var(--sa-fg-dim)] text-[11px] font-bold uppercase tracking-wider">Name</TableHead>
                                    <TableHead className="text-[var(--sa-fg-dim)] text-[11px] font-bold uppercase tracking-wider">Visibility</TableHead>
                                    <TableHead className="text-[var(--sa-fg-dim)] text-[11px] font-bold uppercase tracking-wider">Products</TableHead>
                                    <TableHead className="w-[100px] text-right text-[var(--sa-fg-dim)] text-[11px] font-bold uppercase tracking-wider pr-6"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-48 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Loader2 className="w-6 h-6 text-[var(--sa-accent)] animate-spin" />
                                                <p className="text-[11px] font-medium text-[var(--sa-fg-dim)]">Loading groups...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : paginatedCategories.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-48 text-center text-[var(--sa-fg-dim)] text-xs">
                                            No groups found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedCategories.map((cat) => (
                                        <TableRow key={cat.id} className="border-b-[var(--sa-border)] hover:bg-white/[0.02] transition-colors group">
                                            <TableCell className="font-mono text-xs text-[var(--sa-fg-dim)] pl-6">
                                                {cat.id.substring(0, 8)}...
                                            </TableCell>
                                            <TableCell className="font-medium text-sm text-white">
                                                {cat.name}
                                            </TableCell>
                                            <TableCell className="text-xs text-[var(--sa-fg-muted)]">
                                                {cat.is_active !== false ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-500/10 text-green-500">Public</span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-[var(--sa-fg-muted)]">Hidden</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs text-[var(--sa-fg-muted)] max-w-md truncate">
                                                {(cat.products && cat.products.length > 0) ? (
                                                    <span title={cat.products.map((p: any) => p.name).join(", ")}>
                                                        {cat.products.slice(0, 3).map((p: any) => p.name).join(", ")}
                                                        {cat.products.length > 3 && `, +${cat.products.length - 3} more`}
                                                    </span>
                                                ) : (
                                                    <span className="text-[var(--sa-fg-dim)] italic">No products</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => router.push(`/admin/groups/${cat.id}`)}
                                                        className="flex items-center text-[10px] sm:text-[11px] font-medium text-[var(--sa-accent)] hover:text-[var(--sa-accent-bright)] transition-colors"
                                                    >
                                                        <Edit2 className="w-3 h-3 mr-1" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCategory(cat.id)}
                                                        className="flex items-center text-[10px] sm:text-[11px] font-medium text-[var(--sa-fg-dim)] hover:text-rose-400 transition-colors ml-2"
                                                    >
                                                        <Trash2 className="w-3 h-3 mr-1" />
                                                        Delete
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="p-4 border-t border-[var(--sa-border)] flex items-center justify-between bg-black/20">
                        <p className="text-[11px] text-[var(--sa-fg-dim)]">
                            Showing <span className="text-white font-medium">{startIndex + 1}</span> to <span className="text-white font-medium">{Math.min(startIndex + itemsPerPage, filteredCategories.length)}</span> of <span className="text-white font-medium">{filteredCategories.length}</span> results.
                        </p>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 text-[var(--sa-fg-dim)] border-[var(--sa-border)] hover:bg-white/5 hover:text-white rounded-md"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="w-3 h-3" />
                            </Button>
                            <div className="bg-[var(--sa-accent)] text-black text-[10px] font-bold h-7 min-w-[28px] px-2 flex items-center justify-center rounded-md">
                                {currentPage}
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 text-[var(--sa-fg-dim)] border-[var(--sa-border)] hover:bg-white/5 hover:text-white rounded-md"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages || totalPages === 0}
                            >
                                <ChevronRight className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-[var(--sa-card)] border-[var(--sa-border)] text-white sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Create Group</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label htmlFor="name" className="text-xs font-medium text-[var(--sa-fg-dim)]">Name</label>
                            <Input
                                id="name"
                                value={categoryName}
                                onChange={(e) => setCategoryName(e.target.value)}
                                className="col-span-3 bg-black/40 border-[var(--sa-border)] text-white"
                                placeholder="Group Name"
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveCategory()}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                            className="border-[var(--sa-border)] text-[var(--sa-fg-dim)] hover:bg-white/5 hover:text-white"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveCategory}
                            disabled={isSaving || !categoryName.trim()}
                            className="bg-[var(--sa-accent)] hover:bg-[var(--sa-accent-bright)] text-black font-bold"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    )
}
