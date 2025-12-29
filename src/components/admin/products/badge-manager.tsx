"use client"

import { useState, useEffect } from "react"
import {
    Plus,
    X,
    Settings2,
    Check,
    Search,
    Loader2,
    Trash2,
    Save,
    Palette,
    PenTool
} from "lucide-react"
import * as Icons from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    getBadges,
    createBadge,
    updateBadge,
    deleteBadge,
    updateProductBadges
} from "@/lib/db/badges"
import { toast } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

interface Badge {
    id: string
    name: string
    icon: string
    color: string
}

const COLORS = [
    { name: "Brand", class: "text-brand-primary bg-brand-primary/10 border-brand-primary/20" },
    { name: "Red", class: "text-red-500 bg-red-500/10 border-red-500/20" },
    { name: "Orange", class: "text-orange-500 bg-orange-500/10 border-orange-500/20" },
    { name: "Yellow", class: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20" },
    { name: "Green", class: "text-green-500 bg-green-500/10 border-green-500/20" },
    { name: "Blue", class: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
    { name: "Purple", class: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
    { name: "Pink", class: "text-pink-500 bg-pink-500/10 border-pink-500/20" },
    { name: "White", class: "text-white bg-white/5 border-white/10" }
]

const COMMON_ICONS = [
    "Zap", "ShieldCheck", "Award", "Activity", "Star", "Flame", "Crown", "Gem",
    "CheckCircle2", "Info", "AlertTriangle", "Heart", "Rocket", "Tag", "Gift"
]

export function BadgeManager({ productId, initialBadgeIds = [] }: { productId: string; initialBadgeIds?: string[] }) {
    const [allBadges, setAllBadges] = useState<Badge[]>([])
    const [selectedBadgeIds, setSelectedBadgeIds] = useState<string[]>(initialBadgeIds)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editingBadge, setEditingBadge] = useState<Partial<Badge> | null>(null)

    useEffect(() => {
        loadBadges()
    }, [])

    async function loadBadges() {
        try {
            const data = await getBadges()
            setAllBadges(data as Badge[])
        } catch (error) {
            toast.error("Failed to load badges")
        } finally {
            setIsLoading(false)
        }
    }

    async function handleToggleBadge(badgeId: string) {
        const isSelected = selectedBadgeIds.includes(badgeId)
        let newSelection: string[]
        if (isSelected) {
            newSelection = selectedBadgeIds.filter(id => id !== badgeId)
        } else {
            newSelection = [...selectedBadgeIds, badgeId]
        }

        setSelectedBadgeIds(newSelection)
        try {
            await updateProductBadges(productId, newSelection)
            toast.success("Product badges updated")
        } catch (error) {
            toast.error("Failed to update product badges")
            // Revert on error
            setSelectedBadgeIds(selectedBadgeIds)
        }
    }

    async function handleSaveBadge() {
        if (!editingBadge?.name) {
            toast.error("Badge name is required")
            return
        }

        try {
            if (editingBadge.id) {
                await updateBadge(editingBadge.id, editingBadge as Badge)
                toast.success("Badge updated")
            } else {
                await createBadge(editingBadge as Badge)
                toast.success("Badge created")
            }
            setIsEditing(false)
            setEditingBadge(null)
            loadBadges()
        } catch (error) {
            toast.error("Failed to save badge")
        }
    }

    async function handleDeleteBadge(id: string) {
        if (!confirm("Are you sure? This will remove the badge from ALL products.")) return
        try {
            await deleteBadge(id)
            toast.success("Badge deleted")
            loadBadges()
            setSelectedBadgeIds(prev => prev.filter(bid => bid !== id))
        } catch (error) {
            toast.error("Failed to delete badge")
        }
    }

    const DynamicIcon = ({ name, className }: { name: string, className?: string }) => {
        const IconComponent = (Icons as any)[name] || Icons.HelpCircle
        return <IconComponent className={className} />
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-white/20" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">Available Badges</h3>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        setEditingBadge({ name: "", icon: "Zap", color: COLORS[0].class })
                        setIsEditing(true)
                    }}
                    className="h-7 text-[10px] font-bold text-brand-primary hover:bg-brand-primary/10 gap-1.5"
                >
                    <Plus className="w-3 h-3" />
                    CREATE NEW
                </Button>
            </div>

            {isEditing && (
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                            {editingBadge?.id ? "Edit Badge" : "New Badge"}
                        </span>
                        <button onClick={() => setIsEditing(false)} className="text-white/20 hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Name</label>
                            <Input
                                value={editingBadge?.name || ""}
                                onChange={e => setEditingBadge({ ...editingBadge, name: e.target.value })}
                                placeholder="e.g. BEST SELLER"
                                className="h-9 bg-black/20 border-white/10"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Icon</label>
                            <div className="grid grid-cols-5 gap-2">
                                {COMMON_ICONS.map(iconName => (
                                    <button
                                        key={iconName}
                                        type="button"
                                        onClick={() => setEditingBadge({ ...editingBadge, icon: iconName })}
                                        className={cn(
                                            "w-full aspect-square rounded-lg border flex items-center justify-center transition-all",
                                            editingBadge?.icon === iconName
                                                ? "bg-brand-primary/20 border-brand-primary text-brand-primary scale-110"
                                                : "bg-white/5 border-white/5 text-white/20 hover:text-white/40 hover:border-white/10"
                                        )}
                                    >
                                        <DynamicIcon name={iconName} className="w-4 h-4" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Color</label>
                            <div className="flex flex-wrap gap-2">
                                {COLORS.map(color => (
                                    <button
                                        key={color.name}
                                        type="button"
                                        onClick={() => setEditingBadge({ ...editingBadge, color: color.class })}
                                        className={cn(
                                            "w-6 h-6 rounded-full border-2 transition-all",
                                            editingBadge?.color === color.class ? "border-white scale-110" : "border-transparent opacity-40 hover:opacity-100",
                                            color.class.split(' ')[1] // Get the bg class
                                        )}
                                        title={color.name}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="pt-2 flex gap-2">
                            <Button
                                type="button"
                                onClick={handleSaveBadge}
                                className="flex-1 bg-brand-primary text-black font-black text-[10px] uppercase tracking-widest h-9"
                            >
                                <Save className="w-3.5 h-3.5 mr-1.5" />
                                Save Badge
                            </Button>
                            {editingBadge?.id && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleDeleteBadge(editingBadge.id!)}
                                    className="border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 w-10 p-0"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                {allBadges.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed border-white/5 rounded-xl">
                        <p className="text-[10px] text-white/20 font-bold uppercase tracking-wider">No badges created yet</p>
                    </div>
                ) : (
                    allBadges.map(badge => (
                        <div
                            key={badge.id}
                            className={cn(
                                "group relative flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer",
                                selectedBadgeIds.includes(badge.id)
                                    ? "bg-brand-primary/5 border-brand-primary/20"
                                    : "bg-white/[0.02] border-white/5 hover:border-white/10"
                            )}
                            onClick={() => handleToggleBadge(badge.id)}
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn("p-2 rounded-lg", badge.color)}>
                                    <DynamicIcon name={badge.icon} className="w-4 h-4" />
                                </div>
                                <span className="text-[11px] text-white/80 font-black uppercase tracking-widest">
                                    {badge.name}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setEditingBadge(badge)
                                        setIsEditing(true)
                                    }}
                                    className="p-1.5 rounded-lg bg-white/5 text-white/20 hover:text-white/60 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <PenTool className="w-3 h-3" />
                                </button>
                                <div className={cn(
                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                    selectedBadgeIds.includes(badge.id)
                                        ? "border-brand-primary bg-brand-primary text-black"
                                        : "border-white/10"
                                )}>
                                    {selectedBadgeIds.includes(badge.id) && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {selectedBadgeIds.length > 0 && (
                <div className="pt-4 border-t border-white/5">
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-3 block">Live Preview</span>
                    <div className="flex flex-wrap gap-2">
                        {selectedBadgeIds.map(id => {
                            const badge = allBadges.find(b => b.id === id)
                            if (!badge) return null
                            return (
                                <div
                                    key={badge.id}
                                    className={cn(
                                        "px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter flex items-center gap-1.5 border shadow-lg",
                                        badge.color
                                    )}
                                >
                                    <DynamicIcon name={badge.icon} className="w-3 h-3" />
                                    {badge.name}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
