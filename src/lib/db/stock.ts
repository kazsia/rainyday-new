"use server"

import { createAdminClient } from "@/lib/supabase/server"

export type StockItem = {
    id: string
    content: string
    type: 'serial' | 'file' | 'key' | 'text' | 'url'
    variant_id?: string
    created_at: string
}

export async function addStock(productId: string, items: string[], type: string = 'text', variantId?: string) {
    const supabase = await createAdminClient()

    if (!items || items.length === 0) return

    // 1. Prepare inserts
    const assets = items.map(content => ({
        product_id: productId,
        content: content,
        type: type,
        is_used: false,
        variant_id: variantId || null
    }))

    // 2. Insert assets
    const { error: insertError } = await supabase
        .from("delivery_assets")
        .insert(assets)

    if (insertError) throw insertError

    // Update product/variant stock count
    if (variantId) {
        await supabase.rpc('increment_variant_stock', { p_variant_id: variantId, p_amount: items.length })
    } else {
        await supabase.rpc('increment_stock', { p_product_id: productId, p_amount: items.length })
    }
}

export async function getStock(productId: string, page = 1, limit = 50, variantId?: string) {
    const supabase = await createAdminClient()
    const start = (page - 1) * limit
    const end = start + limit - 1

    let query = supabase
        .from("delivery_assets")
        .select("*", { count: 'exact' })
        .eq("product_id", productId)
        .eq("is_used", false)

    if (variantId) {
        query = query.eq("variant_id", variantId)
    } else {
        query = query.is("variant_id", null)
    }

    const { data, count, error } = await query
        .range(start, end)
        .order("created_at", { ascending: false })

    if (error) throw error
    return { data: data as StockItem[], count }
}

export async function deleteStock(ids: string[], productId: string, variantId?: string) {
    const supabase = await createAdminClient()

    const { error } = await supabase
        .from("delivery_assets")
        .delete()
        .in("id", ids)

    if (error) throw error

    // Decrement stock count
    if (variantId) {
        await supabase.rpc('increment_variant_stock', { p_variant_id: variantId, p_amount: -ids.length })
    } else {
        await supabase.rpc('increment_stock', { p_product_id: productId, p_amount: -ids.length })
    }
}
