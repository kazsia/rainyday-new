"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import {
    Globe,
    Plus,
    CheckCircle2,
    AlertCircle,
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
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Domains</h1>
                        <p className="text-sm text-white/40">Manage custom domains and SSL certificates</p>
                    </div>

                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-brand text-black font-bold hover:bg-brand/90">
                                <Plus className="w-4 h-4 mr-2" />
                                Connect Domain
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#0b1016] border-white/5 text-white sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Connect Custom Domain</DialogTitle>
                                <DialogDescription className="text-white/40">
                                    Enter the domain you want to connect to your project.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <Input
                                    value={newDomain}
                                    onChange={(e) => setNewDomain(e.target.value)}
                                    placeholder="example.com"
                                    className="bg-[#080c10] border-white/10"
                                />
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="text-white/60 hover:text-white hover:bg-white/5">
                                    Cancel
                                </Button>
                                <Button onClick={handleAdd} disabled={isAdding} className="bg-brand text-black font-bold hover:bg-brand/90">
                                    {isAdding && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Connect
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <Input
                            placeholder="Search domains..."
                            className="pl-10 bg-black/20 border-white/10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Domain List */}
                <div className="grid grid-cols-1 gap-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-12 bg-white/5 border border-white/5 rounded-3xl">
                            <Loader2 className="w-8 h-8 animate-spin text-white/20" />
                        </div>
                    ) : domains.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 bg-white/5 border border-white/5 rounded-3xl text-center">
                            <Globe className="w-12 h-12 text-white/20 mb-4" />
                            <h3 className="text-lg font-bold text-white">No domains connected</h3>
                            <p className="text-sm text-white/40">Connect a custom domain to get started.</p>
                        </div>
                    ) : filteredDomains.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 bg-white/5 border border-white/5 rounded-3xl text-center">
                            <Search className="w-12 h-12 text-white/20 mb-4" />
                            <h3 className="text-lg font-bold text-white">No domains match your search</h3>
                            <p className="text-sm text-white/40">Try a different search query.</p>
                        </div>
                    ) : (
                        filteredDomains.map((item) => (
                            <div key={item.id} className="bg-white/5 border border-white/5 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 hover:border-white/10 transition-all group">
                                <div className="flex items-center gap-6 flex-1">
                                    <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center shrink-0">
                                        <Globe className={cn("w-8 h-8", item.status === 'verified' || item.status === 'active' || item.status === 'live' ? "text-brand" : "text-white/40")} />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-xl font-bold text-white">{item.domain}</h3>
                                            {/* Primary badge logic could be added status === 'primary' */}
                                        </div>
                                        <p className="text-xs text-white/40 font-medium">Added {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-12">
                                    <div className="space-y-2 text-right">
                                        <div className="flex items-center gap-2 justify-end">
                                            <div className={cn("w-1.5 h-1.5 rounded-full", (item.status === "live" || item.status === "verified" || item.status === "active") ? "bg-green-500" : "bg-yellow-500")} />
                                            <span className="text-xs font-bold text-white uppercase tracking-widest">{item.status}</span>
                                        </div>
                                        <div className="flex items-center gap-2 justify-end text-[10px] text-white/40 font-bold uppercase tracking-widest">
                                            <Shield className={cn("w-3 h-3", item.ssl_status === "active" ? "text-brand" : "text-yellow-500")} />
                                            SSL {item.ssl_status}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button onClick={() => handleRefresh(item.id)} variant="ghost" size="icon" className="h-10 w-10 text-white/20 hover:text-white">
                                            <RefreshCw className="w-4 h-4" />
                                        </Button>
                                        <Button onClick={() => handleDelete(item.id)} variant="ghost" size="icon" className="h-10 w-10 text-white/20 hover:text-red-500">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* DNS Info */}
                <div className="bg-white/5 border border-white/5 rounded-3xl p-8 space-y-6">
                    <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 text-brand" />
                        <h2 className="text-xl font-bold text-white">DNS Configuration</h2>
                    </div>
                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5 font-mono text-xs space-y-3">
                        <div className="grid grid-cols-3 gap-4 border-b border-white/5 pb-2 text-white/20 font-bold uppercase tracking-widest">
                            <span>Type</span>
                            <span>Name</span>
                            <span>Value</span>
                        </div>
                        {settings?.dns?.records?.map((record, i) => (
                            <div key={i} className="grid grid-cols-3 gap-4 text-white/60">
                                <span>{record.type}</span>
                                <span className="truncate">{record.name}</span>
                                <span className="truncate">{record.value}</span>
                            </div>
                        )) || (
                                <div className="text-white/40 text-center py-4">Loading DNS records...</div>
                            )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}
