"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Plus,
    Search,
    Trash2,
    Ticket,
    MoreHorizontal,
    Copy,
    Ban,
    CheckCircle2
} from "lucide-react"
import {
    getCoupons,
    deleteCoupon,
    createCoupon,
    toggleCouponStatus
} from "@/lib/db/coupons"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newCoupon, setNewCoupon] = useState({
        code: "",
        discount_type: "percentage",
        discount_value: "",
        max_uses: ""
    })

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setIsLoading(true)
        try {
            const data = await getCoupons()
            setCoupons(data || [])
        } catch (error) {
            toast.error("Failed to load coupons")
        } finally {
            setIsLoading(false)
        }
    }

    async function handleCreate() {
        if (!newCoupon.code || !newCoupon.discount_value) {
            toast.error("Please fill in all required fields")
            return
        }

        try {
            await createCoupon({
                code: newCoupon.code,
                discount_type: newCoupon.discount_type as 'percentage' | 'fixed',
                discount_value: Number(newCoupon.discount_value),
                max_uses: newCoupon.max_uses ? Number(newCoupon.max_uses) : undefined
            })
            toast.success("Coupon created")
            setIsCreateOpen(false)
            setNewCoupon({ code: "", discount_type: "percentage", discount_value: "", max_uses: "" })
            loadData()
        } catch (error) {
            toast.error("Failed to create coupon")
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure?")) return
        try {
            await deleteCoupon(id)
            toast.success("Coupon deleted")
            loadData()
        } catch (error) {
            toast.error("Failed to delete coupon")
        }
    }

    async function handleToggle(id: string, currentStatus: boolean) {
        try {
            await toggleCouponStatus(id, !currentStatus)
            toast.success(`Coupon ${!currentStatus ? 'activated' : 'deactivated'}`)
            loadData()
        } catch (error) {
            toast.error("Failed to update status")
        }
    }

    const filteredCoupons = coupons.filter(c =>
        c.code.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <AdminLayout>
            <div className="space-y-6 max-w-[100rem] mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Coupons</h1>
                        <p className="text-sm text-[var(--sa-fg-muted)] mt-1">Manage discount codes and promotions.</p>
                    </div>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-9 bg-[var(--sa-accent)] hover:bg-[var(--sa-accent)]/90 text-white font-bold text-xs border-none">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Coupon
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[var(--sa-card)] border-[var(--sa-border)] text-white">
                            <DialogHeader>
                                <DialogTitle>Create Coupon</DialogTitle>
                                <DialogDescription className="text-[var(--sa-fg-muted)]">
                                    Create a new discount code for your store.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[var(--sa-fg-muted)] uppercase">Code</label>
                                    <Input
                                        placeholder="e.g. SUMMER2024"
                                        value={newCoupon.code}
                                        onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                                        className="bg-[var(--sa-bg)] border-[var(--sa-border)]"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-[var(--sa-fg-muted)] uppercase">Type</label>
                                        <Select
                                            value={newCoupon.discount_type}
                                            onValueChange={v => setNewCoupon({ ...newCoupon, discount_type: v })}
                                        >
                                            <SelectTrigger className="bg-[var(--sa-bg)] border-[var(--sa-border)]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[var(--sa-card)] border-[var(--sa-border)]">
                                                <SelectItem value="percentage">Percentage (%)</SelectItem>
                                                <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-[var(--sa-fg-muted)] uppercase">Value</label>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={newCoupon.discount_value}
                                            onChange={e => setNewCoupon({ ...newCoupon, discount_value: e.target.value })}
                                            className="bg-[var(--sa-bg)] border-[var(--sa-border)]"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[var(--sa-fg-muted)] uppercase">Max Uses (Optional)</label>
                                    <Input
                                        type="number"
                                        placeholder="Unlimited"
                                        value={newCoupon.max_uses}
                                        onChange={e => setNewCoupon({ ...newCoupon, max_uses: e.target.value })}
                                        className="bg-[var(--sa-bg)] border-[var(--sa-border)]"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsCreateOpen(false)} className="text-[var(--sa-fg-muted)] hover:text-white hover:bg-[var(--sa-bg)]">Cancel</Button>
                                <Button onClick={handleCreate} className="bg-[var(--sa-accent)] hover:bg-[var(--sa-accent)]/90">Create Coupon</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Content */}
                <div className="bg-[var(--sa-card)] border border-[var(--sa-border)] rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-[var(--sa-border)] flex items-center justify-between bg-[var(--sa-bg)]/30">
                        <div className="relative w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--sa-fg-muted)]" />
                            <Input
                                placeholder="Search coupons..."
                                className="pl-10 bg-[var(--sa-bg)] border-[var(--sa-border)] h-9 text-sm focus:border-[var(--sa-accent)]/50"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-[var(--sa-border)] bg-[var(--sa-bg)]/50 text-[var(--sa-fg-muted)] text-[11px] font-bold uppercase tracking-wider">
                                    <th className="px-6 py-4">Code</th>
                                    <th className="px-6 py-4">Discount</th>
                                    <th className="px-6 py-4">Usage</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--sa-border)]">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-[var(--sa-fg-muted)]">Loading...</td>
                                    </tr>
                                ) : filteredCoupons.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-[var(--sa-fg-muted)]">No coupons found.</td>
                                    </tr>
                                ) : (
                                    filteredCoupons.map((coupon) => (
                                        <tr key={coupon.id} className="hover:bg-[var(--sa-card-hover)] transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-[var(--sa-bg)] border border-[var(--sa-border)] flex items-center justify-center text-[var(--sa-fg-dim)]">
                                                        <Ticket className="w-4 h-4" />
                                                    </div>
                                                    <span className="font-mono font-medium text-white">{coupon.code}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className="border-[var(--sa-border)] text-[var(--sa-fg-bright)] bg-[var(--sa-bg)]">
                                                    {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `$${coupon.discount_value}`}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-[var(--sa-fg-muted)]">
                                                <span className="text-[var(--sa-fg-bright)] font-medium">{coupon.used_count}</span>
                                                <span className="text-[var(--sa-fg-dim)]"> / {coupon.max_uses || '∞'}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge className={cn(
                                                    "border rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                                                    coupon.is_active
                                                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/10"
                                                        : "bg-red-500/10 text-red-500 border-red-500/10"
                                                )}>
                                                    {coupon.is_active ? "Active" : "Inactive"}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-[var(--sa-fg-muted)] hover:text-white"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(coupon.code)
                                                            toast.success("Code copied")
                                                        }}
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={cn("h-8 w-8", coupon.is_active ? "text-emerald-500 hover:text-emerald-400" : "text-amber-500 hover:text-amber-400")}
                                                        onClick={() => handleToggle(coupon.id, coupon.is_active)}
                                                    >
                                                        {coupon.is_active ? <CheckCircle2 className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                                        onClick={() => handleDelete(coupon.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}
