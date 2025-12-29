"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  getProducts,
  getCategories,
  updateCategoryOrder,
  createCategory,
  deleteCategory
} from "@/lib/db/products"
import { toast } from "@/components/ui/sonner"
import {
  GripVertical,
  Plus,
  Trash2,
  Loader2,
  FolderOpen,
  Save
} from "lucide-react"

interface CategoryManagerProps {
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export function CategoryManager({ isOpen, onClose, onUpdate }: CategoryManagerProps) {
  const [categories, setCategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")

  useEffect(() => {
    if (isOpen) loadCategories()
  }, [isOpen])

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
      onUpdate()
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
      onUpdate()
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

    // Update local state immediately
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
      onUpdate()
    } catch (error) {
      toast.error("Failed to save order")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-[#0A0A0B] border-white/5 text-white flex flex-col max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-brand" />
            Category Manager
          </DialogTitle>
          <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-white/20 mt-2">
            Manage your product groups and set their display order.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 flex-1 overflow-y-auto pr-2">
          {/* Add Category */}
          <div className="flex gap-2">
            <Input
              placeholder="Category Name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="bg-white/5 border-white/10 h-11 focus:ring-brand/20"
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            />
            <Button
              onClick={handleAddCategory}
              disabled={isSaving || !newCategoryName.trim()}
              className="bg-brand text-black font-bold h-11 px-4"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {isLoading ? (
              <div className="flex justify-center py-10 opacity-20">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-10 text-white/20 text-xs ">
                No categories yet. Create your first one above.
              </div>
            ) : (
              <div className="space-y-2">
                {categories.map((cat, idx) => (
                  <div
                    key={cat.id}
                    className="flex items-center gap-3 bg-white/5 border border-white/5 p-3 rounded-xl group transition-all hover:bg-white/[0.08]"
                  >
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveCategory(idx, 'up')}
                        disabled={idx === 0}
                        className="text-white/20 hover:text-white disabled:opacity-0 transition-all"
                      >
                        <GripVertical className="w-4 h-4 rotate-90" />
                      </button>
                      <button
                        onClick={() => moveCategory(idx, 'down')}
                        disabled={idx === categories.length - 1}
                        className="text-white/20 hover:text-white disabled:opacity-0 transition-all"
                      >
                        <GripVertical className="w-4 h-4 rotate-90" />
                      </button>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{cat.name}</div>
                      <div className="text-[10px] text-white/20 font-mono ">/{cat.slug}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-white/20 hover:text-red-400 hover:bg-red-400/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-white/5 flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose} className="text-white/40">Cancel</Button>
          <Button
            onClick={saveOrder}
            disabled={isSaving}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-6"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Order
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
