"use client"

import { useEffect, useState } from "react"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription
} from "@/components/ui/sheet"
import {
    User,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Ban,
    LogOut,
    History,
    CreditCard,
    Package,
    Mail,
    Calendar,
    Clock,
    ExternalLink,
    RefreshCw,
    AlertTriangle,
    CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getCustomerDetails, updateCustomerStatus, updateCustomerRole, forceUserLogout, updateCustomerBalance } from "@/lib/actions/admin-customers"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface CustomerDetailDrawerProps {
    userId: string
    isOpen: boolean
    onClose: () => void
}

export function CustomerDetailDrawer({ userId, isOpen, onClose }: CustomerDetailDrawerProps) {
    const [details, setDetails] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isActionLoading, setIsActionLoading] = useState(false)

    useEffect(() => {
        if (isOpen && userId) {
            loadDetails()
        }
    }, [isOpen, userId])

    async function loadDetails() {
        setIsLoading(true)
        const res = await getCustomerDetails(userId)
        if (res.success) {
            setDetails(res)
        } else {
            toast.error(res.error || "Failed to load user details")
            onClose()
        }
        setIsLoading(false)
    }

    async function handleStatusChange(status: any) {
        if (status === "banned" && !confirm("Are you sure you want to BAN this user? This is permanent.")) return

        setIsActionLoading(true)
        const res = await updateCustomerStatus(userId, status)
        if (res.success) {
            toast.success(`Customer status updated to ${status}`)
            loadDetails()
        } else {
            toast.error(res.error || "Failed to update status")
        }
        setIsActionLoading(false)
    }

    async function handleBalanceUpdate() {
        const newBalance = prompt("Enter new balance:", details?.customer?.balance)
        if (newBalance === null) return

        const balanceNum = parseFloat(newBalance)
        if (isNaN(balanceNum)) return toast.error("Invalid balance amount")

        setIsActionLoading(true)
        const res = await updateCustomerBalance(userId, balanceNum)
        if (res.success) {
            toast.success("Balance updated successfully")
            loadDetails()
        } else {
            toast.error(res.error || "Failed to update balance")
        }
        setIsActionLoading(false)
    }

    async function handleRoleChange(role: string) {
        setIsActionLoading(true)
        const res = await updateCustomerRole(userId, role)
        if (res.success) {
            toast.success(`Customer role updated to ${role}`)
            loadDetails()
        } else {
            toast.error(res.error || "Failed to update role")
        }
        setIsActionLoading(false)
    }

    if (!isOpen) return null

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-none bg-[var(--tn-blue-bg)] border-none p-0 overflow-hidden flex flex-col shadow-2xl h-full text-[var(--tn-blue-fg)]"
            >
                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-6 bg-[var(--tn-blue-bg)]">
                        <SheetHeader className="sr-only">
                            <SheetTitle>Decrypting Record...</SheetTitle>
                            <SheetDescription>Interfacing with the core customer database.</SheetDescription>
                        </SheetHeader>
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full border-2 border-[var(--tn-blue-aqua)]/10 border-t-[var(--tn-blue-aqua)] animate-spin" />
                            <RefreshCw className="w-8 h-8 text-[var(--tn-blue-aqua)] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                        </div>
                        <p className="font-heading font-black uppercase tracking-[0.4em] italic text-xs text-[var(--tn-blue-aqua)] animate-pulse">Establishing Secure Uplink...</p>
                    </div>
                ) : (
                    <>
                        <div className="p-10 border-b border-white/5 bg-[var(--tn-blue-current)]/30 relative overflow-hidden backdrop-blur-xl">
                            <div className="absolute top-0 right-0 w-1/3 h-full bg-[var(--tn-blue-aqua)]/5 blur-[120px] pointer-events-none" />

                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative z-10">
                                <div className="flex items-center gap-8">
                                    <div className="relative group">
                                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[var(--tn-blue-aqua)]/30 to-[var(--tn-blue-bg)] border border-white/10 flex items-center justify-center text-4xl font-heading font-black text-[var(--tn-blue-aqua)] uppercase overflow-hidden shadow-2xl transition-all duration-500">
                                            {details?.profile?.avatar_url ? (
                                                <img src={details.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                (details?.customer?.full_name || details?.customer?.email || "?").charAt(0)
                                            )}
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 p-2 bg-[var(--tn-blue-bg)] border border-white/10 rounded-xl shadow-xl">
                                            {details?.customer?.is_registered ? (
                                                <ShieldCheck className="w-5 h-5 text-[var(--tn-blue-aqua)]" />
                                            ) : (
                                                <User className="w-5 h-5 text-white/40" />
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <SheetTitle className="text-4xl md:text-5xl font-heading font-black text-white italic tracking-tighter uppercase leading-none">
                                            {details?.customer?.full_name || details?.customer?.email?.split('@')[0] || "Unknown Identity"}
                                        </SheetTitle>
                                        <div className="flex flex-wrap items-center gap-4 mt-4">
                                            <div className="flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/5 rounded-full">
                                                <Mail className="w-3 h-3 text-[var(--tn-blue-aqua)]" />
                                                <span className="text-xs font-sans font-bold text-white/50">{details?.customer?.email}</span>
                                            </div>
                                            <Badge variant="outline" className={cn(
                                                "text-[10px] font-black uppercase tracking-[0.2em] py-1.5 px-5 italic border-white/10 rounded-full",
                                                details?.customer?.status === 'active' ? "text-[var(--tn-blue-green)] bg-[var(--tn-blue-green)]/5" : "text-[var(--tn-blue-red)] bg-[var(--tn-blue-red)]/5"
                                            )}>
                                                {details?.customer?.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Button
                                        onClick={onClose}
                                        variant="outline"
                                        className="h-14 px-8 rounded-2xl border-white/5 bg-white/[0.02] text-[10px] font-black uppercase tracking-[0.2em] italic hover:bg-white/5 transition-all text-white"
                                    >
                                        Close Terminal
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <Tabs defaultValue="overview" className="flex-1 flex flex-col">
                            <div className="px-10 bg-[var(--tn-blue-bg)]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-20">
                                <TabsList className="bg-transparent border-none p-0 h-20 space-x-12">
                                    {[
                                        { id: 'overview', label: 'Intelligence', icon: User },
                                        { id: 'orders', label: 'Transactions', icon: CreditCard },
                                        { id: 'activity', label: 'History', icon: History },
                                        { id: 'security', label: 'Sanctions', icon: ShieldAlert }
                                    ].map(tab => (
                                        <TabsTrigger
                                            key={tab.id}
                                            value={tab.id}
                                            className="bg-transparent border-b-2 border-transparent data-[state=active]:border-[var(--tn-blue-aqua)] data-[state=active]:text-[var(--tn-blue-aqua)] text-white/20 rounded-none h-20 px-0 text-[11px] font-black uppercase tracking-[0.25em] italic transition-all relative group"
                                        >
                                            <tab.icon className="w-4 h-4 mr-3" />
                                            {tab.label}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </div>

                            <ScrollArea className="flex-1 p-10">
                                <TabsContent value="overview" className="mt-0 space-y-12">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <div className="bg-[var(--tn-blue-current)]/30 border border-white/5 rounded-3xl p-8 flex flex-col items-center text-center group cursor-pointer hover:bg-[var(--tn-blue-current)]/50 transition-all" onClick={handleBalanceUpdate}>
                                            <div className="p-4 bg-[var(--tn-blue-aqua)]/10 rounded-2xl mb-4 group-hover:scale-110 transition-all">
                                                <CreditCard className="w-6 h-6 text-[var(--tn-blue-aqua)]" />
                                            </div>
                                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] italic mb-2">Net Balance</p>
                                            <p className="text-4xl font-heading font-black text-[var(--tn-blue-aqua)] italic tracking-tighter">
                                                ${Number(details?.customer?.balance || 0).toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="bg-[var(--tn-blue-current)]/30 border border-white/5 rounded-3xl p-8 flex flex-col items-center text-center">
                                            <div className="p-4 bg-[var(--tn-blue-purple)]/10 rounded-2xl mb-4">
                                                <Package className="w-6 h-6 text-[var(--tn-blue-purple)]" />
                                            </div>
                                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] italic mb-2">Total Orders</p>
                                            <p className="text-4xl font-heading font-black text-white italic tracking-tighter">
                                                {details?.customer?.order_count || 0}
                                            </p>
                                        </div>
                                        <div className="bg-[var(--tn-blue-current)]/30 border border-white/5 rounded-3xl p-8 flex flex-col items-center text-center">
                                            <div className="p-4 bg-[var(--tn-blue-green)]/10 rounded-2xl mb-4">
                                                <Clock className="w-6 h-6 text-[var(--tn-blue-green)]" />
                                            </div>
                                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] italic mb-2">Engaged Since</p>
                                            <p className="text-xl font-heading font-black text-white italic tracking-tighter leading-tight mt-1">
                                                {details?.customer?.first_seen_at ? new Date(details.customer.first_seen_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : "---"}
                                            </p>
                                        </div>
                                        <div className="bg-[var(--tn-blue-current)]/30 border border-white/5 rounded-3xl p-8 flex flex-col items-center text-center">
                                            <div className="p-4 bg-[var(--tn-blue-orange)]/10 rounded-2xl mb-4">
                                                <History className="w-6 h-6 text-[var(--tn-blue-orange)]" />
                                            </div>
                                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] italic mb-2">Last Seen</p>
                                            <p className="text-xl font-heading font-black text-white italic tracking-tighter leading-tight mt-1">
                                                {details?.customer?.last_seen_at ? new Date(details.customer.last_seen_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : "---"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                        <div className="lg:col-span-2 space-y-8">
                                            <h4 className="text-[11px] font-black text-white/20 uppercase tracking-[0.3em] italic flex items-center gap-4">
                                                Profile Metadata <div className="h-px flex-1 bg-white/5" />
                                            </h4>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl group transition-all hover:bg-white/[0.04]">
                                                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] italic mb-3">Newsletter Sync</p>
                                                    <div className="flex items-center justify-between">
                                                        <span className={cn(
                                                            "text-sm font-heading font-black italic uppercase italic tracking-widest",
                                                            details?.customer?.newsletter_subscribed ? "text-[var(--tn-blue-purple)]" : "text-white/20"
                                                        )}>
                                                            {details?.customer?.newsletter_subscribed ? "Uplink Active" : "No Subscription"}
                                                        </span>
                                                        <Badge variant="outline" className="border-white/5 bg-white/5 text-[9px] font-black uppercase tracking-widest px-3 py-1 italic">
                                                            {details?.customer?.newsletter_subscribed ? "OK" : "SKIP"}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl group transition-all hover:bg-white/[0.04]">
                                                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] italic mb-3">Referral Origin</p>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-heading font-black italic uppercase tracking-widest text-white/60 truncate max-w-[200px]">
                                                            {details?.customer?.referrer || "Organic Entry"}
                                                        </span>
                                                        {details?.customer?.referrer && <ExternalLink className="w-3.5 h-3.5 text-white/20" />}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-8">
                                            <h4 className="text-[11px] font-black text-white/20 uppercase tracking-[0.3em] italic flex items-center gap-4">
                                                Direct Controls <div className="h-px flex-1 bg-white/5" />
                                            </h4>

                                            <div className="bg-[var(--tn-blue-current)]/30 border border-white/5 rounded-3xl p-3 space-y-2">
                                                {details?.customer?.status === 'active' ? (
                                                    <button
                                                        onClick={() => handleStatusChange('suspended')}
                                                        disabled={isActionLoading}
                                                        className="w-full h-14 bg-[var(--tn-blue-orange)]/5 hover:bg-[var(--tn-blue-orange)]/10 border border-[var(--tn-blue-orange)]/10 text-[var(--tn-blue-orange)] flex items-center justify-start px-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] italic transition-all group"
                                                    >
                                                        <ShieldAlert className="w-4 h-4 mr-4 group-hover:scale-110 transition-transform" />
                                                        Apply Containment
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleStatusChange('active')}
                                                        disabled={isActionLoading}
                                                        className="w-full h-14 bg-[var(--tn-blue-green)]/5 hover:bg-[var(--tn-blue-green)]/10 border border-[var(--tn-blue-green)]/10 text-[var(--tn-blue-green)] flex items-center justify-start px-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] italic transition-all group"
                                                    >
                                                        <ShieldCheck className="w-4 h-4 mr-4 group-hover:scale-110 transition-transform" />
                                                        Restore Uplink
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => handleStatusChange('banned')}
                                                    disabled={isActionLoading || details?.customer?.status === 'banned'}
                                                    className="w-full h-14 bg-[var(--tn-blue-red)]/5 hover:bg-[var(--tn-blue-red)]/20 border border-[var(--tn-blue-red)]/10 text-[var(--tn-blue-red)] flex items-center justify-start px-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] italic transition-all group"
                                                >
                                                    <Ban className="w-4 h-4 mr-4 group-hover:scale-110 transition-transform" />
                                                    Terminal Blackout
                                                </button>

                                                {details?.customer?.is_registered ? (
                                                    <>
                                                        <div className="h-px bg-white/5 my-2" />
                                                        {details?.profile?.role === 'user' ? (
                                                            <button
                                                                onClick={() => handleRoleChange('admin')}
                                                                disabled={isActionLoading}
                                                                className="w-full h-14 bg-[var(--tn-blue-aqua)]/5 hover:bg-[var(--tn-blue-aqua)]/10 border border-[var(--tn-blue-aqua)]/10 text-[var(--tn-blue-aqua)] flex items-center justify-start px-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] italic transition-all group"
                                                            >
                                                                <Shield className="w-4 h-4 mr-4 group-hover:scale-110 transition-transform" />
                                                                Authorize Admin
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleRoleChange('user')}
                                                                disabled={isActionLoading}
                                                                className="w-full h-14 bg-white/5 hover:bg-white/10 border border-white/10 text-white/40 flex items-center justify-start px-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] italic transition-all group"
                                                            >
                                                                <User className="w-4 h-4 mr-4 group-hover:scale-110 transition-transform" />
                                                                Revoke Authority
                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={async () => {
                                                                setIsActionLoading(true)
                                                                const res = await forceUserLogout(userId)
                                                                if (res.success) toast.success("Forced session expiration applied")
                                                                setIsActionLoading(false)
                                                            }}
                                                            disabled={isActionLoading}
                                                            className="w-full h-14 bg-white/5 hover:bg-white/10 border border-white/5 text-white/20 flex items-center justify-start px-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] italic transition-all group"
                                                        >
                                                            <LogOut className="w-4 h-4 mr-4 group-hover:scale-110 transition-transform" />
                                                            Invalidate Sessions
                                                        </button>
                                                    </>
                                                ) : (
                                                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5 mt-2">
                                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] italic leading-relaxed text-center">
                                                            Administrative role controls are locked for non-registered entities.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="orders" className="mt-0 space-y-10">
                                    <h4 className="text-[11px] font-black text-white/20 uppercase tracking-[0.3em] italic flex items-center gap-4">
                                        Historical Transactions <div className="h-px flex-1 bg-white/5" />
                                    </h4>

                                    {details?.orders?.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {details.orders.map((order: any) => (
                                                <div key={order.id} className="bg-[var(--tn-blue-current)]/30 border border-white/5 rounded-3xl p-8 flex flex-col group relative overflow-hidden transition-all hover:bg-[var(--tn-blue-current)]/50">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--tn-blue-aqua)]/5 blur-[50px] pointer-events-none transition-all" />

                                                    <div className="flex justify-between items-start mb-8">
                                                        <div>
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black text-white uppercase italic">REF: {order.id.slice(0, 8)}</span>
                                                                <Badge variant="outline" className={cn(
                                                                    "text-[8px] font-black uppercase tracking-widest py-1 px-3 border-white/5",
                                                                    order.status === 'completed' ? "text-[var(--tn-blue-green)] bg-[var(--tn-blue-green)]/5" : "text-white/20 bg-white/5"
                                                                )}>
                                                                    {order.status}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-[10px] text-white/30 font-sans font-bold">{new Date(order.created_at).toLocaleString()}</p>
                                                        </div>
                                                        <p className="text-3xl font-heading font-black text-[var(--tn-blue-aqua)] italic tracking-tighter">${Number(order.total).toFixed(2)}</p>
                                                    </div>

                                                    <div className="pt-6 flex justify-between items-center border-t border-white/5">
                                                        <div className="flex items-center gap-3 text-white/20">
                                                            <CreditCard className="w-4 h-4" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">{order.payments?.[0]?.provider || 'INTERNAL'}</span>
                                                        </div>
                                                        <Button variant="ghost" className="h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest italic text-white/30 hover:text-white transition-all">
                                                            Inspect Artifact
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-32 flex flex-col items-center justify-center text-center opacity-10">
                                            <Package className="w-20 h-20 mb-6" />
                                            <p className="text-xs font-heading font-black uppercase tracking-[0.4em] italic">No Transactional History Found</p>
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="activity" className="mt-0 space-y-8">
                                    <h4 className="text-[11px] font-black text-white/20 uppercase tracking-[0.3em] italic flex items-center gap-4">
                                        System Interaction Logs <div className="h-px flex-1 bg-white/5" />
                                    </h4>

                                    {(details?.activity?.length > 0 || details?.adminActions?.length > 0) ? (
                                        <div className="space-y-4">
                                            {[...(details?.activity || []), ...(details?.adminActions || [])]
                                                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                                .map((log: any, idx: number) => (
                                                    <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex items-start gap-6 group hover:bg-white/[0.04] transition-all">
                                                        <div className={cn(
                                                            "p-3 rounded-xl bg-white/5 text-[var(--tn-blue-aqua)]",
                                                            log.admin_id && "text-[var(--tn-blue-purple)]"
                                                        )}>
                                                            {log.admin_id ? <Shield className="w-4 h-4" /> : <History className="w-4 h-4" />}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
                                                                    {log.action.replace(/_/g, ' ')}
                                                                </span>
                                                                <span className="text-[10px] text-white/20 font-sans font-bold">
                                                                    {new Date(log.created_at).toLocaleString()}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm font-heading font-black italic uppercase tracking-widest text-white/80">
                                                                {log.admin_id ? "Administrative Protocol Executed" : "System Event Logged"}
                                                            </p>
                                                            {log.details && Object.keys(log.details).length > 0 && (
                                                                <div className="mt-4 p-4 bg-background/40 rounded-xl border border-white/5">
                                                                    <pre className="text-[9px] font-mono text-white/30 whitespace-pre-wrap">
                                                                        {JSON.stringify(log.details, null, 2)}
                                                                    </pre>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {log.ip_address && (
                                                            <div className="text-[9px] font-mono text-white/10 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">
                                                                {log.ip_address}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    ) : (
                                        <div className="py-32 flex flex-col items-center justify-center text-center opacity-10">
                                            <History className="w-20 h-20 mb-6" />
                                            <p className="text-xs font-heading font-black uppercase tracking-[0.4em] italic">No Interaction Logs Found</p>
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="security" className="mt-0 space-y-12">
                                    <h4 className="text-[11px] font-black text-white/20 uppercase tracking-[0.3em] italic flex items-center gap-4">
                                        Security Enforcement Protocols <div className="h-px flex-1 bg-white/5" />
                                    </h4>

                                    <div className="bg-[var(--tn-blue-red)]/[0.02] border border-[var(--tn-blue-red)]/20 p-10 rounded-3xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--tn-blue-red)]/[0.03] blur-[80px] pointer-events-none" />

                                        <div className="flex items-start gap-8 relative z-10">
                                            <div className="p-6 bg-[var(--tn-blue-red)]/10 rounded-3xl border border-[var(--tn-blue-red)]/20 shadow-inner">
                                                <AlertTriangle className="w-10 h-10 text-[var(--tn-blue-red)]" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-2xl font-heading font-black text-white italic uppercase tracking-tighter mb-3">Permanent Decoupling Protocol</h4>
                                                <p className="text-sm text-white/40 leading-relaxed font-sans font-medium max-w-2xl mb-8">
                                                    Initiating a ban will immediately terminate all active sessions, revoke access to digital artifacts, and prevent any future interactions with the platform.
                                                </p>
                                                <Button
                                                    onClick={() => handleStatusChange('banned')}
                                                    className="h-16 px-10 bg-[var(--tn-blue-red)]/10 border border-[var(--tn-blue-red)]/30 text-[var(--tn-blue-red)] hover:bg-[var(--tn-blue-red)] hover:text-black transition-all rounded-2xl text-xs font-black uppercase tracking-[0.3em] italic"
                                                >
                                                    Execute Terminal Ban
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                            </ScrollArea>
                        </Tabs>
                    </>
                )}
            </SheetContent>
        </Sheet>
    )
}
