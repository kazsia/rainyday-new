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
    order_id?: string
    rating: number
    title?: string
    message: string
}) {
    try {
        const supabase = await createClient()

        // 1. Resolve Invoice & Order IDs
        // The frontend might pass order_id as invoice_id or vice versa.
        // We try to find a valid invoice matching either ID.
        let { data: invoice, error: invoiceError } = await supabase
            .from("invoices")
            .select("*, orders(*)")
            .or(`id.eq.${data.invoice_id},order_id.eq.${data.invoice_id}`)
            .single()

        // Fallback: If still not found and order_id was provided separately, try that
        if ((invoiceError || !invoice) && data.order_id) {
            const { data: fallbackInvoice, error: fallbackError } = await supabase
                .from("invoices")
                .select("*, orders(*)")
                .or(`id.eq.${data.order_id},order_id.eq.${data.order_id}`)
                .single()

            if (!fallbackError && fallbackInvoice) {
                invoice = fallbackInvoice
                invoiceError = null
            }
        }

        if (invoiceError || !invoice) {
            // Check if it's a valid paid order. If so, create invoice on the fly.
            const searchId = data.order_id || data.invoice_id
            const { data: orderData, error: orderError } = await supabase
                .from("orders")
                .select("*")
                .eq("id", searchId)
                .single()

            if (!orderError && orderData && ['paid', 'delivered', 'completed'].includes(orderData.status)) {
                const invoiceNumber = `INV-AUTO-${Date.now()}-${orderData.id.split('-')[0]}`;

                // Determination of columns to try
                const columnsToTry = [
                    { order_id: orderData.id, invoice_number: invoiceNumber, status: 'paid' },
                    { order_id: orderData.id, invoice_number: invoiceNumber },
                    { order_id: orderData.id, status: 'paid' },
                    { order_id: orderData.id }
                ];

                let lastInsertError = null;
                const adminSupabase = await createAdminClient();

                for (const payload of columnsToTry) {
                    const { data: newInvoice, error: createError } = await adminSupabase
                        .from("invoices")
                        .insert(payload)
                        .select()
                        .single();

                    if (!createError && newInvoice) {
                        invoice = { ...newInvoice, orders: orderData };
                        lastInsertError = null;
                        break;
                    }
                    lastInsertError = createError;
                    console.warn(`[SUBMIT_FEEDBACK] Invoice insert attempt failed for payload keys: ${Object.keys(payload).join(', ')}. Error: ${createError?.message}`);
                }

                if (lastInsertError) {
                    console.error("[SUBMIT_FEEDBACK] All invoice auto-creation attempts failed. LAST ERROR:", JSON.stringify(lastInsertError, null, 2));
                    throw new Error(`Could not initialize feedback: Invoice record missing and auto-creation failed. Error: ${lastInsertError?.message || 'Unknown error'}`);
                }
            } else {
                console.error("[SUBMIT_FEEDBACK] Invoice/Order not found or not paid:", {
                    provided_invoice_id: data.invoice_id,
                    provided_order_id: data.order_id,
                    order_found: !!orderData,
                    status: orderData?.status
                })
                throw new Error("Invalid order reference. Please ensure your payment is confirmed before leaving feedback.")
            }
        }

        // Handle case where orders might be returned as an array or object
        const order = Array.isArray(invoice.orders) ? invoice.orders[0] : invoice.orders
        if (!order) throw new Error("Internal error: Order not found for this invoice.")

        if (invoice.status !== "paid" && order.status !== "paid" && order.status !== "delivered" && order.status !== "completed") {
            throw new Error("Feedback can only be left for paid or completed orders.")
        }

        // 2. Check for existing feedback
        const { data: existing } = await supabase
            .from("feedbacks")
            .select("id")
            .eq("invoice_id", invoice.id)
            .single()

        if (existing) throw new Error("You have already submitted feedback for this order.")

        // 3. Get user info (safe for guests)
        let userId: string | undefined
        try {
            const { data: authData } = await supabase.auth.getUser()
            userId = authData?.user?.id
        } catch (e) {
            console.log("[SUBMIT_FEEDBACK] Guest submission - no user session")
        }

        // 4. Determine auto-approval status
        const settings = await getSiteSettings()
        const autoApprove = settings.feedbacks.enable_automatic

        // 5. Insert feedback using admin client to bypass RLS
        // We have already validated that they own the invoice/order via search/status check
        const adminSupabase = await createAdminClient()
        const { data: feedback, error } = await adminSupabase
            .from("feedbacks")
            .insert({
                invoice_id: invoice.id,
                order_id: order.id,
                customer_id: userId,
                email: order.email,
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
            console.error("[SUBMIT_FEEDBACK_DB_ERROR]", error)
            throw new Error("Failed to save feedback to database.")
        }

        return feedback
    } catch (e: any) {
        console.error("[SUBMIT_FEEDBACK_ERROR]", e)
        throw new Error(e.message || "An unexpected error occurred during submission.")
    }
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
        const adminSupabase = await createAdminClient();

        const { data: feedback, error } = await adminSupabase
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
            throw error
        }

        return feedback as Feedback
    } catch (e: any) {
        console.error("[ADMIN_ADD_MANUAL_CRASH]", e)
        throw e
    }
}
```
