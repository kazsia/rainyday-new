"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import {
    Ticket,
    MessageCircle,
    Clock,
    CheckCircle2,
    Plus,
    User,
    XCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
    adminGetTickets,
    createTicketReply,
    updateTicketStatus,
    TicketStatus
} from "@/lib/db/tickets"
import { createClient } from "@/lib/supabase/client"

export default function AdminTicketsPage() {
    const [tickets, setTickets] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null)
    const [replyMessage, setReplyMessage] = useState("")
    const [isReplying, setIsReplying] = useState(false)

    useEffect(() => {
        loadTickets()

        // Realtime subscription
        const supabase = createClient()
        const channel = supabase
            .channel('admin_tickets')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tickets' },
                () => {
                    loadTickets(false)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    async function loadTickets(showLoader = true) {
        if (showLoader) setIsLoading(true)
        try {
            const data = await adminGetTickets()
            setTickets(data || [])
        } catch (error) {
            toast.error("Failed to load tickets")
        } finally {
            setIsLoading(false)
        }
    }

    async function handleSendReply() {
        if (!replyMessage.trim() || !selectedTicket) return
        setIsReplying(true)
        try {
            await createTicketReply({
                ticket_id: selectedTicket.id,
                message: replyMessage,
                is_admin_reply: true
            })
            toast.success("Reply sent")
            setReplyMessage("")
            // Refresh ticket data in list and potentially in modal
            loadTickets(false)
            // For now just close or keep open
        } catch (error) {
            toast.error("Failed to send reply")
        } finally {
            setIsReplying(false)
        }
    }

    async function handleStatusChange(status: TicketStatus) {
        if (!selectedTicket) return
        try {
            await updateTicketStatus(selectedTicket.id, status)
            toast.success(`Ticket marked as ${status}`)
            loadTickets(false)
        } catch (error) {
            toast.error("Failed to update status")
        }
    }

    const stats = {
        open: tickets.filter(t => t.status === 'open').length,
        inProgress: tickets.filter(t => t.status === 'in_progress').length,
        resolved: tickets.filter(t => ['resolved', 'closed'].includes(t.status)).length
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Tickets</h1>
                        <p className="text-sm text-white/40">Manage customer support requests</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { label: "Open Tickets", value: stats.open.toString(), color: "text-brand-primary", icon: Ticket },
                        { label: "In Progress", value: stats.inProgress.toString(), color: "text-yellow-500", icon: Clock },
                        { label: "Resolved", value: stats.resolved.toString(), color: "text-green-500", icon: CheckCircle2 },
                    ].map((stat, i) => (
                        <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4">
                            <div className={cn("w-12 h-12 rounded-xl bg-white/[0.03] flex items-center justify-center", stat.color)}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-white">{stat.value}</p>
                                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tickets Table */}
                <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden font-medium">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                    <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">Ticket ID</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">Customer</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">Subject</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">Priority</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 font-medium">
                                {isLoading ? (
                                    [1, 2, 3].map(i => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={7} className="px-6 py-4 h-12 bg-white/[0.01]" />
                                        </tr>
                                    ))
                                ) : tickets.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-white/20">
                                            No tickets found.
                                        </td>
                                    </tr>
                                ) : tickets.map((ticket) => (
                                    <tr key={ticket.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className="text-xs text-brand/80">{ticket.id.slice(0, 8)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-background/40 flex items-center justify-center shrink-0">
                                                    <User className="w-3.5 h-3.5 text-white/20" />
                                                </div>
                                                <span className="text-sm text-white">{ticket.profiles?.email || ticket.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            <p className="text-sm text-white/80 truncate">{ticket.subject}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                                                ticket.priority === "high" || ticket.priority === "urgent" ? "bg-red-500/10 text-red-500" :
                                                    ticket.priority === "medium" ? "bg-yellow-500/10 text-yellow-500" :
                                                        "bg-brand-primary/10 text-brand-primary"
                                            )}>
                                                {ticket.priority}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs">
                                            <div className="flex items-center gap-1.5">
                                                <div className={cn(
                                                    "w-1.5 h-1.5 rounded-full",
                                                    ticket.status === "open" ? "bg-brand-primary" :
                                                        ticket.status === "in_progress" ? "bg-yellow-500" :
                                                            "bg-green-500"
                                                )} />
                                                <span className="text-white/60 capitalize">{ticket.status.replace('_', ' ')}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                onClick={() => setSelectedTicket(ticket)}
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 gap-2 text-white/40 hover:text-white"
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                                Reply
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Reply Modal */}
                {selectedTicket && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                        <div className="bg-[#0a0e1a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-white">{selectedTicket.subject}</h2>
                                    <p className="text-xs text-white/40">{selectedTicket.email} • {selectedTicket.id}</p>
                                </div>
                                <button onClick={() => setSelectedTicket(null)} className="text-white/40 hover:text-white">
                                    <Plus className="w-6 h-6 rotate-45" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Quick Actions</label>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => handleStatusChange('in_progress')}
                                                variant="outline" size="sm" className="h-8 text-xs border-white/10 bg-white/5">Mark In Progress</Button>
                                            <Button
                                                onClick={() => handleStatusChange('resolved')}
                                                variant="outline" size="sm" className="h-8 text-xs border-white/10 bg-white/5 hover:text-green-500">Resolve</Button>
                                            <Button
                                                onClick={() => handleStatusChange('closed')}
                                                variant="outline" size="sm" className="h-8 text-xs border-white/10 bg-white/5 hover:text-red-500">Close</Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Admin Reply</label>
                                        <textarea
                                            value={replyMessage}
                                            onChange={e => setReplyMessage(e.target.value)}
                                            rows={6}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-brand/50 transition-colors"
                                            placeholder="Type your response here..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-white/5 flex justify-end">
                                <Button
                                    onClick={handleSendReply}
                                    disabled={isReplying || !replyMessage.trim()}
                                    className="bg-brand text-black font-bold px-8"
                                >
                                    {isReplying ? "Sending..." : "Send Reply"}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}
