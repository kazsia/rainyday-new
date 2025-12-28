"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { adminGetTickets, getTicketDetails, createTicketReply, updateTicketStatus, TicketStatus } from "@/lib/db/tickets"
import { formatDistanceToNow } from "date-fns"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { Search, Filter, Loader2, MessageSquare, ExternalLink, Send, User, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function AdminTicketsPage() {
    const [tickets, setTickets] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")

    // Ticket Details State
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
    const [selectedTicket, setSelectedTicket] = useState<any>(null)
    const [detailsLoading, setDetailsLoading] = useState(false)
    const [replyMessage, setReplyMessage] = useState("")
    const [isSendingReply, setIsSendingReply] = useState(false)

    useEffect(() => {
        async function loadTickets() {
            try {
                const data = await adminGetTickets()
                setTickets(data || [])
            } catch (error) {
                console.error("Failed to load tickets:", error)
            } finally {
                setIsLoading(false)
            }
        }
        loadTickets()
    }, [])

    useEffect(() => {
        if (!selectedTicketId) return

        async function loadDetails() {
            if (!selectedTicketId) return // TypeScript guard
            setDetailsLoading(true)
            try {
                const details = await getTicketDetails(selectedTicketId)
                setSelectedTicket(details)
            } catch (error) {
                toast.error("Failed to load ticket details")
            } finally {
                setDetailsLoading(false)
            }
        }
        loadDetails()
    }, [selectedTicketId])

    const handleSendReply = async () => {
        if (!replyMessage.trim() || !selectedTicketId) return

        setIsSendingReply(true)
        try {
            await createTicketReply({
                ticket_id: selectedTicketId,
                message: replyMessage,
                is_admin_reply: true
            })

            // Allow auto-status update logic here if desired?
            // For now just refresh details
            const updatedDetails = await getTicketDetails(selectedTicketId)
            setSelectedTicket(updatedDetails)
            setReplyMessage("")
            toast.success("Reply sent successfully")

            // Only update ticket list status if it changed?
            // Just refresh list silently to keep timestamps accurate
            const listData = await adminGetTickets()
            setTickets(listData || [])

        } catch (error) {
            toast.error("Failed to send reply")
        } finally {
            setIsSendingReply(false)
        }
    }

    const handleStatusChange = async (newStatus: TicketStatus) => {
        if (!selectedTicketId) return
        try {
            await updateTicketStatus(selectedTicketId, newStatus)
            toast.success(`Ticket marked as ${newStatus.replace('_', ' ')}`)

            // Refresh details and list
            const updatedDetails = await getTicketDetails(selectedTicketId)
            setSelectedTicket(updatedDetails)

            setTickets(prev => prev.map(t =>
                t.id === selectedTicketId ? { ...t, status: newStatus } : t
            ))

        } catch (error) {
            toast.error("Failed to update status")
        }
    }

    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch =
            ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.id.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = statusFilter === "all" || ticket.status === statusFilter

        return matchesSearch && matchesStatus
    })

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
            case 'in_progress': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
            case 'resolved': return 'bg-green-500/10 text-green-500 border-green-500/20'
            case 'closed': return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
            default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
        }
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'text-red-500 font-bold'
            case 'high': return 'text-orange-500'
            case 'medium': return 'text-yellow-500'
            case 'low': return 'text-blue-500'
            default: return 'text-gray-500'
        }
    }

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="w-8 h-8 text-[#a4f8ff] animate-spin" />
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout>
            <div className="space-y-8 pb-32 pt-4 px-4 max-w-[1280px] mx-auto">
                {/* Header */}
                <div className="flex flex-col gap-1.5">
                    <h1 className="text-3xl font-black text-white tracking-tight">Support Tickets</h1>
                    <p className="text-[13px] text-white/40 font-medium">Manage and respond to customer support requests.</p>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <Input
                            placeholder="Search tickets..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-[#0f111a] border-white/5 text-sm h-10 rounded-xl focus-visible:ring-0 focus-visible:border-[#a4f8ff]/50"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[180px] bg-[#0f111a] border-white/5 rounded-xl h-10">
                            <div className="flex items-center gap-2">
                                <Filter className="w-3.5 h-3.5 text-white/40" />
                                <SelectValue placeholder="Filter Status" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="bg-[#0a0c14] border-white/10 text-white">
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Tickets List */}
                <Card className="bg-[#0a0c14] border-white/5 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-[#0f111a] hover:bg-[#0f111a]">
                            <TableRow className="border-white/5 hover:bg-[#0f111a]">
                                <TableHead className="text-[11px] font-bold text-white/40 uppercase tracking-widest h-12">Ticket Details</TableHead>
                                <TableHead className="text-[11px] font-bold text-white/40 uppercase tracking-widest h-12">Status</TableHead>
                                <TableHead className="text-[11px] font-bold text-white/40 uppercase tracking-widest h-12">Priority</TableHead>
                                <TableHead className="text-[11px] font-bold text-white/40 uppercase tracking-widest h-12 text-right">Created</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTickets.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-[300px] text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                                                <MessageSquare className="w-6 h-6 text-white/20" />
                                            </div>
                                            <p className="text-sm font-medium text-white/40">No tickets found</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTickets.map((ticket) => (
                                    <TableRow
                                        key={ticket.id}
                                        className="border-white/5 hover:bg-white/[0.02] group transition-colors cursor-pointer"
                                        onClick={() => setSelectedTicketId(ticket.id)}
                                    >
                                        <TableCell className="py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-bold text-white group-hover:text-[#a4f8ff] transition-colors">
                                                    {ticket.subject}
                                                </span>
                                                <div className="flex items-center gap-2 text-[11px] text-white/40">
                                                    <span>#{ticket.id.slice(0, 8)}</span>
                                                    <span>•</span>
                                                    <span>{ticket.email || ticket.profiles?.email || 'Anonymous'}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`${getStatusColor(ticket.status)} capitalize border px-2.5 py-0.5 rounded-lg`}>
                                                {ticket.status.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`text-xs capitalize ${getPriorityColor(ticket.priority)}`}>
                                                {ticket.priority}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right text-[11px] text-white/40 font-medium">
                                            {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-white/20 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all ml-auto"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Card>

                {/* Ticket Details Sheet */}
                <Sheet open={!!selectedTicketId} onOpenChange={(open) => {
                    if (!open) {
                        setSelectedTicketId(null)
                        setSelectedTicket(null)
                    }
                }}>
                    <SheetContent className="w-full sm:max-w-[90vw] bg-[#0a0c14] border-l border-white/5 p-0 sm:p-0 flex flex-col">
                        {detailsLoading || !selectedTicket ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="w-8 h-8 text-[#a4f8ff] animate-spin" />
                            </div>
                        ) : (
                            <>
                                <SheetHeader className="px-6 py-5 border-b border-white/5 space-y-4">
                                    <div className="space-y-1.5">
                                        <SheetTitle className="text-xl font-black text-white">{selectedTicket.subject}</SheetTitle>
                                        <SheetDescription className="flex items-center gap-2 text-[12px]">
                                            <span className="text-white/40">From:</span>
                                            <span className="text-white font-medium">{selectedTicket.email || selectedTicket.profiles?.email || 'Anonymous'}</span>
                                            <span className="text-white/20">•</span>
                                            <span className="text-white/40">{formatDistanceToNow(new Date(selectedTicket.created_at), { addSuffix: true })}</span>
                                        </SheetDescription>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Select
                                            value={selectedTicket.status}
                                            onValueChange={(val) => handleStatusChange(val as TicketStatus)}
                                        >
                                            <SelectTrigger className="w-[140px] h-8 text-xs font-bold border-white/10 bg-white/5">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="open">Open</SelectItem>
                                                <SelectItem value="in_progress">In Progress</SelectItem>
                                                <SelectItem value="resolved">Resolved</SelectItem>
                                                <SelectItem value="closed">Closed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Badge variant="outline" className={`capitalize ${getPriorityColor(selectedTicket.priority)} border-white/10 bg-white/5`}>
                                            {selectedTicket.priority} Priority
                                        </Badge>
                                    </div>
                                </SheetHeader>

                                {/* Messages Area */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                    {/* Initial Ticket Message */}
                                    {/* Usually the first reply is the message body if created via our flow, 
                                        but let's check if we have explicit ticket replies. 
                                        According to tickets.ts, createTicket creates a ticket_reply. 
                                    */}
                                    {selectedTicket.ticket_replies?.map((reply: any) => (
                                        <div key={reply.id} className={cn(
                                            "flex gap-4 max-w-[90%]",
                                            reply.is_admin_reply ? "ml-auto flex-row-reverse" : ""
                                        )}>
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border",
                                                reply.is_admin_reply
                                                    ? "bg-[#a4f8ff]/10 border-[#a4f8ff]/20 text-[#a4f8ff]"
                                                    : "bg-white/5 border-white/10 text-white/40"
                                            )}>
                                                {reply.is_admin_reply ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                            </div>
                                            <div className={cn(
                                                "space-y-1.5",
                                                reply.is_admin_reply ? "items-end text-right" : "items-start"
                                            )}>
                                                <div className={cn(
                                                    "p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                                                    reply.is_admin_reply
                                                        ? "bg-[#a4f8ff]/10 text-[#a4f8ff] rounded-tr-sm"
                                                        : "bg-white/5 text-white/80 rounded-tl-sm"
                                                )}>
                                                    {reply.message}
                                                </div>
                                                <p className="text-[10px] font-bold text-white/20">
                                                    {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Reply Input Area */}
                                <div className="p-4 bg-[#0a0c14] border-t border-white/5">
                                    <div className="relative">
                                        <Textarea
                                            placeholder="Type your reply..."
                                            value={replyMessage}
                                            onChange={(e) => setReplyMessage(e.target.value)}
                                            className="min-h-[100px] bg-[#0f111a] border-white/5 resize-none pr-14 focus-visible:ring-0 focus-visible:border-[#a4f8ff]/50 text-sm"
                                        />
                                        <Button
                                            size="icon"
                                            className="absolute bottom-3 right-3 h-8 w-8 bg-[#a4f8ff] hover:bg-[#8aefff] text-black rounded-lg transition-all"
                                            disabled={!replyMessage.trim() || isSendingReply}
                                            onClick={handleSendReply}
                                        >
                                            {isSendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </SheetContent>
                </Sheet>
            </div>
        </AdminLayout>
    )
}
