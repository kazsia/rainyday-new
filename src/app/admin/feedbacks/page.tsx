"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import {
  Search,
  MessageSquare,
  Star,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Package,
  History as HistoryIcon,
  Plus,
  Eye,
  EyeOff,
  FileText,
  MoreHorizontal
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  adminGetFeedbacks,
  adminUpdateFeedback,
  adminDeleteFeedback,
  adminAddManualFeedback,
  Feedback
} from "@/lib/db/feedbacks"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function AdminFeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [ratingFilter, setRatingFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newFeedback, setNewFeedback] = useState({
    email: "",
    rating: 5,
    title: "",
    message: ""
  })

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

  async function handleToggleStatus(id: string, field: 'is_approved' | 'is_public', current: boolean) {
    try {
      await adminUpdateFeedback(id, { [field]: !current })
      toast.success("Status updated")
      loadFeedbacks()
    } catch (error) {
      toast.error("Failed to update status")
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Permanently delete this feedback?")) return
    try {
      await adminDeleteFeedback(id)
      toast.success("Deleted")
      loadFeedbacks()
    } catch (error) {
      toast.error("Failed to delete")
    }
  }

  async function handleAddManualFeedback() {
    if (!newFeedback.email || !newFeedback.message) {
      toast.error("Required fields missing")
      return
    }
    try {
      await adminAddManualFeedback(newFeedback)
      toast.success("Feedback added")
      setIsAddDialogOpen(false)
      setNewFeedback({ email: "", rating: 5, title: "", message: "" })
      loadFeedbacks()
    } catch (error) {
      toast.error("Error adding feedback")
    }
  }

  const filteredFeedbacks = feedbacks.filter(fb => {
    const matchesSearch =
      fb.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fb.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fb.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fb.invoice_id?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "approved" && fb.is_approved) ||
      (statusFilter === "pending" && !fb.is_approved) ||
      (statusFilter === "hidden" && !fb.is_public)

    const matchesRating = ratingFilter === "all" || fb.rating === parseInt(ratingFilter)

    return matchesSearch && matchesStatus && matchesRating
  })

  const avgRating = feedbacks.length > 0
    ? (feedbacks.filter(f => f.is_approved).reduce((acc, curr) => acc + curr.rating, 0) / (feedbacks.filter(f => f.is_approved).length || 1)).toFixed(1)
    : "0.0"

  return (
    <AdminLayout>
      <div className="space-y-4 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Signal Sentiment</h1>
            <p className="text-[11px] font-medium text-[var(--sa-fg-dim)] mt-0.5">Monitor and moderate incoming customer transmission logs</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-8 bg-[var(--sa-accent)] text-black font-black text-[10px] border-none shadow-[0_0_15px_rgba(164,248,255,0.2)] uppercase tracking-widest px-4">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add Review
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[var(--sa-card)] border-[var(--sa-border)] text-white sm:max-w-[400px] p-0 overflow-hidden shadow-2xl">
              <DialogHeader className="p-5 bg-black/20 border-b border-white/5">
                <DialogTitle className="text-sm font-black uppercase tracking-widest">Inject Manual Log</DialogTitle>
                <DialogDescription className="text-[11px] font-medium text-[var(--sa-fg-dim)]">
                  Import a verified review from an external nexus.
                </DialogDescription>
              </DialogHeader>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest ml-1">Identity Tag</Label>
                  <Input
                    value={newFeedback.email}
                    onChange={(e) => setNewFeedback({ ...newFeedback, email: e.target.value })}
                    placeholder="customer@domain.com"
                    className="h-9 bg-black/40 border-white/5 text-xs focus:ring-0 focus:border-[var(--sa-accent-glow)]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest ml-1">Sentiment Rating</Label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setNewFeedback({ ...newFeedback, rating: star })}
                        className={cn(
                          "w-7 h-7 rounded border transition-all flex items-center justify-center",
                          newFeedback.rating >= star
                            ? "bg-[var(--sa-accent-muted)] border-[var(--sa-accent)]/20 text-[var(--sa-accent)]"
                            : "bg-black/40 border-white/5 text-white/20"
                        )}
                      >
                        <Star size={11} className={newFeedback.rating >= star ? "fill-current" : ""} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest ml-1">Headline Descriptor</Label>
                  <Input
                    value={newFeedback.title}
                    onChange={(e) => setNewFeedback({ ...newFeedback, title: e.target.value })}
                    placeholder="Optional summary..."
                    className="h-9 bg-black/40 border-white/5 text-xs focus:ring-0 focus:border-[var(--sa-accent-glow)]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest ml-1">Data Payload</Label>
                  <Textarea
                    value={newFeedback.message}
                    onChange={(e) => setNewFeedback({ ...newFeedback, message: e.target.value })}
                    className="bg-black/40 border-white/5 text-xs min-h-[80px] focus:ring-0 focus:border-[var(--sa-accent-glow)]"
                  />
                </div>
              </div>
              <DialogFooter className="p-5 bg-black/20 border-t border-white/5">
                <Button
                  onClick={handleAddManualFeedback}
                  className="w-full h-8 bg-[var(--sa-accent)] text-black font-black uppercase tracking-widest text-[10px] shadow-[0_0_15px_rgba(164,248,255,0.1)]"
                >
                  Commit Log
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Aggregate Rating", value: avgRating, icon: Star, color: "text-[var(--sa-accent)]" },
            { label: "Total Artifacts", value: feedbacks.length, icon: MessageSquare, color: "text-[var(--sa-fg-dim)]" },
            { label: "Awaiting Review", value: feedbacks.filter(f => !f.is_approved).length, icon: HistoryIcon, color: "text-amber-400" },
            { label: "Organic Origin", value: feedbacks.filter(f => !f.is_admin_added).length, icon: CheckCircle2, color: "text-emerald-400" }
          ].map((stat, i) => (
            <div key={i} className="bg-[var(--sa-card)] border border-[var(--sa-border)] p-3.5 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[9px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest">{stat.label}</p>
                <p className="text-lg font-black text-white tracking-tight">{stat.value}</p>
              </div>
              <stat.icon className={cn("w-3.5 h-3.5", stat.color)} />
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--sa-fg-dim)]" />
            <Input
              placeholder="Filter records..."
              className="h-9 pl-9 bg-[var(--sa-card)] border-[var(--sa-border)] text-[11px] font-medium rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 bg-[var(--sa-card)] border border-[var(--sa-border)] text-[var(--sa-fg-dim)] rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-[var(--sa-accent-glow)] transition-all cursor-pointer"
            >
              <option value="all">ANY STATUS</option>
              <option value="approved">LIVE</option>
              <option value="pending">PENDING</option>
              <option value="hidden">HIDDEN</option>
            </select>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="h-9 px-3 bg-[var(--sa-card)] border border-[var(--sa-border)] text-[var(--sa-fg-dim)] rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-[var(--sa-accent-glow)] transition-all cursor-pointer"
            >
              <option value="all">ANY RATING</option>
              {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} STARS</option>)}
            </select>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 border border-[var(--sa-border)] bg-[var(--sa-card)] text-[var(--sa-fg-dim)] rounded-xl hover:text-white"
              onClick={loadFeedbacks}
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>

        <div className="bg-[var(--sa-card)] border border-[var(--sa-border)] rounded-xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-5 h-5 animate-spin text-[var(--sa-accent)]" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--sa-fg-dim)]">Decoding stream...</p>
            </div>
          ) : filteredFeedbacks.length === 0 ? (
            <div className="p-16 text-center">
              <MessageSquare className="w-8 h-8 mx-auto mb-4 text-[var(--sa-fg-dim)] opacity-20" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--sa-fg-dim)]">No transmission artifacts found</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredFeedbacks.map((fb) => (
                <div key={fb.id} className="p-5 hover:bg-white/[0.01] transition-all group flex gap-5">
                  <div className="shrink-0">
                    <div className="w-9 h-9 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center text-[11px] font-black text-[var(--sa-fg-dim)] uppercase">
                      {fb.email[0]}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-[13px] font-black text-white tracking-tight">{fb.email}</span>
                      <div className="flex items-center gap-0.5 px-2 py-1 rounded bg-black/20 border border-white/5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={cn(
                            "w-2.5 h-2.5",
                            i < fb.rating ? "text-[var(--sa-accent)] fill-[var(--sa-accent)]" : "text-white/10"
                          )} />
                        ))}
                      </div>
                      <div className="flex gap-1.5 items-center ml-auto">
                        {fb.is_admin_added && (
                          <span className="text-[8px] bg-[var(--sa-accent-muted)] text-[var(--sa-accent)] px-2 py-0.5 rounded font-black uppercase tracking-widest leading-none">SYSTEM</span>
                        )}
                        <div className={cn(
                          "text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded leading-none",
                          fb.is_approved ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-[var(--sa-fg-dim)]"
                        )}>
                          {fb.is_approved ? "LIVE" : "PENDING"}
                        </div>
                        {!fb.is_public && (
                          <div className="bg-rose-500/10 text-rose-400 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded leading-none">HIDDEN</div>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 p-0 hover:bg-white/5 rounded-lg">
                              <MoreHorizontal className="w-3.5 h-3.5 text-[var(--sa-fg-dim)]" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[var(--sa-card)] border-[var(--sa-border)] text-[var(--sa-fg-dim)]">
                            <DropdownMenuItem className="text-[10px] font-black uppercase tracking-widest cursor-pointer hover:text-white" onClick={() => handleToggleStatus(fb.id, 'is_approved', fb.is_approved)}>
                              {fb.is_approved ? "Revoke Approval" : "Approve Signal"}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-[10px] font-black uppercase tracking-widest cursor-pointer hover:text-white" onClick={() => handleToggleStatus(fb.id, 'is_public', fb.is_public)}>
                              {fb.is_public ? "Hide Artifact" : "Restore Visibility"}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-[10px] font-black uppercase tracking-widest text-rose-500 focus:text-rose-400 focus:bg-rose-500/10 cursor-pointer" onClick={() => handleDelete(fb.id)}>
                              Purge Record
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="max-w-4xl">
                      {fb.title && <p className="text-xs font-black text-white uppercase tracking-tight mb-1">{fb.title}</p>}
                      <p className="text-[11px] font-medium text-[var(--sa-fg-dim)] leading-relaxed line-clamp-2 ">
                        "{fb.message}"
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-[8px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest pt-2">
                      <span>{new Date(fb.created_at).toLocaleDateString()}</span>
                      {!fb.is_admin_added && (
                        <>
                          <div className="flex items-center gap-1 opacity-50"><FileText size={9} /> {fb.invoice_id?.slice(0, 8)}</div>
                          <div className="flex items-center gap-1 opacity-50"><Package size={9} /> {fb.order_id?.slice(0, 8)}</div>
                        </>
                      )}
                    </div>
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
