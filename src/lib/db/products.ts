"use server"

import { createClient as createServerClient, createAdminClient } from "@/lib/supabase/server"
import { createClient as createDirectClient } from "@supabase/supabase-js"

// Helper to get admin client lazily
async function getAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error("Supabase admin credentials missing")
    }

    return createDirectClient(supabaseUrl, supabaseServiceKey)
}

export async function getProducts(options?: { categoryId?: string; activeOnly?: boolean }) {
    try {
        const supabase = await createServerClient()

        let query = supabase
            .from("products")
            .select(`
                *,
                category:product_categories (*),
                variants:product_variants (*),
                badge_links:product_badge_links(badge:product_badges(*))
            `)
            .neq("is_deleted", true)

        if (options?.activeOnly !== false) {
            query = query.eq("is_active", true)
        }

        if (options?.categoryId) {
            query = query.eq("category_id", options.categoryId)
        }

        // Default to created_at
        const { data, error } = await query
            .order("created_at", { ascending: false })

        if (error) throw error
        return data
    } catch (e) {
        console.error("[GET_PRODUCTS_CRITICAL]", e)
        return []
    }
}

import { revalidatePath, unstable_noStore } from "next/cache"

export async function getProduct(id: string) {
    unstable_noStore()
    try {
        const supabase = await createServerClient()
        revalidatePath(`/product/${id}`)

        const { data, error } = await supabase
            .from("products")
            .select(`
                *,
                category:product_categories (*),
                variants:product_variants (*),
                badge_links:product_badge_links(badge:product_badges(*))
            `)
            .eq("id", id)
            .single()

        if (error) throw error
        console.error(`[DIAGNOSTIC] PRODUCT_ID: ${id}`, {
            name: data?.name,
            product_stock: data?.stock_count,
            badges_count: data?.badge_links?.length,
            variants: data?.variants?.map((v: any) => ({ name: v.name, stock: v.stock_count }))
        })
        return data
    } catch (e) {
        console.error("[GET_PRODUCT_CRITICAL]", e)
        return null
    }
}

export async function createProduct(product: any) {
    const supabaseAdmin = await getAdminClient()
    const insertData: any = {
        name: product.name,
        price: Number(product.price) || 0,
        currency: product.currency || 'USD',
        is_active: product.is_active !== undefined ? product.is_active : true,
        stock_count: Number(product.stock_count) || 0,
        description: product.description || null,
        image_url: product.image_url || null,
        instructions: product.instructions || null,
        delivery_type: product.delivery_type || 'serials',
        status_label: product.status_label || 'In Stock!',
        status_color: product.status_color || 'green',
        show_view_count: !!product.show_view_count,
        show_sales_count: product.show_sales_count !== undefined ? product.show_sales_count : true,
        show_sales_notifications: product.show_sales_notifications !== undefined ? product.show_sales_notifications : true,
        slashed_price: product.slashed_price ? Number(product.slashed_price) : null,
        min_quantity: Number(product.min_quantity) || 1,
        max_quantity: Number(product.max_quantity) || 10,
        category_id: product.category_id && product.category_id !== "" ? product.category_id : null,
        webhook_url: product.webhook_url && product.webhook_url !== "" ? product.webhook_url : null
    }

    const { data, error } = await supabaseAdmin
        .from("products")
        .insert(insertData)
        .select()

    if (error) throw error
    return data?.[0]
}

