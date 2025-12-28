"use server"

import { createClient } from "@/lib/supabase/server"

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export async function createTicket(ticket: {
    subject: string
    email: string
    message: string
    priority?: TicketPriority
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: newTicket, error: ticketError } = await supabase
        .from("tickets")
        .insert({
            user_id: user?.id,
            email: ticket.email,
            subject: ticket.subject,
            priority: ticket.priority || 'medium',
            status: 'open'
        })
        .select()
        .single()

    if (ticketError) throw ticketError

    // Initial message
    const { error: replyError } = await supabase
        .from("ticket_replies")
        .insert({
            ticket_id: newTicket.id,
            user_id: user?.id,
            message: ticket.message
        })

    if (replyError) throw replyError

    return newTicket
}

export async function getTickets() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
        .from("tickets")
        .select(`
            *,
            ticket_replies (*)
        `)
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .order("updated_at", { ascending: false })

    if (error) throw error
    return data
}

export async function adminGetTickets() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from("tickets")
        .select(`
            *,
            profiles:user_id (email)
        `)
        .order("created_at", { ascending: false })

    if (error) throw error
    return data
}

export async function createTicketReply(reply: {
    ticket_id: string
    message: string
    is_admin_reply?: boolean
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const { data, error } = await supabase
        .from("ticket_replies")
        .insert({
            ticket_id: reply.ticket_id,
            user_id: user.id,
            message: reply.message,
            is_admin_reply: reply.is_admin_reply || false
        })
        .select()
        .single()

    if (error) throw error

    // Update ticket updated_at
    await supabase
        .from("tickets")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", reply.ticket_id)

    // Send email notification if this is an admin reply
    if (reply.is_admin_reply) {
        const { sendTicketReplyEmail } = await import("@/lib/email/email")

        // Get ticket details for email
        const { data: ticket } = await supabase
            .from("tickets")
            .select("id, subject, email")
            .eq("id", reply.ticket_id)
            .single()

        if (ticket?.email) {
            await sendTicketReplyEmail(ticket, reply.message)
        }
    }

    return data
}

export async function updateTicketStatus(id: string, status: TicketStatus) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from("tickets")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function getTicketDetails(id: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from("tickets")
        .select(`
            *,
            ticket_replies(*),
            profiles:user_id (email)
        `)
        .eq("id", id)
        .order("created_at", { foreignTable: "ticket_replies", ascending: true })
        .single()

    if (error) throw error
    return data
}
