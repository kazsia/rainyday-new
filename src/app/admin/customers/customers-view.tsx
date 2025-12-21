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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">
                            Customers
                        </h1>
                        <p className="text-sm text-[var(--sa-fg-muted)] mt-1 max-w-xl leading-relaxed">
                            Monitor and manage your global customer base.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={handleExportCSV}
                            className="h-9 px-4 bg-[var(--sa-card)] border-[var(--sa-border)] text-[var(--sa-fg)] hover:text-white hover:border-[var(--sa-border-hover)] rounded-lg transition-all text-xs font-medium"
                        >
                            <Download className="w-3.5 h-3.5 mr-2 text-[var(--sa-fg-dim)]" />
                            Export
                        </Button>
                        <Button
                            onClick={() => setIsAddModalOpen(true)}
                            className="h-9 px-4 bg-brand hover:bg-brand/90 text-black border border-transparent rounded-lg transition-all text-xs font-bold shadow-[0_0_15px_-3px_rgba(var(--brand-rgb),0.3)]"
                        >
                            <Plus className="w-3.5 h-3.5 mr-2" />
                            Add Customer
                        </Button>
                    </div>
                </div>

                <AddCustomerModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={loadData}
                />

                {/* Filters & Toolbar */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--sa-fg-dim)]" />
                        <Input
                            placeholder="Search customers by name, email, or ID..."
                            className="pl-9 h-10 bg-[var(--sa-card)] border-[var(--sa-border)] text-[var(--sa-fg)] placeholder:text-[var(--sa-fg-dim)] focus:border-[var(--sa-accent)]/50 focus:ring-0 rounded-lg transition-all text-sm"
                            value={search}
                            onChange={handleSearch}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="h-10 px-4 bg-[var(--sa-card)] border-[var(--sa-border)] text-[var(--sa-fg-muted)] hover:text-white hover:border-[var(--sa-border-hover)] rounded-lg transition-all text-xs font-medium">
                            <Filter className="w-3.5 h-3.5 mr-2 opacity-70" />
                            Filters
                        </Button>
                        <Button variant="outline" className="h-10 w-10 p-0 bg-[var(--sa-card)] border-[var(--sa-border)] text-[var(--sa-fg-muted)] hover:text-white hover:border-[var(--sa-border-hover)] rounded-lg transition-all" onClick={() => loadData()}>
                            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin text-[var(--sa-accent)]")} />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {['all', 'active', 'suspended', 'banned'].map((s) => (
                        <button
                            key={s}
                            onClick={() => { setStatusFilter(s); setPage(1); }}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all",
                                statusFilter === s
                                    ? "bg-[var(--sa-accent)] text-white shadow-[0_0_10px_-2px_var(--sa-accent-glow)]"
                                    : "text-[var(--sa-fg-muted)] hover:text-white hover:bg-[var(--sa-card-hover)]"
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
                                <tr className="border-b border-[var(--sa-border)] bg-white/[0.01]">
                                    <th className="px-6 py-4 text-[11px] font-bold text-[var(--sa-fg-muted)] uppercase tracking-wider">Customer Identity</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-[var(--sa-fg-muted)] uppercase tracking-wider text-center">Type</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-[var(--sa-fg-muted)] uppercase tracking-wider">Financials</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-[var(--sa-fg-muted)] uppercase tracking-wider">Engagement</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-[var(--sa-fg-muted)] uppercase tracking-wider text-right">Control</th>
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
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-[var(--sa-border)] flex items-center justify-center text-sm font-bold text-[var(--sa-fg-bright)] overflow-hidden">
                                                            {user.avatar_url ? (
                                                                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                (user.full_name || user.email || "?").charAt(0)
                                                            )}
                                                        </div>
                                                        {user.status !== 'active' && (
                                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded bg-[var(--sa-error)] border-2 border-[var(--sa-card)] flex items-center justify-center">
                                                                <Ban className="w-2 h-2 text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-[var(--sa-fg-bright)] flex items-center gap-2 group-hover:text-[var(--sa-accent)] transition-colors">
                                                            {user.full_name || user.email?.split('@')[0] || "Anonymous"}
                                                            {user.role === 'admin' && <Shield className="w-3.5 h-3.5 text-[var(--sa-warning)]" />}
                                                        </p>
                                                        <p className="text-xs text-[var(--sa-fg-dim)]">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Badge variant="outline" className={cn(
                                                    "text-[10px] font-bold uppercase tracking-wide py-0.5 px-2 rounded border",
                                                    user.is_registered
                                                        ? "text-emerald-500 bg-emerald-500/5 border-emerald-500/10"
                                                        : "text-[var(--sa-fg-muted)] bg-white/5 border-[var(--sa-border)]"
                                                )}>
                                                    {user.is_registered ? "Member" : "Guest"}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-medium text-[var(--sa-fg-bright)]">
                                                    ${Number(user.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={cn(
                                                    "w-2 h-2 rounded-full inline-block mr-2",
                                                    user.newsletter_subscribed ? "bg-emerald-500" : "bg-[var(--sa-fg-dim)]"
                                                )} />
                                                <span className="text-xs text-[var(--sa-fg-muted)]">
                                                    {user.newsletter_subscribed ? "Subscribed" : "Unsubscribed"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--sa-fg-dim)] hover:text-[var(--sa-fg-bright)] hover:bg-[var(--sa-card-hover)]">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-[var(--sa-card)] border-[var(--sa-border)] text-[var(--sa-fg)]">
                                                        <DropdownMenuItem onClick={() => openDetails(user.id)}>
                                                            <ExternalLink className="w-4 h-4 mr-2" />
                                                            View Profile
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-[var(--sa-border)]" />
                                                        <DropdownMenuItem onClick={async () => {
                                                            const res = await forceUserLogout(user.id);
                                                            if (res.success) toast.success("Client Logged Out");
                                                        }}>
                                                            <LogOut className="w-4 h-4 mr-2" />
                                                            Revoke Sessions
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-[var(--sa-fg-muted)]">
                                            No customers found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-4 border-t border-[var(--sa-border)] flex items-center justify-between">
                        <p className="text-xs text-[var(--sa-fg-dim)] font-medium">
                            Showing <span className="text-[var(--sa-fg)]">{users.length}</span> of <span className="text-[var(--sa-fg)]">{count}</span>
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                                className="h-8 w-8 p-0 bg-[var(--sa-card)] border-[var(--sa-border)] text-[var(--sa-fg-muted)] hover:text-white"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="text-xs font-medium text-[var(--sa-fg-muted)]">Page {page} of {totalPages || 1}</span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page === totalPages || totalPages === 0}
                                onClick={() => setPage(page + 1)}
                                className="h-8 w-8 p-0 bg-[var(--sa-card)] border-[var(--sa-border)] text-[var(--sa-fg-muted)] hover:text-white"
                            >
                                <ChevronRight className="w-4 h-4" />
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
