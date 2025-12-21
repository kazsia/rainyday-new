"use server"

import { createAdminClient } from "@/lib/supabase/server"

/**
 * Triggered after a payment is marked as 'completed'
 * This function picks available assets and creates a delivery record.
 */
export async function deliverProduct(orderId: string) {
    const supabase = await createAdminClient()

    // 1. Get the order and items
    const { data: order, error: orderError } = await supabase
        .from("orders")
        .select(`
            *,
            order_items (*)
        `)
        .eq("id", orderId)
        .single()

    if (orderError) throw orderError
    if (order.status !== 'paid') {
        console.warn(`Order ${orderId} is not in 'paid' status. Current: ${order.status}`)
        return
    }

    const deliveredAssets: any[] = []

    // 2. For each item, claim stock atomically
    for (const item of order.order_items) {
        // Skip if quantity is 0 or product not serial-based? 
        // We assume all products here need delivery logic or we should check type.
        // But stock claim will just fail/return nothing if no assets exist?
        // Actually, we must check if product requires serials. 
        // But simpler: try claim. If error (insufficient), we log.
        // However, if product is 'service' type (manual), we might not have assets?
        // We should PROBABLY check product type. 
        // But simpler for now: try claim. 
        // Wait, 'claim_stock' throws if insufficient.
        // If product is Manual Service, it has NO assets. Method throws "Insufficient".
        // Use 'delivery_type' from product to decide.
        // Let's fetch product type in the query?
        // order_items -> product (delivery_type).

        // Let's fetch product details for items
        const { data: product, error: prodError } = await supabase
            .from("products")
            .select("delivery_type")
            .eq("id", item.product_id)
            .single()

        if (product?.delivery_type === 'serials' || product?.delivery_type === 'dynamic') {
            try {
                const { data: assets, error: rpcError } = await supabase.rpc('claim_stock', {
                    p_product_id: item.product_id,
                    p_quantity: item.quantity,
                    p_order_id: orderId
                })

                if (rpcError) throw rpcError

                // Append assets
                if (assets) {
                    assets.forEach((a: any) => deliveredAssets.push(a))
                }
            } catch (e) {
                console.error(`Failed to claim stock for item ${item.product_id}:`, e)
                throw e
            }
        }
    }

    // 3. Create the delivery record (even if empty? No, only if we delivered something or if it's manual)
    // If it's manual, we create a "Pending Delivery" record?
    // Current requirement: "buyers will get it". Implies instant.
    // We insert if we have assets.

    if (deliveredAssets.length > 0) {
        const { error: deliveryError } = await supabase
            .from("deliveries")
            .insert({
                order_id: orderId,
                delivery_assets: deliveredAssets, // Requires JSONB column
                content: "Your digital assets are ready.", // Fallback text
                status: 'delivered',
                type: 'instant'
            })

        if (deliveryError) throw deliveryError
    }

    // 4. Update order status to 'delivered' (or 'processing' if manual?)
    // If we delivered, mark delivered.
    await supabase
        .from("orders")
        .update({ status: 'delivered', updated_at: new Date().toISOString() })
        .eq("id", orderId)

    // 5. Generate Invoice
    const invoiceNumber = `INV-${Date.now()}-${orderId.split('-')[0]}`
    await supabase
        .from("invoices")
        .insert({
            order_id: orderId,
            invoice_number: invoiceNumber,
            status: 'paid'
        })

    return { success: true }
}