export async function updateProduct(id: string, updates: any) {
    const supabaseAdmin = await getAdminClient()

    // Defensive cleanup of common fields
    const cleanUpdates = { ...updates }
    delete cleanUpdates.badges // Relation, not a column
    if (cleanUpdates.category_id === "") cleanUpdates.category_id = null
    if (cleanUpdates.image_url === "") cleanUpdates.image_url = null
    if (cleanUpdates.webhook_url === "") cleanUpdates.webhook_url = null
    if (cleanUpdates.price !== undefined) cleanUpdates.price = Number(cleanUpdates.price)
    if (cleanUpdates.slashed_price !== undefined) cleanUpdates.slashed_price = cleanUpdates.slashed_price ? Number(cleanUpdates.slashed_price) : null
    if (cleanUpdates.stock_count !== undefined) cleanUpdates.stock_count = Number(cleanUpdates.stock_count)
    if (cleanUpdates.min_quantity !== undefined) cleanUpdates.min_quantity = Number(cleanUpdates.min_quantity)
    if (cleanUpdates.max_quantity !== undefined) cleanUpdates.max_quantity = Number(cleanUpdates.max_quantity)
    if (cleanUpdates.hide_stock !== undefined) cleanUpdates.hide_stock = !!cleanUpdates.hide_stock
    if (cleanUpdates.is_active !== undefined) cleanUpdates.is_active = !!cleanUpdates.is_active
    if (cleanUpdates.show_view_count !== undefined) cleanUpdates.show_view_count = !!cleanUpdates.show_view_count
    if (cleanUpdates.show_sales_count !== undefined) cleanUpdates.show_sales_count = !!cleanUpdates.show_sales_count
    if (cleanUpdates.show_sales_notifications !== undefined) cleanUpdates.show_sales_notifications = !!cleanUpdates.show_sales_notifications

    const { data, error } = await supabaseAdmin
        .from("products")
        .update(cleanUpdates)
        .eq("id", id)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function deleteProduct(id: string) {
    const supabaseAdmin = await getAdminClient()

    // 1. Check for existing orders
    const { count, error: countError } = await supabaseAdmin
        .from("order_items")
        .select("*", { count: 'exact', head: true })
        .eq("product_id", id)

    if (countError) {
        console.error("Error checking orders for product deletion:", countError)
        throw new Error("Failed to check product dependencies")
    }

    // 2. Hybrid Delete Logic
    if (count && count > 0) {
        // Soft Delete: Mark as deleted to preserve order history
        const { error } = await supabaseAdmin
            .from("products")
            .update({ is_deleted: true, is_active: false })
            .eq("id", id)

        if (error) throw error
        return { success: true, message: "Product deleted (archived due to order history)" }
    } else {
        // Hard Delete: Safe to remove row
        const { error } = await supabaseAdmin
            .from("products")
            .delete()
            .eq("id", id)

        if (error) throw error
        return { success: true, message: "Product deleted successfully" }
    }
}

export async function archiveProduct(id: string) {
    const supabaseAdmin = await getAdminClient()

    const { error } = await supabaseAdmin
        .from("products")
        .update({ is_active: false })
        .eq("id", id)

    if (error) throw error
    return { success: true, message: "Product archived successfully" }
}

export async function cloneProduct(id: string) {
    const original = await getProduct(id)
    if (!original) throw new Error("Product not found")

    const { id: _id, created_at, updated_at, slug, ...rest } = original

    const newProduct = {
        ...rest,
        name: `${rest.name} (Copy)`,
        slug: rest.slug ? `${rest.slug}-copy-${Math.random().toString(36).substring(2, 6)}` : null,
        is_active: false // Keep hidden by default
    }

    return await createProduct(newProduct)
}

export async function updateProductOrder(orders: { id: string, sort_order: number }[]) {
    const supabaseAdmin = await getAdminClient()
    // We use a Promise.all with upserts for simplicity in small sets
    // For large sets, a dedicated RPC would be better
    const updates = orders.map(item =>
        supabaseAdmin
            .from("products")
            .update({ sort_order: item.sort_order })
            .eq("id", item.id)
    )

    const results = await Promise.all(updates)
    const error = results.find(r => r.error)
    if (error) throw error.error
}

export async function getCategories() {
    try {
        const supabase = await createServerClient()
        const { data, error } = await supabase
            .from("product_categories")
            .select("*")
            .order("name", { ascending: true })

        if (error) throw error
        return data
    } catch (e) {
        console.error("[GET_CATEGORIES_CRITICAL]", e)
        return []
    }
}

export async function updateCategoryOrder(orders: { id: string, sort_order: number }[]) {
    const supabaseAdmin = await getAdminClient()
    const updates = orders.map(item =>
        supabaseAdmin
            .from("product_categories")
            .update({ sort_order: item.sort_order })
            .eq("id", item.id)
    )

    const results = await Promise.all(updates)
    const error = results.find(r => r.error)
    if (error) throw error.error
}

export async function createCategory(name: string) {
    const supabaseAdmin = await getAdminClient()
    const slug = name.toLowerCase().replace(/ /g, '-')
    const { data, error } = await supabaseAdmin
        .from('product_categories')
        .insert({ name, slug })
        .select()

    if (error) throw error
    return data?.[0]
}

export async function deleteCategory(id: string) {
    const supabaseAdmin = await getAdminClient()
    const { error } = await supabaseAdmin
        .from('product_categories')
        .delete()
        .eq('id', id)

    if (error) throw error
}

// VARIANT MANAGEMENT
export async function getVariants(productId: string) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .order('sort_order', { ascending: true })

    if (error) throw error
    return data
}

export async function createVariant(productId: string, variant: any) {
    const supabaseAdmin = await getAdminClient()
    const { data, error } = await supabaseAdmin
        .from('product_variants')
        .insert({
            product_id: productId,
            name: variant.name,
            price: Number(variant.price),
            slashed_price: variant.slashed_price ? Number(variant.slashed_price) : null,
            stock_count: Number(variant.stock_count) || 0,
            is_active: variant.is_active !== undefined ? variant.is_active : true,
            sort_order: variant.sort_order || 0
        })
        .select()

    if (error) throw error
    return data?.[0]
}

export async function updateVariant(id: string, updates: any) {
    const supabaseAdmin = await getAdminClient()
    const { data, error } = await supabaseAdmin
        .from('product_variants')
        .update(updates)
        .eq('id', id)
        .select()

    if (error) throw error
    return data?.[0]
}

export async function deleteVariant(id: string) {
    const supabaseAdmin = await getAdminClient()
    const { error } = await supabaseAdmin
        .from('product_variants')
        .delete()
        .eq('id', id)

    if (error) throw error
}
