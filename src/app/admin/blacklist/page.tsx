"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import {
  Ban,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  Loader2,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { getBlacklist, createBlacklistEntry, deleteBlacklistEntry, type BlacklistEntry, type BlacklistType, type MatchType } from "@/lib/db/blacklist"
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
import { Textarea } from "@/components/ui/textarea"
import { formatDistanceToNow } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const ENTRY_TYPES: { id: BlacklistType; label: string }[] = [
  { id: 'email', label: 'Email' },
  { id: 'ip', label: 'IP Address' },
  { id: 'user_agent', label: 'User Agent' },
  { id: 'discord', label: 'Discord ID' },
  { id: 'asn', label: 'ASN' },
  { id: 'country', label: 'Country' }
]

export default function AdminBlacklistPage() {
  const [entries, setEntries] = useState<BlacklistEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Form State
  const [selectedType, setSelectedType] = useState<BlacklistType>('email')
  const [matchType, setMatchType] = useState<MatchType>('exact')
  const [value, setValue] = useState("")
  const [reason, setReason] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const data = await getBlacklist()
      setEntries(data)
    } catch (error) {
      toast.error("Failed to load blacklist")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCreate() {
    if (!value) return toast.error("Please enter a value")

    setIsCreating(true)
    try {
      await createBlacklistEntry({
        type: selectedType,
        match_type: matchType,
        value,
        reason: reason || null
      })
      toast.success("Entry created successfully")
      setIsCreateOpen(false)
      resetForm()
      loadData()
    } catch (error) {
      toast.error("Failed to create entry")
    } finally {
      setIsCreating(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to remove this entry?")) return
    try {
      await deleteBlacklistEntry(id)
      toast.success("Entry removed")
      loadData()
    } catch (error) {
      toast.error("Failed to remove entry")
    }
  }

  function resetForm() {
    setSelectedType('email')
    setMatchType('exact')
    setValue("")
    setReason("")
  }

  const filteredEntries = entries.filter(item =>
    item.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-[100rem] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Security Blacklist</h1>
            <p className="text-[11px] font-medium text-[var(--sa-fg-dim)] mt-0.5">Automated ban protocols for bad actors and VPN/Proxy traffic</p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="h-8 bg-[var(--sa-accent)] text-black font-black text-[10px] border-none shadow-[0_0_15px_rgba(164,248,255,0.2)] uppercase tracking-widest px-4">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[var(--sa-card)] border-[var(--sa-border)] text-white sm:max-w-[500px] p-0 overflow-hidden shadow-2xl">
              <DialogHeader className="p-5 bg-black/20 border-b border-white/5">
                <DialogTitle className="text-sm font-black uppercase tracking-widest">Create Detection Rule</DialogTitle>
                <DialogDescription className="text-[11px] font-medium text-[var(--sa-fg-dim)]">
                  Configure a new automated rejection node for the firewall.
                </DialogDescription>
              </DialogHeader>

              <div className="p-5 space-y-5">
                {/* Type Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest ml-1">Entity Type</label>
                  <div className="flex flex-wrap gap-1.5">
                    {ENTRY_TYPES.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border",
                          selectedType === type.id
                            ? "bg-[var(--sa-accent)] text-black border-none"
                            : "bg-white/5 border-white/5 text-[var(--sa-fg-dim)] hover:text-white hover:bg-white/10"
                        )}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Match Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest ml-1">Logic Pattern</label>
                    <div className="flex gap-1.5">
                      {(['exact', 'regex'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setMatchType(type)}
                          className={cn(
                            "flex-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border",
                            matchType === type
                              ? "bg-[var(--sa-accent-muted)] border-[var(--sa-accent-glow)] text-[var(--sa-accent)]"
                              : "bg-white/5 border-white/5 text-[var(--sa-fg-dim)] hover:text-white hover:bg-white/10"
                          )}
                        >
                          {type === 'regex' ? 'Regex' : 'Exact Match'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Value Input */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest ml-1">{selectedType.replace('_', ' ')} Identifier</label>
                    <Input
                      value={value}
                      onChange={e => setValue(e.target.value)}
                      placeholder={`Value...`}
                      className="bg-black/40 border-white/5 h-9 text-xs focus:ring-0 focus:border-[var(--sa-accent-glow)]"
                    />
                  </div>
                </div>

                {/* Reason Input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest ml-1">Incident Report <span className="text-[10px] opacity-30 font-medium lowercase">(optional)</span></label>
                  <Textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Internal notes regarding this blacklist entry..."
                    className="bg-black/40 border-white/5 min-h-[70px] text-xs resize-none"
                  />
                </div>
              </div>

              <DialogFooter className="p-5 bg-black/20 border-t border-white/5 sm:justify-end gap-2">
                <Button variant="ghost" onClick={() => setIsCreateOpen(false)} className="h-8 text-[10px] font-bold uppercase tracking-widest text-[var(--sa-fg-dim)] hover:text-white hover:bg-white/5">
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={isCreating} className="h-8 bg-rose-500/20 border border-rose-500/30 text-rose-500 font-black text-[10px] uppercase tracking-widest px-6 hover:bg-rose-500/30 transition-all">
                  {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Authorize Ban"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 bg-[var(--sa-card)] p-2.5 rounded-xl border border-[var(--sa-border)] shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--sa-fg-dim)]" />
            <Input
              placeholder="Filter active blacklist protocols..."
              className="h-9 pl-9 bg-black/20 border-white/5 text-[11px] font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48 bg-[var(--sa-card)] border border-[var(--sa-border)] rounded-xl">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--sa-accent)]" />
          </div>
        ) : (
          <div className="bg-[var(--sa-card)] border border-[var(--sa-border)] rounded-xl overflow-hidden shadow-sm">
            {filteredEntries.length === 0 ? (
              <div className="p-12 text-center">
                <ShieldAlert className="w-10 h-10 mx-auto mb-3 text-[var(--sa-fg-dim)] opacity-20" />
                <p className="text-[10px] font-black text-[var(--sa-fg-dim)] uppercase tracking-[0.2em]">Zero Threats Detected</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredEntries.map((item) => (
                  <div key={item.id} className="p-4 flex flex-col md:flex-row items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors group">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-rose-500/5 border border-rose-500/10 flex items-center justify-center shrink-0">
                        <Ban className="w-5 h-5 text-rose-500/60" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-white tracking-tight">{item.value}</h3>
                          <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-white/5 text-[var(--sa-fg-dim)] uppercase tracking-widest border border-white/5">
                            {item.type.replace('_', ' ')}
                          </span>
                          {item.match_type === 'regex' && (
                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-purple-500/5 text-purple-400/60 uppercase tracking-widest border border-purple-500/10">
                              REGEX
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[var(--sa-fg-dim)] font-black uppercase tracking-widest leading-none">{item.reason || "No incident description"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden md:block">
                        <p className="text-[8px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest mb-0.5 ">Isolation Log</p>
                        <p className="text-[10px] text-white/60 font-medium">{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</p>
                      </div>
                      <Button
                        onClick={() => handleDelete(item.id)}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white/20 hover:text-rose-500 hover:bg-rose-500/5 rounded-lg border border-transparent hover:border-rose-500/10 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
