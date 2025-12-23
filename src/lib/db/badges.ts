"use server"

import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient as createDirectClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

// Helper to get admin client lazily
async function getAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error("Supabase admin credentials missing")
    }

    return createDirectClient(supabaseUrl, supabaseServiceKey)
}

export async function getBadges() {
    try {
        const supabase = await createServerClient()
        const { data, error } = await supabase
            .from("product_badges")
            .select("*")
            .order("created_at", { ascending: true })

        if (error) throw error
        console.log(`[GET_BADGES] Found ${data?.length} badges`)
        return data || []
    } catch (e) {
        console.error("[GET_BADGES_CRITICAL]", e)
        return []
    }
}

export async function createBadge(badge: { name: string; icon?: string; color?: string }) {
    try {
        const supabaseAdmin = await getAdminClient()
        const { data, error } = await supabaseAdmin
            .from("product_badges")
            .insert(badge)
            .select()
            .single()

        if (error) throw error
        return data
    } catch (e) {
        console.error("[CREATE_BADGE_CRITICAL]", e)
        throw e
    }
}

export async function updateBadge(id: string, updates: { name?: string; icon?: string; color?: string }) {
    try {
        const supabaseAdmin = await getAdminClient()
        const { data, error } = await supabaseAdmin
            .from("product_badges")
            .update(updates)
            .eq("id", id)
            .select()
            .single()

        if (error) throw error
        return data
    } catch (e) {
        console.error("[UPDATE_BADGE_CRITICAL]", e)
        throw e
    }
}

export async function deleteBadge(id: string) {
    try {
        const supabaseAdmin = await getAdminClient()
        const { error } = await supabaseAdmin
            .from("product_badges")
            .delete()
            .eq("id", id)

        if (error) throw error
        return true
    } catch (e) {
        console.error("[DELETE_BADGE_CRITICAL]", e)
        throw e
    }
}

export async function getProductBadges(productId: string) {
    try {
        const supabase = await createServerClient()
        const { data, error } = await supabase
            .from("product_badge_links")
            .select(`
                badge_id,
                badge:product_badges (*)
            `)
            .eq("product_id", productId)

        if (error) throw error
        return data?.map(item => item.badge) || []
    } catch (e) {
        console.error("[GET_PRODUCT_BADGES_CRITICAL]", e)
        return []
    }
}

export async function updateProductBadges(productId: string, badgeIds: string[]) {
    try {
        const supabaseAdmin = await getAdminClient()

        // Delete existing links
        const { error: deleteError } = await supabaseAdmin
            .from("product_badge_links")
            .delete()
            .eq("product_id", productId)

        if (deleteError) throw deleteError

        if (badgeIds.length > 0) {
            // Insert new links
            const { error: insertError } = await supabaseAdmin
                .from("product_badge_links")
                .insert(badgeIds.map(badgeId => ({
                    product_id: productId,
                    badge_id: badgeId
                })))

            if (insertError) throw insertError
        }

        // Force revalidation of impacted pages
        revalidatePath(`/product/${productId}`)
        revalidatePath(`/store`)
        revalidatePath(`/`)

        return true
    } catch (e) {
        console.error("[UPDATE_PRODUCT_BADGES_CRITICAL]", e)
        throw e
    }
}
