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

        let { data, error } = await query
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: false })

        // Fallback if sort_order column doesn't exist yet
        if (error && error.code === '42703') {
            console.warn("[GET_PRODUCTS_FALLBACK] sort_order missing, falling back to created_at");
            const fallback = await supabase
                .from("products")
                .select(`
                    *,
                    category:product_categories (*),
                    variants:product_variants (*),
                    badge_links:product_badge_links(badge:product_badges(*))
                `)
                .neq("is_deleted", true)
                .order("created_at", { ascending: false })

            data = fallback.data
            error = fallback.error
        }

        if (error) throw error

        // Fetch sales data separately
        const { data: orderItems, error: orderItemsError } = await supabase
            .from("order_items")
            .select(`
                product_id,
                quantity,
                order:orders!inner(status)
            `)
            .in("order.status", ['paid', 'completed', 'delivered'])

        if (orderItemsError) {
            console.error("[GET_ORDER_ITEMS_ERROR]", orderItemsError)
        }

        // Calculate sales count for each product
        const salesByProduct = (orderItems || []).reduce((acc: Record<string, number>, item: any) => {
            if (!acc[item.product_id]) {
                acc[item.product_id] = 0
            }
            acc[item.product_id] += item.quantity || 0
            return acc
        }, {})

        // Add sales count to products
        const productsWithSales = data?.map(product => ({
            ...product,
            sales_count: salesByProduct[product.id] || 0
        })) || []

        return productsWithSales
    } catch (e) {
        console.error("[GET_PRODUCTS_CRITICAL]", e)
        return []
    }
}

import { revalidatePath, unstable_noStore } from "next/cache"

