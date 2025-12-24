"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import {
    Globe,
    Plus,
    CheckCircle2,
    CircleAlert,
    ExternalLink,
    Search,
    RefreshCw,
    Shield,
    Trash2,
    Lock,
    Loader2,
    X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { getDomains, addDomain, deleteDomain, refreshDomain, type Domain } from "@/lib/db/domains"
import { getSiteSettings, type SiteSettings } from "@/lib/db/settings"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { formatDistanceToNow } from "date-fns"

export default function AdminDomainsPage() {
    const [domains, setDomains] = useState<Domain[]>([])
    const [settings, setSettings] = useState<SiteSettings | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [newDomain, setNewDomain] = useState("")
    const [isAdding, setIsAdding] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        loadData()
    }, [])
    async function loadData() {
        try {
            const [domainsData, settingsData] = await Promise.all([
                getDomains(),
                getSiteSettings()
            ])
            setDomains(domainsData)
            setSettings(settingsData)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load data")
        } finally {
            setIsLoading(false)
        }
    }

    async function handleAdd() {
        if (!newDomain) return
        setIsAdding(true)
        try {
            await addDomain(newDomain)
            toast.success("Domain added successfully")
            setNewDomain("")
            setIsAddOpen(false)
            loadData()
        } catch (error: any) {
            toast.error(error.message || "Failed to add domain")
        } finally {
            setIsAdding(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to remove this domain?")) return
        try {
            await deleteDomain(id)
            toast.success("Domain removed")
            loadData()
        } catch (error) {
            toast.error("Failed to remove domain")
        }
    }

    async function handleRefresh(id: string) {
        try {
            await refreshDomain(id)
            toast.success("Domain status updated")
            loadData()
        } catch (error) {
            toast.error("Failed to refresh domain status")
        }
    }

    const filteredDomains = domains.filter(d =>
        d.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.status.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <AdminLayout>
            <div className="space-y-6 max-w-[100rem] mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight">External Domains</h1>
                        <p className="text-[11px] font-medium text-[var(--sa-fg-dim)] mt-0.5">Configure edge routing and SSL certificates for your storefront</p>
                    </div>

                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-8 bg-[var(--sa-accent)] text-black font-black text-[10px] border-none shadow-[0_0_15px_rgba(164,248,255,0.2)] uppercase tracking-widest px-4">
                                <Plus className="w-3.5 h-3.5 mr-1.5" />
                                Add Domain
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[var(--sa-card)] border-[var(--sa-border)] text-white sm:max-w-[400px] p-0 overflow-hidden shadow-2xl">
                            <DialogHeader className="p-5 bg-black/20 border-b border-white/5">
                                <DialogTitle className="text-sm font-black uppercase tracking-widest">Link Custom Resource</DialogTitle>
                                <DialogDescription className="text-[11px] font-medium text-[var(--sa-fg-dim)]">
                                    Enter the fully qualified domain name to begin point-to-point bridge.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="p-5">
                                <label className="text-[10px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest ml-1 mb-1.5 block">Target FQDN</label>
                                <Input
                                    value={newDomain}
                                    onChange={(e) => setNewDomain(e.target.value)}
                                    placeholder="shop.example.com"
                                    className="h-9 bg-black/40 border-white/5 text-xs focus:ring-0 focus:border-[var(--sa-accent-glow)]"
                                />
                            </div>
                            <DialogFooter className="p-5 bg-black/20 border-t border-white/5 sm:justify-end gap-2">
                                <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="h-8 text-[10px] font-bold uppercase tracking-widest text-[var(--sa-fg-dim)] hover:text-white hover:bg-white/5">
                                    Cancel
                                </Button>
                                <Button onClick={handleAdd} disabled={isAdding} className="h-8 bg-[var(--sa-accent)] text-black font-black text-[10px] uppercase tracking-widest px-6 shadow-[0_0_15px_rgba(164,248,255,0.1)]">
                                    {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Bridge Domain"}
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
                            placeholder="Filter active deployments..."
                            className="h-9 pl-9 bg-black/20 border-white/5 text-[11px] font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Domain List */}
                <div className="grid grid-cols-1 gap-3">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-12 bg-[var(--sa-card)] border border-[var(--sa-border)] rounded-xl">
                            <Loader2 className="w-6 h-6 animate-spin text-[var(--sa-accent)]" />
                        </div>
                    ) : domains.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 bg-[var(--sa-card)] border border-[var(--sa-border)] rounded-xl text-center">
                            <Globe className="w-8 h-8 text-[var(--sa-fg-dim)] opacity-20 mb-3" />
                            <h3 className="text-[11px] font-black text-[var(--sa-fg-dim)] uppercase tracking-[0.2em]">No deployments found</h3>
                        </div>
                    ) : filteredDomains.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 bg-[var(--sa-card)] border border-[var(--sa-border)] rounded-xl text-center">
                            <Search className="w-8 h-8 text-[var(--sa-fg-dim)] opacity-20 mb-3" />
                            <h3 className="text-[11px] font-black text-[var(--sa-fg-dim)] uppercase tracking-[0.2em]">No matching nodes</h3>
                        </div>
                    ) : (
                        filteredDomains.map((item) => (
                            <div key={item.id} className="bg-[var(--sa-card)] border border-[var(--sa-border)] rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 hover:bg-white/[0.01] transition-all group">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center shrink-0">
                                        <Globe className={cn("w-5 h-5", item.status === 'verified' || item.status === 'active' || item.status === 'live' ? "text-[var(--sa-accent)]" : "text-white/20")} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-black text-white tracking-tight">{item.domain}</h3>
                                            <div className={cn("flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest leading-none", (item.status === "live" || item.status === "verified" || item.status === "active") ? "bg-[var(--sa-accent-muted)] text-[var(--sa-accent)]" : "bg-yellow-500/10 text-yellow-500")}>
                                                <div className={cn("w-1 h-1 rounded-full", (item.status === "live" || item.status === "verified" || item.status === "active") ? "bg-[var(--sa-accent)]" : "bg-yellow-500")} />
                                                {item.status}
                                            </div>
                                        </div>
                                        <p className="text-[9px] text-[var(--sa-fg-dim)] font-black uppercase tracking-widest leading-none">Bridge Established {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8">
                                    <div className="flex items-center gap-2 px-2 py-1 rounded bg-black/20 border border-white/5 text-[9px] text-[var(--sa-fg-dim)] font-black uppercase tracking-widest">
                                        <Shield className={cn("w-3 h-3", item.ssl_status === "active" ? "text-[var(--sa-accent)]" : "text-yellow-500")} />
                                        HTTPS {item.ssl_status}
                                    </div>
                                    <div className="flex gap-1.5">
                                        <Button onClick={() => handleRefresh(item.id)} variant="ghost" size="icon" className="h-8 w-8 text-white/20 hover:text-[var(--sa-accent)] hover:bg-[var(--sa-accent-muted)] rounded-lg">
                                            <RefreshCw className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button onClick={() => handleDelete(item.id)} variant="ghost" size="icon" className="h-8 w-8 text-white/20 hover:text-rose-500 hover:bg-rose-500/5 rounded-lg">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* DNS Info */}
                <div className="bg-[var(--sa-card)] border border-[var(--sa-border)] rounded-xl p-5 space-y-4 shadow-sm">
                    <div className="flex items-center gap-2.5">
                        <Lock className="w-4 h-4 text-[var(--sa-accent)]" />
                        <h2 className="text-xs font-black uppercase tracking-widest text-white">DNS Core Integration</h2>
                    </div>
                    <div className="p-4 bg-black/40 rounded-lg border border-white/5 font-mono text-[10px] space-y-2">
                        <div className="grid grid-cols-3 gap-4 border-b border-white/5 pb-2 text-[8px] text-[var(--sa-fg-dim)] font-black uppercase tracking-widest">
                            <span>Proto</span>
                            <span>Node Label</span>
                            <span>Value Descriptor</span>
                        </div>
                        {settings?.dns?.records?.map((record, i) => (
                            <div key={i} className="grid grid-cols-3 gap-4 text-white/60">
                                <span className="text-[var(--sa-accent)]">{record.type}</span>
                                <span className="truncate">{record.name}</span>
                                <span className="truncate opacity-40">{record.value}</span>
                            </div>
                        )) || (
                                <div className="text-[var(--sa-fg-dim)] text-center py-4 font-black uppercase tracking-widest">Awaiting DNS Response...</div>
                            )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}
