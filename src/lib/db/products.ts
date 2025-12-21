"use server"

import { createClient as createServerClient, createAdminClient } from "@/lib/supabase/server"
import { createClient as createDirectClient } from "@supabase/supabase-js"

const supabaseAdmin = createDirectClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function getProducts(options?: { categoryId?: string; activeOnly?: boolean }) {
    const supabase = await createServerClient()

    let query = supabase
        .from("products")
        .select(`
            *,
            category:product_categories (*)
        `)

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
}

export async function getProduct(id: string) {
    const supabase = await createServerClient()

    const { data, error } = await supabase
        .from("products")
        .select(`
            *,
            category:product_categories (*)
        `)
        .eq("id", id)
        .single()

    if (error) throw error
    return data
}

export async function createProduct(product: any) {
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
        category_id: product.category_id || null
    }

    const { data, error } = await supabaseAdmin
        .from("products")
        .insert(insertData)
        .select()

    if (error) throw error
    return data?.[0]
}

export async function updateProduct(id: string, updates: any) {
    const { data, error } = await supabaseAdmin
        .from("products")
        .update(updates)
        .eq("id", id)
        .select()

    if (error) throw error
    return data?.[0]
}

export async function deleteProduct(id: string) {
    const { error } = await supabaseAdmin
        .from("products")
        .delete()
        .eq("id", id)

    if (error) throw error
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
    const supabase = await createServerClient()
    const { data, error } = await supabase
        .from("product_categories")
        .select("*")
        .order("name", { ascending: true })

    if (error) throw error
    return data
}

export async function updateCategoryOrder(orders: { id: string, sort_order: number }[]) {
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
    const slug = name.toLowerCase().replace(/ /g, '-')
    const { data, error } = await supabaseAdmin
        .from('product_categories')
        .insert({ name, slug })
        .select()

    if (error) throw error
    return data?.[0]
}

export async function deleteCategory(id: string) {
    const { error } = await supabaseAdmin
        .from('product_categories')
        .delete()
        .eq('id', id)

    if (error) throw error
}
