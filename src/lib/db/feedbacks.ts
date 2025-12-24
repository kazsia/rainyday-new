"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { getSiteSettings } from "./settings"

export type Feedback = {
    id: string
    invoice_id: string
    order_id: string
    customer_id?: string
    email: string
    rating: number
    title?: string
    message: string
    is_public: boolean
    is_approved: boolean
    is_admin_added: boolean
    created_at: string
    updated_at: string
}

/**
 * Submit real feedback tied to a paid invoice.
 */
export async function submitFeedback(data: {
    invoice_id: string
    rating: number
    title?: string
    message: string
}) {
    const supabase = await createClient()

    // 1. Validate Invoice & Payment
    const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .select("*, orders(*)")
        .eq("id", data.invoice_id)
        .single()

    if (invoiceError || !invoice) throw new Error("Invoice not found")
    if (invoice.status !== "paid") throw new Error("Invoice must be paid to leave feedback")

    // 2. Check for existing feedback
    const { data: existing } = await supabase
        .from("feedbacks")
        .select("id")
        .eq("invoice_id", data.invoice_id)
        .single()

    if (existing) throw new Error("Feedback already submitted for this invoice")

    // 3. Get user info
    const { data: { user } } = await supabase.auth.getUser()

    // 4. Determine auto-approval status
    const settings = await getSiteSettings()
    const autoApprove = settings.feedbacks.enable_automatic

    // 5. Insert feedback
    const { data: feedback, error } = await supabase
        .from("feedbacks")
        .insert({
            invoice_id: data.invoice_id,
            order_id: invoice.orders.id,
            customer_id: user?.id,
            email: invoice.orders.email,
            rating: data.rating,
            title: data.title,
            message: data.message,
            is_approved: autoApprove,
            is_public: true,
            is_admin_added: false
        })
        .select()
        .single()

    if (error) {
        console.error("[SUBMIT_FEEDBACK_ERROR]", error)
        throw new Error("Failed to submit feedback")
    }

    return feedback
}

/**
 * Get approved feedbacks for public display.
 */
export async function getPublicFeedbacks() {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from("feedbacks")
            .select("*")
            .eq("is_approved", true)
            .eq("is_public", true)
            .order("created_at", { ascending: false })

        if (error) throw error
        return data as Feedback[]
    } catch (e) {
        console.error("[GET_PUBLIC_FEEDBACKS_ERROR]", e)
        return []
    }
}

/**
 * Live calculation of average rating and total count.
 */
export async function getAverageRating() {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from("feedbacks")
            .select("rating")
            .eq("is_approved", true)
            .eq("is_public", true)

        if (error || !data) return { average: 0, count: 0 }

        const count = data.length
        if (count === 0) return { average: 0, count: 0 }

        const sum = data.reduce((acc, curr) => acc + curr.rating, 0)
        return {
            average: parseFloat((sum / count).toFixed(1)),
            count
        }
    } catch (e) {
        console.error("[GET_AVERAGE_RATING_ERROR]", e)
        return { average: 0, count: 0 }
    }
}

/**
 * Admin: Get all feedbacks for moderation.
 */
export async function adminGetFeedbacks() {
    try {
        const supabase = await createAdminClient()
        const { data, error } = await supabase
            .from("feedbacks")
            .select("*")
            .order("created_at", { ascending: false })

        if (error) throw error
        return data as Feedback[]
    } catch (e) {
        console.error("[ADMIN_GET_FEEDBACKS_ERROR]", e)
        return []
    }
}

/**
 * Admin: Moderation actions.
 */
export async function adminUpdateFeedback(id: string, updates: Partial<Feedback>) {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
        .from("feedbacks")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

    if (error) throw error
    return data as Feedback
}

/**
 * Admin: Delete feedback.
 */
export async function adminDeleteFeedback(id: string) {
    const supabase = await createAdminClient()
    const { error } = await supabase
        .from("feedbacks")
        .delete()
        .eq("id", id)

    if (error) throw error
    return true
}

export async function adminAddManualFeedback(data: {
    email: string
    rating: number
    title?: string
    message: string
}) {
    try {
        const supabase = await createAdminClient()
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        console.log("[ADMIN_ADD_MANUAL] Key check:", {
            hasKey: !!serviceKey,
            keyLength: serviceKey?.length,
            url: process.env.NEXT_PUBLIC_SUPABASE_URL
        })

        const logEntryCheck = `[${new Date().toISOString()}] ENV CHECK: hasKey=${!!serviceKey}, len=${serviceKey?.length}\n`
        require('fs').appendFileSync('feedback-error.log', logEntryCheck)

        console.log("[ADMIN_ADD_MANUAL] Attempting insert:", data)

        const { data: feedback, error } = await supabase
            .from("feedbacks")
            .insert({
                email: data.email,
                rating: data.rating,
                title: data.title,
                message: data.message,
                is_approved: true,
                is_public: true,
                is_admin_added: true,
                invoice_id: null,
                order_id: null
            })
            .select()
            .single()

        if (error) {
            console.error("[ADMIN_ADD_MANUAL_ERROR]", error)
            // Log to a file as well for agent to read
            const logEntry = `[${new Date().toISOString()}] ERROR: ${JSON.stringify(error)}\n`
            require('fs').appendFileSync('feedback-error.log', logEntry)
            throw error
        }

        return feedback as Feedback
    } catch (e: any) {
        console.error("[ADMIN_ADD_MANUAL_CRASH]", e)
        const logEntry = `[${new Date().toISOString()}] CRASH: ${e.message || e}\n`
        require('fs').appendFileSync('feedback-error.log', logEntry)
        throw e
    }
}
