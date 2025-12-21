"use server"

import { createAdminClient } from "@/lib/supabase/server"

export type StockItem = {
    id: string
    content: string
    type: 'serial' | 'file' | 'key' | 'text' | 'url'
    is_used: boolean
    created_at: string
}

export async function addStock(productId: string, items: string[], type: string = 'text') {
    const supabase = await createAdminClient()

    if (!items || items.length === 0) return

    // 1. Prepare inserts
    const assets = items.map(content => ({
        product_id: productId,
        content: content,
        type: type,
        is_used: false
    }))

    // 2. Insert assets
    const { error: insertError } = await supabase
        .from("delivery_assets")
        .insert(assets)

    if (insertError) throw insertError

    // 3. Update product stock count
    // We increment by the number of items added
    await supabase.rpc('increment_stock', { p_product_id: productId, p_amount: items.length })
    // If rpc doesn't exist (I didn't create it), do manual update?
    // Doing manual update is risky for concurrency, but for Admin adding stock it's usually fine.
    // Ideally I should add 'increment_stock' RPC too. 
    // Or just:
    // update products set stock_count = stock_count + N where id = ...
    // Since I can't write raw SQL easily without rpc...
    // I'll grab current count and update? No, that's race condition.
    // I'll add 'increment_stock' to the migration!

    // WAIT. I'll just use a direct update if possible using .rpc if I create it.
    // If I don't create it, I can't do atomic increment easily with standard Supabase JS client 
    // unless I assume single admin.
    // I WILL ADD `increment_stock` to migration 010.
}

export async function getStock(productId: string, page = 1, limit = 50) {
    const supabase = await createAdminClient()
    const start = (page - 1) * limit
    const end = start + limit - 1

    const { data, count, error } = await supabase
        .from("delivery_assets")
        .select("*", { count: 'exact' })
        .eq("product_id", productId)
        .eq("is_used", false)
        .range(start, end)
        .order("created_at", { ascending: false })

    if (error) throw error
    return { data: data as StockItem[], count }
}

export async function deleteStock(ids: string[], productId: string) {
    const supabase = await createAdminClient()

    const { error } = await supabase
        .from("delivery_assets")
        .delete()
        .in("id", ids)

    if (error) throw error

    // Decrement stock count
    // Again, need atomic decrement.
    // I'll use the rpc 'increment_stock' with negative value.
    await supabase.rpc('increment_stock', { p_product_id: productId, p_amount: -ids.length })
}