export async function getProduct(idOrSlug: string) {
    unstable_noStore()
    try {
        const supabase = await createServerClient()
        revalidatePath(`/product/${idOrSlug}`)

        // First, try to get by ID
        let { data, error } = await supabase
            .from("products")
            .select(`
                *,
                category:product_categories (*),
                variants:product_variants (*),
                badge_links:product_badge_links(badge:product_badges(*))
            `)
            .eq("id", idOrSlug)
            .single()

        // If not found by ID, try by slug
        if (error || !data) {
            const slugResult = await supabase
                .from("products")
                .select(`
                    *,
                    category:product_categories (*),
                    variants:product_variants (*),
                    badge_links:product_badge_links(badge:product_badges(*))
                `)
                .eq("slug", idOrSlug)
                .eq("is_active", true)
                .single()

            data = slugResult.data
            error = slugResult.error
        }

        if (error) throw error
        console.error(`[DIAGNOSTIC] PRODUCT_ID: ${idOrSlug}`, {
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

// Helper function to generate a URL-safe slug from a name
function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')           // Replace spaces with hyphens
        .replace(/[^a-z0-9-]/g, '')     // Remove special characters
        .replace(/-+/g, '-')            // Replace multiple hyphens with single
        .replace(/^-|-$/g, '')          // Remove leading/trailing hyphens
}

export async function createProduct(product: any) {
    const supabaseAdmin = await getAdminClient()

    // Auto-generate slug from name if not provided
    const slug = product.slug
        ? generateSlug(product.slug)
        : generateSlug(product.name)

    const insertData: any = {
        name: product.name,
        slug: slug,
        price: Number(product.price) || 0,
        currency: product.currency || 'USD',
        is_active: product.is_active !== undefined ? product.is_active : true,
        visibility: product.visibility || 'public',
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
        webhook_url: product.webhook_url && product.webhook_url !== "" ? product.webhook_url : null,
        custom_fields: product.custom_fields || null,
        deliverable_selection_method: product.deliverable_selection_method || 'last',
        disabled_payment_methods: product.disabled_payment_methods || []
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
    if (updates.webhook_url !== undefined) cleanUpdates.webhook_url = updates.webhook_url || null
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
    if (cleanUpdates.visibility !== undefined) cleanUpdates.visibility = cleanUpdates.visibility
    if (cleanUpdates.show_view_count !== undefined) cleanUpdates.show_view_count = !!cleanUpdates.show_view_count
    if (cleanUpdates.show_sales_count !== undefined) cleanUpdates.show_sales_count = !!cleanUpdates.show_sales_count
    if (cleanUpdates.show_sales_notifications !== undefined) cleanUpdates.show_sales_notifications = !!cleanUpdates.show_sales_notifications
    if (cleanUpdates.custom_fields !== undefined) cleanUpdates.custom_fields = cleanUpdates.custom_fields || null
    if (cleanUpdates.disabled_payment_methods !== undefined) {
        cleanUpdates.disabled_payment_methods = Array.isArray(cleanUpdates.disabled_payment_methods)
            ? cleanUpdates.disabled_payment_methods
            : []
    }

    // Handle slug - auto-generate from name if empty, otherwise sanitize
    if (cleanUpdates.slug !== undefined || cleanUpdates.name !== undefined) {
        if (!cleanUpdates.slug || cleanUpdates.slug === "") {
            // Auto-generate slug from name
            const name = cleanUpdates.name || updates.name
            if (name) {
                cleanUpdates.slug = generateSlug(name)
            }
        } else {
            // Sanitize provided slug
            cleanUpdates.slug = generateSlug(cleanUpdates.slug)
        }
    }

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
    try {
        const supabaseAdmin = await getAdminClient()

        // Use a loop for sequential updates to avoid potential race conditions 
        // or concurrency issues with Supabase during bulk updates in Server Actions
        for (const item of orders) {
            const { error } = await supabaseAdmin
                .from("products")
                .update({ sort_order: item.sort_order })
                .eq("id", item.id)

            if (error) {
                console.error(`[UPDATE_PRODUCT_ORDER_ERROR] ID: ${item.id}`, error)
                throw error
            }
        }

        revalidatePath('/admin/products')
        revalidatePath('/store')
        return { success: true }
    } catch (e: any) {
        console.error("[UPDATE_PRODUCT_ORDER_CRITICAL]", e)
        throw new Error(e.message || "Failed to update product order")
    }
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

export async function getCategoriesWithProducts() {
    try {
        const supabase = await createServerClient()
        const { data, error } = await supabase
            .from("product_categories")
            .select("*, products(id, name, is_active)") // Fetch minimal product info
            .order("sort_order", { ascending: true })

        if (error) throw error
        return data
    } catch (e) {
        console.error("[GET_CATEGORIES_WITH_PRODUCTS_CRITICAL]", e)
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



export async function getCategory(id: string) {
    try {
        const supabase = await createServerClient()
        const { data, error } = await supabase
            .from("product_categories")
            .select("*")
            .eq("id", id)
            .single()

        if (error) throw error
        return data
    } catch (e) {
        console.error("[GET_CATEGORY_CRITICAL]", e)
        return null
    }
}

export async function createCategory(name: string, extraFields?: any) {
    const supabaseAdmin = await getAdminClient()
    const slug = name.toLowerCase().replace(/ /g, '-')
    const { data, error } = await supabaseAdmin
        .from('product_categories')
        .insert({
            name,
            slug,
            ...extraFields
        })
        .select()

    if (error) throw error
    return data?.[0]
}

export async function updateCategory(id: string, updates: any) {
    const supabaseAdmin = await getAdminClient()
    const { data, error } = await supabaseAdmin
        .from('product_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    return data
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
            description: variant.description || null,
            min_quantity: Number(variant.min_quantity) || 1,
            max_quantity: Number(variant.max_quantity) || 10,
            webhook_url: variant.webhook_url || null,
            is_active: variant.is_active !== undefined ? variant.is_active : true,
            sort_order: variant.sort_order || 0,
            instructions: variant.instructions || null,
            volume_discounts: variant.volume_discounts || [],
            disable_volume_discounts_on_coupon: !!variant.disable_volume_discounts_on_coupon,
            deliverable_selection_method: variant.deliverable_selection_method || 'last',
            disabled_payment_methods: variant.disabled_payment_methods || [],
            discord_group_id: variant.discord_group_id || null,
            discord_role_id: variant.discord_role_id || null,
            redirect_url: variant.redirect_url || null,
            delivery_type: variant.delivery_type || 'serials'
        })
        .select()

    if (error) {
        console.error("CREATE VARIANT ERROR:", error)
        throw new Error(error.message)
    }
    return data?.[0]
}

export async function updateVariant(id: string, updates: any) {
    const supabaseAdmin = await getAdminClient()

    // Cleanup updates
    const cleanUpdates = { ...updates }
    if (cleanUpdates.webhook_url === "") cleanUpdates.webhook_url = null
    if (cleanUpdates.price !== undefined) cleanUpdates.price = Number(cleanUpdates.price)
    if (cleanUpdates.slashed_price !== undefined) cleanUpdates.slashed_price = cleanUpdates.slashed_price ? Number(cleanUpdates.slashed_price) : null
    if (cleanUpdates.stock_count !== undefined) cleanUpdates.stock_count = Number(cleanUpdates.stock_count)
    if (cleanUpdates.min_quantity !== undefined) cleanUpdates.min_quantity = Number(cleanUpdates.min_quantity)
    if (cleanUpdates.max_quantity !== undefined) cleanUpdates.max_quantity = Number(cleanUpdates.max_quantity)
    if (cleanUpdates.instructions !== undefined) cleanUpdates.instructions = cleanUpdates.instructions || null
    if (cleanUpdates.volume_discounts !== undefined) cleanUpdates.volume_discounts = cleanUpdates.volume_discounts || []
    if (cleanUpdates.disable_volume_discounts_on_coupon !== undefined) cleanUpdates.disable_volume_discounts_on_coupon = !!cleanUpdates.disable_volume_discounts_on_coupon
    if (cleanUpdates.deliverable_selection_method !== undefined) cleanUpdates.deliverable_selection_method = cleanUpdates.deliverable_selection_method || 'last'
    if (cleanUpdates.disabled_payment_methods !== undefined) cleanUpdates.disabled_payment_methods = cleanUpdates.disabled_payment_methods || []
    if (cleanUpdates.discord_group_id !== undefined) cleanUpdates.discord_group_id = cleanUpdates.discord_group_id || null
    if (cleanUpdates.discord_role_id !== undefined) cleanUpdates.discord_role_id = cleanUpdates.discord_role_id || null
    if (cleanUpdates.redirect_url !== undefined) cleanUpdates.redirect_url = cleanUpdates.redirect_url || null
    if (cleanUpdates.delivery_type !== undefined) cleanUpdates.delivery_type = cleanUpdates.delivery_type || 'serials'

    const { data, error } = await supabaseAdmin
        .from('product_variants')
        .update(cleanUpdates)
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

export async function updateCategoryProducts(categoryId: string, productIds: string[]) {
    const supabaseAdmin = await getAdminClient()

    // 1. Set all products currently in this category to null
    await supabaseAdmin
        .from('products')
        .update({ category_id: null })
        .eq('category_id', categoryId)

    // 2. Set the new products to this category
    if (productIds.length > 0) {
        const { error: addError } = await supabaseAdmin
            .from('products')
            .update({ category_id: categoryId })
            .in('id', productIds)

        if (addError) throw addError
    }
}

export async function reorderVariants(variantOrder: { id: string, sort_order: number }[]) {
    const supabaseAdmin = await getAdminClient()

    // Perform batch update using a series of promises for now, as Supabase doesn't have a built-in batch update for different IDs in one go easily without RPC
    const updates = variantOrder.map(item =>
        supabaseAdmin
            .from('product_variants')
            .update({ sort_order: item.sort_order })
            .eq('id', item.id)
    )

    const results = await Promise.all(updates)
    const errors = results.filter(r => r.error).map(r => r.error)

    if (errors.length > 0) {
        console.error("[REORDER_VARIANTS_ERROR]", errors)
        throw new Error("Failed to reorder some variants")
    }
}
