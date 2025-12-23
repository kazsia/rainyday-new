"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import {
    Search,
    MessageSquare,
    Star,
    User,
    Calendar,
    CheckCircle2,
    Trash2,
    MoreVertical,
    ThumbsUp,
    ThumbsDown,
    RefreshCw,
    Package,
    History as HistoryIcon
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    adminGetFeedbacks,
    approveFeedback,
    deleteFeedback
} from "@/lib/db/feedbacks"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function AdminFeedbacksPage() {
    const [feedbacks, setFeedbacks] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [ratingFilter, setRatingFilter] = useState("all")

    useEffect(() => {
        loadFeedbacks()
    }, [])

    async function loadFeedbacks() {
        setIsLoading(true)
        try {
            const data = await adminGetFeedbacks()
            setFeedbacks(data)
        } catch (error) {
            toast.error("Failed to load feedbacks")
        } finally {
            setIsLoading(false)
        }
    }

    async function handleApprove(id: string) {
        try {
            await approveFeedback(id)
            toast.success("Feedback approved")
            loadFeedbacks()
        } catch (error) {
            toast.error("Failed to approve feedback")
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to remove this feedback?")) return
        try {
            await deleteFeedback(id)
            toast.success("Feedback removed")
            loadFeedbacks()
        } catch (error) {
            toast.error("Failed to remove feedback")
        }
    }

    const filteredFeedbacks = feedbacks.filter(fb => {
        const matchesSearch =
            (fb.content?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (fb.products?.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (fb.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase()))

        const matchesStatus = statusFilter === "all" ||
            (statusFilter === "approved" && fb.is_approved) ||
            (statusFilter === "pending" && !fb.is_approved)

        const matchesRating = ratingFilter === "all" || fb.rating === parseInt(ratingFilter)

        return matchesSearch && matchesStatus && matchesRating
    })

    const avgRating = feedbacks.length > 0
        ? (feedbacks.reduce((acc, curr) => acc + curr.rating, 0) / feedbacks.length).toFixed(1)
        : "0.0"

    return (
        <AdminLayout>
            <div className="space-y-6 max-w-[100rem] mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Feedbacks</h1>
                        <p className="text-sm text-white/40 mt-1">Monitor and manage customer reviews across the platform.</p>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <Input
                            placeholder="Filter by product, content, or email..."
                            className="pl-10 bg-white/5 border-white/5 h-11 focus:border-brand/50 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="h-11 px-4 bg-white/5 border border-white/5 text-white/60 hover:text-white rounded-xl appearance-none cursor-pointer transition-all focus:border-brand/50 focus:ring-0 text-sm font-medium"
                        >
                            <option value="all">All Status</option>
                            <option value="approved">Approved</option>
                            <option value="pending">Pending</option>
                        </select>
                        <select
                            value={ratingFilter}
                            onChange={(e) => setRatingFilter(e.target.value)}
                            className="h-11 px-4 bg-white/5 border border-white/5 text-white/60 hover:text-white rounded-xl appearance-none cursor-pointer transition-all focus:border-brand/50 focus:ring-0 text-sm font-medium"
                        >
                            <option value="all">Any Rating</option>
                            <option value="5">5 Stars</option>
                            <option value="4">4 Stars</option>
                            <option value="3">3 Stars</option>
                            <option value="2">2 Stars</option>
                            <option value="1">1 Star</option>
                        </select>
                        <Button
                            variant="outline"
                            className="h-11 border-white/5 bg-white/5 hover:bg-white/10 text-white/60"
                            onClick={loadFeedbacks}
                        >
                            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin text-brand")} />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="p-6 bg-white/[0.02] rounded-2xl border border-white/5 space-y-2 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 blur-3xl pointer-events-none" />
                        <div className="flex items-center justify-between relative z-10">
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] italic">Average Platform Rating</p>
                            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 group-hover:scale-110 transition-transform" />
                        </div>
                        <p className="text-4xl font-heading font-black text-white italic tracking-tighter relative z-10">{avgRating}</p>
                    </div>

                    <div className="p-6 bg-white/[0.02] rounded-2xl border border-white/5 space-y-2 relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] italic">Total Feedbacks</p>
                            <MessageSquare className="w-5 h-5 text-brand/40" />
                        </div>
                        <p className="text-4xl font-heading font-black text-white italic tracking-tighter">{feedbacks.length}</p>
                    </div>

                    <div className="p-6 bg-white/[0.02] rounded-2xl border border-white/5 space-y-2 relative overflow-hidden border-yellow-500/20">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black text-yellow-500/30 uppercase tracking-[0.2em] italic">Pending Approval</p>
                            <HistoryIcon className="w-5 h-5 text-yellow-500/40" />
                        </div>
                        <p className="text-4xl font-heading font-black text-white italic tracking-tighter">
                            {feedbacks.filter(f => !f.is_approved).length}
                        </p>
                    </div>
                </div>

                {/* Feedbacks Grid */}
                <div className="grid grid-cols-1 gap-4">
                    {isLoading ? (
                        [1, 2, 3].map(i => <div key={i} className="h-40 bg-white/5 rounded-3xl animate-pulse" />)
                    ) : filteredFeedbacks.length === 0 ? (
                        <div className="text-center py-20 bg-white/[0.01] rounded-3xl border border-dashed border-white/10">
                            <MessageSquare className="w-16 h-16 text-white/5 mx-auto mb-6" />
                            <p className="text-white/20 font-heading font-black uppercase tracking-[0.2em] italic">Intelligence Filtered: No Records Found</p>
                        </div>
                    ) : filteredFeedbacks.map((fb) => (
                        <div key={fb.id} className="bg-white/5 border border-white/5 rounded-3xl p-8 hover:bg-white/[0.08] hover:border-white/10 transition-all flex flex-col md:flex-row gap-8 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 blur-[80px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex items-start gap-6 flex-1 relative z-10">
                                <div className="w-16 h-16 rounded-2xl bg-background/40 border border-white/5 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform overflow-hidden">
                                    {fb.profiles?.avatar_url ? (
                                        <img src={fb.profiles.avatar_url} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <User className="w-8 h-8 text-white/20" />
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <div className="flex flex-wrap items-center gap-4">
                                        <h3 className="text-lg font-heading font-black text-white italic uppercase tracking-tight">{fb.profiles?.email || "Ghost Entity"}</h3>
                                        <div className="flex items-center gap-1 px-3 py-1 bg-background/20 rounded-full border border-white/5">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={cn(
                                                    "w-3 h-3",
                                                    i < fb.rating ? "text-yellow-500 fill-yellow-500" : "text-white/10"
                                                )} />
                                            ))}
                                        </div>
                                        <Badge variant="outline" className={cn(
                                            "text-[9px] font-black uppercase tracking-widest px-3 py-1 border-white/5",
                                            fb.is_approved ? "text-green-500 bg-green-500/5" : "text-yellow-500 bg-yellow-500/5"
                                        )}>
                                            {fb.is_approved ? "Live" : "Sandboxed"}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-brand font-black uppercase tracking-widest flex items-center gap-2">
                                        <Package className="w-3.5 h-3.5" />
                                        Target: {fb.products?.name || "Global Interaction"}
                                    </p>
                                    <p className="text-base text-white/80 leading-relaxed font-medium">"{fb.content}"</p>
                                    <div className="flex items-center gap-4 text-[10px] text-white/20 font-black uppercase tracking-[0.2em] italic pt-2">
                                        <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {new Date(fb.created_at).toLocaleDateString()}</span>
                                        <span className="w-1 h-1 rounded-full bg-white/10" />
                                        <span>ID: {fb.id.slice(0, 8)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-8 shrink-0 relative z-10">
                                {!fb.is_approved && (
                                    <Button
                                        onClick={() => handleApprove(fb.id)}
                                        className="h-14 px-8 bg-green-500/10 border border-green-500/20 text-green-500 hover:bg-green-500 hover:text-black font-black uppercase tracking-[0.2em] italic rounded-2xl transition-all"
                                    >
                                        Authorize
                                    </Button>
                                )}
                                <Button
                                    onClick={() => handleDelete(fb.id)}
                                    variant="ghost"
                                    className="h-14 px-8 text-white/20 hover:text-rose-500 hover:bg-rose-500/10 font-black uppercase tracking-[0.2em] italic rounded-2xl transition-all"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Purge
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AdminLayout>
    )
}
