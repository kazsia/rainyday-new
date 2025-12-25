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
import {
  getProducts,
  updateProductOrder
} from "@/lib/db/products"
import { toast } from "sonner"
import {
  GripVertical,
  Loader2,
  LayoutList,
  Save,
  ChevronUp,
  ChevronDown
} from "lucide-react"

interface ProductReorderDialogProps {
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export function ProductReorderDialog({ isOpen, onClose, onUpdate }: ProductReorderDialogProps) {
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isOpen) loadProducts()
  }, [isOpen])

  async function loadProducts() {
    setIsLoading(true)
    try {
      const data = await getProducts({ activeOnly: false })
      setProducts(data)
    } catch (error) {
      toast.error("Failed to load products")
    } finally {
      setIsLoading(false)
    }
  }

  async function moveProduct(index: number, direction: 'up' | 'down') {
    const newProducts = [...products]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (targetIndex < 0 || targetIndex >= newProducts.length) return

    [newProducts[index], newProducts[targetIndex]] = [newProducts[targetIndex], newProducts[index]]
    setProducts(newProducts)
  }

  async function handleSaveOrder() {
    setIsSaving(true)
    try {
      const orderUpdates = products.map((p, idx) => ({
        id: p.id,
        sort_order: idx
      }))
      await updateProductOrder(orderUpdates)
      toast.success("Product order saved")
      onUpdate()
      onClose()
    } catch (error) {
      toast.error("Failed to save product order")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-[#0A0A0B] border-white/5 text-white flex flex-col max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <LayoutList className="w-5 h-5 text-brand" />
            Reorder Products
          </DialogTitle>
          <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-white/20 mt-2">
            Drag or use arrows to set display priority for your products.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 flex-1 overflow-y-auto pr-2">

          {isLoading ? (
            <div className="flex justify-center py-20 opacity-20">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-white/20 text-xs ">
              No products found to reorder.
            </div>
          ) : (
            <div className="space-y-1">
              {products.map((product, idx) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 bg-white/5 border border-white/5 p-3 rounded-xl group transition-all hover:bg-white/[0.08]"
                >
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveProduct(idx, 'up')}
                      disabled={idx === 0}
                      className="text-white/10 hover:text-white disabled:opacity-0 transition-colors p-1"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveProduct(idx, 'down')}
                      disabled={idx === products.length - 1}
                      className="text-white/10 hover:text-white disabled:opacity-0 transition-colors p-1"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/20 text-[10px] uppercase font-black">
                    {idx + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate">{product.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-brand/60 font-mono">${product.price}</span>
                      <span className="text-[10px] text-white/20">•</span>
                      <span className="text-[10px] text-white/20 truncate">{product.category?.name || "No Category"}</span>
                    </div>
                  </div>

                  <GripVertical className="w-5 h-5 text-white/5 group-hover:text-white/20 cursor-grab active:cursor-grabbing" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-white/5 flex gap-3 justify-end bg-[#0A0A0B]/80 backdrop-blur-sm">
          <Button variant="ghost" onClick={onClose} className="text-white/40">Cancel</Button>
          <Button
            onClick={handleSaveOrder}
            disabled={isSaving}
            className="bg-brand text-black font-black text-xs uppercase tracking-widest px-8 h-11 rounded-xl shadow-[0_0_20px_rgba(var(--brand-rgb),0.2)]"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Commit Order
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
