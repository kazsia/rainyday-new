"use client"

import { useEffect, useState, useCallback } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import {
    Users,
    Search,
    Filter,
    MoreVertical,
    ExternalLink,
    Ban,
    ShieldCheck,
    ShieldAlert,
    History,
    CreditCard,
    Package,
    LogOut,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    UserPlus,
    UserX,
    Shield,
    Download,
    Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { getCustomers, updateCustomerStatus, updateCustomerRole, forceUserLogout } from "@/lib/actions/admin-customers"
import { CustomerDetailDrawer } from "@/components/admin/customers/customer-detail-drawer"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"

import { AddCustomerModal } from "@/components/admin/customers/add-customer-modal"

export default function AdminCustomersPage() {
    const [users, setUsers] = useState<any[]>([])
    const [count, setCount] = useState(0)
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [isLoading, setIsLoading] = useState(true)
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)

    const loadData = useCallback(async () => {
        setIsLoading(true)
        const res = await getCustomers(page, search, statusFilter)
        if (res.success) {
            setUsers(res.users || [])
            setCount(res.count || 0)
        } else {
            toast.error(res.error || "Failed to load customers")
        }
        setIsLoading(false)
    }, [page, search, statusFilter])

    useEffect(() => {
        loadData()

        const supabase = createClient()
        const channel = supabase
            .channel('customer_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => loadData())
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [loadData])

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value)
        setPage(1)
    }

    const openDetails = (userId: string) => {
        setSelectedUserId(userId)
        setIsDrawerOpen(true)
    }

    const handleExportCSV = () => {
        if (users.length === 0) {
            toast.error("No customers to export")
            return
        }

        const headers = ["ID", "Email", "Full Name", "Role", "Balance", "Joined"]
        const csvContent = [
            headers.join(","),
            ...users.map(u => [
                u.id,
                u.email,
                `"${u.full_name || ''}"`,
                u.role,
                u.balance,
                new Date(u.created_at).toLocaleDateString()
            ].join(","))
        ].join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", `customers_export_${new Date().toISOString().slice(0, 10)}.csv`)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success("Exported successfuly")
    }

    const totalPages = Math.ceil(count / 20)

    return (
        <AdminLayout>
            <div className="space-y-6 max-w-[100rem] mx-auto">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight">Customers</h1>
                        <p className="text-[11px] font-medium text-[var(--sa-fg-dim)] mt-0.5">Manage your global user base and engagement.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            asChild
                            className="h-8 px-4 bg-[var(--sa-accent)] hover:bg-[var(--sa-accent-bright)] text-black text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
                            onClick={() => setIsAddModalOpen(true)}
                        >
                            <span>
                                <Plus className="w-3.5 h-3.5 mr-2 stroke-[3]" />
                                Add Customer
                            </span>
                        </Button>
                    </div>
                </div>

                <AddCustomerModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={loadData}
                />

                {/* Toolbar */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 bg-[var(--sa-card)] border border-[var(--sa-border)] p-2 rounded-xl">
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                        <Button
                            variant="outline"
                            className="h-8 bg-white/5 border-white/5 text-[var(--sa-fg-muted)] hover:text-white hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest px-3"
                            onClick={loadData}
                        >
                            <RefreshCw className={cn("w-3.5 h-3.5 mr-2", isLoading && "animate-spin text-[var(--sa-accent)]")} />
                            Refresh
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 bg-white/5 border-white/5 text-[var(--sa-fg-muted)] hover:text-white hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest px-3"
                            onClick={handleExportCSV}
                        >
                            <Download className="w-3.5 h-3.5 mr-2" />
                            Export to CSV
                        </Button>
                        <div className="w-px h-4 bg-white/5 mx-1" />
                        <div className="relative group">
                            <select
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                                className="h-8 pl-8 pr-4 bg-transparent border border-white/5 text-[var(--sa-fg-muted)] hover:text-white rounded-lg appearance-none cursor-pointer transition-all focus:border-[var(--sa-accent-glow)] focus:ring-0 text-[10px] font-bold uppercase tracking-widest"
                            >
                                <option value="all">Status</option>
                                <option value="active">Active</option>
                                <option value="suspended">Suspended</option>
                                <option value="banned">Banned</option>
                            </select>
                            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--sa-fg-dim)] pointer-events-none" />
                        </div>
                    </div>

                    <div className="relative flex-1 lg:max-w-xs ml-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--sa-fg-dim)]" />
                        <Input
                            placeholder="Quick Search by Email or Name..."
                            className="pl-9 bg-black/20 border-white/5 h-8 text-[11px] text-white placeholder:text-[var(--sa-fg-dim)] focus:border-[var(--sa-accent-glow)] transition-all"
                            value={search}
                            onChange={handleSearch}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
                    {['all', 'active', 'suspended', 'banned'].map((s) => (
                        <button
                            key={s}
                            onClick={() => { setStatusFilter(s); setPage(1); }}
                            className={cn(
                                "px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest transition-all border",
                                statusFilter === s
                                    ? "bg-[var(--sa-accent-muted)] text-[var(--sa-accent)] border-[var(--sa-accent-glow)] shadow-[0_0_10px_-2px_var(--sa-accent-glow)]"
                                    : "text-[var(--sa-fg-dim)] border-transparent hover:text-white hover:bg-white/5"
                            )}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                {/* Main Table Content */}
                <div className="bg-[var(--sa-card)] border border-[var(--sa-border)] rounded-xl overflow-hidden relative min-h-[400px]">
                    <AnimatePresence>
                        {isLoading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-50 bg-[var(--sa-bg)]/50 backdrop-blur-[2px] flex items-center justify-center"
                            >
                                <RefreshCw className="w-6 h-6 text-[var(--sa-accent)] animate-spin" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-[var(--sa-border)] bg-black/20">
                                    <th className="px-5 py-3 text-[9px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest">Customer Identity</th>
                                    <th className="px-5 py-3 text-[9px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest text-center">Type</th>
                                    <th className="px-5 py-3 text-[9px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest">Financials</th>
                                    <th className="px-5 py-3 text-[9px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest">Engagement</th>
                                    <th className="px-5 py-3 text-[9px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest text-right">Control</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--sa-border)]">
                                {users.length > 0 ? (
                                    users.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="hover:bg-[var(--sa-card-hover)] transition-colors cursor-pointer group"
                                            onClick={() => openDetails(user.id)}
                                        >
                                            <td className="px-5 py-2.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-[var(--sa-border)] flex items-center justify-center text-[10px] font-black text-[var(--sa-fg-bright)] overflow-hidden uppercase">
                                                            {user.avatar_url ? (
                                                                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                (user.full_name || user.email || "?").charAt(0)
                                                            )}
                                                        </div>
                                                        {user.status !== 'active' && (
                                                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded bg-[var(--sa-error)] border border-[var(--sa-card)] flex items-center justify-center">
                                                                <Ban className="w-2 h-2 text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-white flex items-center gap-1.5 group-hover:text-[var(--sa-accent)] transition-colors">
                                                            {user.full_name || user.email?.split('@')[0] || "Anonymous"}
                                                            {user.role === 'admin' && <Shield className="w-3 h-3 text-[var(--sa-warning)]" />}
                                                        </p>
                                                        <p className="text-[10px] text-[var(--sa-fg-dim)] font-medium">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-2.5 text-center">
                                                <span className={cn(
                                                    "text-[9px] font-black uppercase tracking-wider py-0.5 px-1.5 rounded border",
                                                    user.is_registered
                                                        ? "text-emerald-400 bg-emerald-400/5 border-emerald-400/10"
                                                        : "text-[var(--sa-fg-dim)] bg-white/5 border-white/5"
                                                )}>
                                                    {user.is_registered ? "Member" : "Guest"}
                                                </span>
                                            </td>
                                            <td className="px-5 py-2.5">
                                                <p className="text-xs font-black text-white">
                                                    ${Number(user.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </p>
                                            </td>
                                            <td className="px-5 py-2.5">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "w-1.5 h-1.5 rounded-full",
                                                        user.newsletter_subscribed ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-[var(--sa-fg-dim)]"
                                                    )} />
                                                    <span className="text-[10px] font-bold text-[var(--sa-fg-dim)] uppercase tracking-tighter">
                                                        {user.newsletter_subscribed ? "Subscribed" : "None"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-[var(--sa-fg-dim)] hover:text-white transition-colors">
                                                            <MoreVertical className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-[var(--sa-card)] border-[var(--sa-border)] text-white p-1">
                                                        <DropdownMenuItem onClick={() => openDetails(user.id)} className="text-[11px] font-bold cursor-pointer focus:bg-[var(--sa-accent-muted)] focus:text-[var(--sa-accent)]">
                                                            <ExternalLink className="w-3.5 h-3.5 mr-2" />
                                                            View Profile
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-white/5" />
                                                        <DropdownMenuItem onClick={async () => {
                                                            const res = await forceUserLogout(user.id);
                                                            if (res.success) toast.success("Client Logged Out");
                                                        }} className="text-[11px] font-bold cursor-pointer focus:bg-rose-400/10 focus:text-rose-400">
                                                            <LogOut className="w-3.5 h-3.5 mr-2" />
                                                            Revoke Sessions
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-[var(--sa-fg-dim)] text-xs font-medium">
                                            No customers found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        <div className="lg:hidden divide-y divide-[var(--sa-border)]">
                            {users.length > 0 ? (
                                users.map((user) => (
                                    <div
                                        key={user.id}
                                        className="p-4 space-y-4 hover:bg-[var(--sa-card-hover)] transition-colors cursor-pointer"
                                        onClick={() => openDetails(user.id)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="relative">
                                                    <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-[var(--sa-border)] flex items-center justify-center text-[10px] font-black text-[var(--sa-fg-bright)] overflow-hidden uppercase">
                                                        {user.avatar_url ? (
                                                            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            (user.full_name || user.email || "?").charAt(0)
                                                        )}
                                                    </div>
                                                    {user.status !== 'active' && (
                                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded bg-[var(--sa-error)] border border-[var(--sa-card)] flex items-center justify-center">
                                                            <Ban className="w-2 h-2 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-white flex items-center gap-1.5 group-hover:text-[var(--sa-accent)] transition-colors">
                                                        {user.full_name || user.email?.split('@')[0] || "Anonymous"}
                                                        {user.role === 'admin' && <Shield className="w-3 h-3 text-[var(--sa-warning)]" />}
                                                    </p>
                                                    <p className="text-[10px] text-[var(--sa-fg-dim)] font-medium">{user.email}</p>
                                                </div>
                                            </div>
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-wider py-0.5 px-1.5 rounded border",
                                                user.is_registered
                                                    ? "text-emerald-400 bg-emerald-400/5 border-emerald-400/10"
                                                    : "text-[var(--sa-fg-dim)] bg-white/5 border-white/5"
                                            )}>
                                                {user.is_registered ? "Member" : "Guest"}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest">Financials</p>
                                                <p className="text-sm font-black text-[var(--sa-accent)]">
                                                    ${Number(user.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-[var(--sa-fg-dim)] uppercase tracking-widest">Engagement</p>
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "w-1.5 h-1.5 rounded-full",
                                                        user.newsletter_subscribed ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-[var(--sa-fg-dim)]"
                                                    )} />
                                                    <span className="text-[10px] font-bold text-[var(--sa-fg-dim)] uppercase tracking-tighter">
                                                        {user.newsletter_subscribed ? "Subscribed" : "None"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-1 border-t border-white/5" onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-7 px-3 text-[var(--sa-fg-dim)] hover:text-white bg-white/[0.02] border border-white/5 text-[10px] font-bold uppercase tracking-widest gap-1.5 transition-all">
                                                        <MoreVertical className="w-3 h-3" />
                                                        Manage
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-[var(--sa-card)] border-[var(--sa-border)] text-white p-1">
                                                    <DropdownMenuItem onClick={() => openDetails(user.id)} className="text-[11px] font-bold cursor-pointer focus:bg-[var(--sa-accent-muted)] focus:text-[var(--sa-accent)]">
                                                        <ExternalLink className="w-3.5 h-3.5 mr-2" />
                                                        View Profile
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-white/5" />
                                                    <DropdownMenuItem onClick={async () => {
                                                        const res = await forceUserLogout(user.id);
                                                        if (res.success) toast.success("Client Logged Out");
                                                    }} className="text-[11px] font-bold cursor-pointer focus:bg-rose-400/10 focus:text-rose-400">
                                                        <LogOut className="w-3.5 h-3.5 mr-2" />
                                                        Revoke Sessions
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center text-[var(--sa-fg-dim)] text-xs font-medium">
                                    No customers found.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pagination */}
                    <div className="p-3 border-t border-[var(--sa-border)] flex items-center justify-between bg-black/20">
                        <p className="text-[10px] text-[var(--sa-fg-dim)] font-black uppercase tracking-widest">
                            Showing <span className="text-white">{users.length}</span> of <span className="text-white">{count}</span>
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                                className="h-7 w-7 p-0 bg-transparent border-white/5 text-[var(--sa-fg-dim)] hover:text-white hover:bg-white/5 transition-all"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </Button>
                            <span className="text-[10px] font-black text-[var(--sa-fg-dim)] uppercase tracking-tighter">Page {page} of {totalPages || 1}</span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page === totalPages || totalPages === 0}
                                onClick={() => setPage(page + 1)}
                                className="h-7 w-7 p-0 bg-transparent border-white/5 text-[var(--sa-fg-dim)] hover:text-white hover:bg-white/5 transition-all"
                            >
                                <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {selectedUserId && (
                <CustomerDetailDrawer
                    userId={selectedUserId}
                    isOpen={isDrawerOpen}
                    onClose={() => setIsDrawerOpen(false)}
                />
            )}
        </AdminLayout>
    )
}
