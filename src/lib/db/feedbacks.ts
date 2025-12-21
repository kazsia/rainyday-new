"use server"

import { createClient } from "@/lib/supabase/server"

export async function submitFeedback(feedback: {
    product_id?: string
    rating: number
    content: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
        .from("feedbacks")
        .insert({
            user_id: user?.id,
            product_id: feedback.product_id,
            rating: feedback.rating,
            content: feedback.content,
            is_approved: false // Mandatory admin approval
        })
        .select()
        .single()

    if (error) throw error
    return data
}

export async function getApprovedFeedback(productId?: string) {
    try {
        const supabase = await createClient()
        let query = supabase
            .from("feedbacks")
            .select(`
                *,
                profiles:user_id (email)
            `)
            .eq("is_approved", true)

        if (productId) {
            query = query.eq("product_id", productId)
        }

        const { data, error } = await query.order("created_at", { ascending: false })

        if (error) {
            console.error("[GET_APPROVED_FEEDBACK] Fetch error:", error)
            return []
        }
        return data
    } catch (e) {
        console.error("[GET_APPROVED_FEEDBACK_CRITICAL]", e)
        return []
    }
}

export async function adminGetFeedbacks() {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from("feedbacks")
            .select(`
                *,
                profiles:user_id (email),
                products:product_id (name)
            `)
            .order("created_at", { ascending: false })

        if (error) {
            console.error("[ADMIN_GET_FEEDBACKS] Fetch error:", error)
            return []
        }
        return data
    } catch (e) {
        console.error("[ADMIN_GET_FEEDBACKS_CRITICAL]", e)
        return []
    }
}

export async function approveFeedback(id: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from("feedbacks")
        .update({ is_approved: true })
        .eq("id", id)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function deleteFeedback(id: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from("feedbacks")
        .delete()
        .eq("id", id)

    if (error) throw error
    return true
}
