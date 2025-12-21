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
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Blacklist</h1>
                        <p className="text-sm text-white/40">Manage banned users, IPs, and email domains</p>
                    </div>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-brand text-black font-bold hover:bg-brand/90">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Entry
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#0a1628] border-white/5 text-white max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Create Blacklist Entry</DialogTitle>
                                <DialogDescription className="text-white/40">
                                    Fill in the details below to create a new blacklist entry.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6 py-4">
                                {/* Type Selection */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-white">Type</label>
                                    <div className="flex flex-wrap gap-2">
                                        {ENTRY_TYPES.map((type) => (
                                            <button
                                                key={type.id}
                                                onClick={() => setSelectedType(type.id)}
                                                className={cn(
                                                    "px-4 py-2 rounded-lg text-sm font-medium transition-all border",
                                                    selectedType === type.id
                                                        ? "bg-brand/10 border-brand text-brand"
                                                        : "bg-white/5 border-transparent text-white/60 hover:text-white hover:bg-white/10"
                                                )}
                                            >
                                                {type.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Match Type */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-white">Match Type</label>
                                    <div className="flex gap-2">
                                        {(['exact', 'regex'] as const).map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => setMatchType(type)}
                                                className={cn(
                                                    "px-4 py-2 rounded-lg text-sm font-medium transition-all border capitalize",
                                                    matchType === type
                                                        ? "bg-brand/10 border-brand text-brand"
                                                        : "bg-white/5 border-transparent text-white/60 hover:text-white hover:bg-white/10"
                                                )}
                                            >
                                                {type === 'regex' ? 'Regex' : 'Exact Match'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Value Input */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-white capitalize">{selectedType.replace('_', ' ')}</label>
                                    <Input
                                        value={value}
                                        onChange={e => setValue(e.target.value)}
                                        placeholder={`Enter ${selectedType.replace('_', ' ')}...`}
                                        className="bg-[#080c10] border-white/10 h-11"
                                    />
                                </div>

                                {/* Reason Input */}
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <label className="text-sm font-bold text-white">Reason <span className="text-white/40 font-normal">(optional)</span></label>
                                    </div>
                                    <Textarea
                                        value={reason}
                                        onChange={e => setReason(e.target.value)}
                                        placeholder="Why is this entry being blacklisted?"
                                        className="bg-[#080c10] border-white/10 min-h-[80px]"
                                    />
                                </div>

                                {/* Placeholder for Payment Methods (Optional/Advanced) */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-white">Applicable Payment Methods <span className="text-white/40 font-normal">(optional)</span></label>
                                    <p className="text-xs text-white/40">If left empty, the blacklist rule will apply to every payment method.</p>
                                    <Select>
                                        <SelectTrigger className="bg-[#080c10] border-white/10 h-11 text-white/40">
                                            <SelectValue placeholder="Applicable Payment Methods" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Methods</SelectItem>
                                            {/* Add more methods later */}
                                        </SelectContent>
                                    </Select>
                                </div>

                            </div>

                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsCreateOpen(false)} className="text-white/60 hover:text-white hover:bg-white/5">
                                    Cancel
                                </Button>
                                <Button onClick={handleCreate} disabled={isCreating} className="bg-brand text-black font-bold hover:bg-brand/90 min-w-[100px]">
                                    {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
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
                            placeholder="Search blacklisted entries..."
                            className="pl-10 bg-[#0a1628]/20 border-white/10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Blacklist Items */}
                {isLoading ? (
                    <div className="flex items-center justify-center h-64 bg-white/5 border border-white/5 rounded-2xl">
                        <Loader2 className="w-8 h-8 animate-spin text-white/20" />
                    </div>
                ) : (
                    <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
                        {filteredEntries.length === 0 ? (
                            <div className="p-12 text-center text-white/40">
                                <ShieldAlert className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>No blacklisted entries found.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {filteredEntries.map((item) => (
                                    <div key={item.id} className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-white/[0.02] transition-colors group">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                                                <Ban className="w-6 h-6 text-red-500" />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-white">{item.value}</h3>
                                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/10 text-white/40 uppercase tracking-wider">
                                                        {item.type.replace('_', ' ')}
                                                    </span>
                                                    {item.match_type === 'regex' && (
                                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 uppercase tracking-wider border border-purple-500/20">
                                                            REGEX
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-white/60 font-medium">{item.reason || "No reason provided"}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <div className="text-right hidden md:block">
                                                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">Created</p>
                                                <p className="text-sm text-white/60 font-medium">{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</p>
                                            </div>
                                            <Button
                                                onClick={() => handleDelete(item.id)}
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 text-white/20 hover:text-red-500 hover:bg-red-500/10"
                                            >
                                                <Trash2 className="w-4 h-4" />
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
