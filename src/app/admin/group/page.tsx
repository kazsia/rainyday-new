"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Plus,
    Trash2,
    Loader2,
    FolderOpen,
    Save,
    GripVertical,
    ChevronUp,
    ChevronDown,
    Search,
    Edit2
} from "lucide-react"
import {
    getCategories,
    updateCategoryOrder,
    createCategory,
    deleteCategory,
    updateCategory
} from "@/lib/db/products"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function AdminGroupPage() {
    const [categories, setCategories] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState("")
    const [searchQuery, setSearchQuery] = useState("")
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editName, setEditName] = useState("")

    useEffect(() => {
        loadCategories()
    }, [])

    async function loadCategories() {
        setIsLoading(true)
        try {
            const data = await getCategories()
            setCategories(data)
        } catch (error) {
            toast.error("Failed to load categories")
        } finally {
            setIsLoading(false)
        }
    }

    async function handleAddCategory() {
        if (!newCategoryName.trim()) return
        setIsSaving(true)
        try {
            await createCategory(newCategoryName)
            toast.success("Category added")
            setNewCategoryName("")
            loadCategories()
        } catch (error) {
            toast.error("Failed to add category")
        } finally {
            setIsSaving(false)
        }
    }

    async function handleDeleteCategory(id: string) {
        if (!confirm("Are you sure? This will not delete products in this category.")) return
        setIsSaving(true)
        try {
            await deleteCategory(id)
            toast.success("Category deleted")
            loadCategories()
        } catch (error) {
            toast.error("Failed to delete category")
        } finally {
            setIsSaving(false)
        }
    }

    async function moveCategory(index: number, direction: 'up' | 'down') {
        const newCategories = [...categories]
        const targetIndex = direction === 'up' ? index - 1 : index + 1

        if (targetIndex < 0 || targetIndex >= newCategories.length) return

        [newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]]
        setCategories(newCategories)
    }

    async function saveOrder() {
        setIsSaving(true)
        try {
            const orderUpdates = categories.map((cat, idx) => ({
                id: cat.id,
                sort_order: idx
            }))
            await updateCategoryOrder(orderUpdates)
            toast.success("Category order saved")
        } catch (error) {
            toast.error("Failed to save order")
        } finally {
            setIsSaving(false)
        }
    }

    async function handleStartEdit(category: any) {
        setEditingId(category.id)
        setEditName(category.name)
    }

    async function handleSaveEdit(id: string) {
        if (!editName.trim()) return
        setIsSaving(true)
        try {
            await updateCategory(id, { name: editName, slug: editName.toLowerCase().replace(/ /g, '-') })
            toast.success("Category updated")
            setEditingId(null)
            loadCategories()
        } catch (error) {
            toast.error("Failed to update category")
        } finally {
            setIsSaving(false)
        }
    }

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight">Product Groups</h1>
                        <p className="text-[11px] font-medium text-[var(--sa-fg-dim)] mt-0.5">Organize your products into categories for better navigation.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={saveOrder}
                            disabled={isSaving}
                            className="h-8 px-4 bg-emerald-500 hover:bg-emerald-600 text-black text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
                        >
                            <Save className="w-3.5 h-3.5 mr-2 stroke-[3]" />
                            Save Order
                        </Button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 bg-[var(--sa-card)] border border-[var(--sa-border)] p-2 rounded-xl">
                    <div className="flex-1 flex gap-2">
                        <div className="relative flex-1">
                            <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--sa-fg-dim)]" />
                            <Input
                                placeholder="New category name..."
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                className="pl-9 bg-black/20 border-white/5 h-10 text-[13px] text-white placeholder:text-[var(--sa-fg-dim)] focus:border-[var(--sa-accent-glow)] transition-all"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                            />
                        </div>
                        <Button
                            onClick={handleAddCategory}
                            disabled={isSaving || !newCategoryName.trim()}
                            className="h-10 px-6 bg-[var(--sa-accent)] hover:bg-[var(--sa-accent-bright)] text-black text-[11px] font-black uppercase tracking-widest rounded-lg transition-all"
                        >
                            Add Group
                        </Button>
                    </div>

                    <div className="relative lg:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--sa-fg-dim)]" />
                        <Input
                            placeholder="Search categories..."
                            className="pl-9 bg-black/20 border-white/5 h-10 text-[11px] text-white placeholder:text-[var(--sa-fg-dim)] focus:border-[var(--sa-accent-glow)] transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Categories List */}
                <div className="bg-[var(--sa-card)] border border-[var(--sa-border)] rounded-xl overflow-hidden">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-8 h-8 text-[var(--sa-accent)] animate-spin" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--sa-fg-dim)]">Loading Categories...</p>
                        </div>
                    ) : filteredCategories.length === 0 ? (
                        <div className="py-20 text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--sa-fg-dim)]">No categories found</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {filteredCategories.map((cat, idx) => (
                                <div
                                    key={cat.id}
                                    className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-all group"
                                >
                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={() => moveCategory(idx, 'up')}
                                            disabled={idx === 0}
                                            className="text-[var(--sa-fg-dim)] hover:text-white disabled:opacity-0 transition-all p-1"
                                        >
                                            <ChevronUp className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => moveCategory(idx, 'down')}
                                            disabled={idx === filteredCategories.length - 1}
                                            className="text-[var(--sa-fg-dim)] hover:text-white disabled:opacity-0 transition-all p-1"
                                        >
                                            <ChevronDown className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="flex-1 flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-white/5 text-[var(--sa-fg-dim)] group-hover:text-[var(--sa-accent)] transition-colors">
                                            <FolderOpen className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            {editingId === cat.id ? (
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className="h-8 bg-black/20 border-white/10 text-xs text-white max-w-[200px]"
                                                        autoFocus
                                                    />
                                                    <Button size="icon" className="h-8 w-8 bg-emerald-500 hover:bg-emerald-600 text-black" onClick={() => handleSaveEdit(cat.id)}>
                                                        <Save className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40" onClick={() => setEditingId(null)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="text-sm font-black text-white">{cat.name}</div>
                                                    <div className="text-[10px] text-[var(--sa-fg-dim)] font-mono">/{cat.slug}</div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleStartEdit(cat)}
                                            className="h-8 w-8 text-[var(--sa-fg-dim)] hover:text-white"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteCategory(cat.id)}
                                            className="h-8 w-8 text-[var(--sa-fg-dim)] hover:text-rose-400"
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
        </AdminLayout>
    )
}
