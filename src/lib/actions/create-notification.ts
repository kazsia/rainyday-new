"use server"

import { createAdminClient } from "@/lib/supabase/server"

export type NotificationType =
    | 'new_order'
    | 'payment_confirmed'
    | 'high_value_sale'
    | 'refund_issued'
    | 'chargeback'
    | 'new_customer'
    | 'repeat_buyer'
    | 'large_quantity'
    | 'webhook_failure'
    | 'payment_retry'
    | 'delivery_resend'

export type NotificationSeverity = 'info' | 'warning' | 'critical'

export interface AdminNotification {
    id: string
    type: NotificationType
    severity: NotificationSeverity
    title: string
    message: string
    related_order_id: string | null
    order_readable_id?: string | null
    related_user_id: string | null
    metadata: Record<string, unknown>
    created_at: string
    read_at: string | null
}

/**
 * Create an admin notification (server-side only).
 * Uses database function with built-in spam control.
 */
export async function createAdminNotification(
    type: NotificationType,
    title: string,
    message: string,
    opts?: {
        severity?: NotificationSeverity
        relatedOrderId?: string
        relatedUserId?: string
        metadata?: Record<string, unknown>
        windowSeconds?: number // Spam control window
    }
): Promise<string | null> {
    try {
        const supabase = await createAdminClient()

        // Use database function for atomic creation with spam control
        const { data, error } = await supabase.rpc('create_admin_notification', {
            p_type: type,
            p_title: title,
            p_message: message,
            p_severity: opts?.severity || 'info',
            p_related_order_id: opts?.relatedOrderId || null,
            p_related_user_id: opts?.relatedUserId || null,
            p_metadata: opts?.metadata || {},
            p_window_seconds: opts?.windowSeconds || 5
        })

        if (error) {
            console.error('[Notification] Failed to create:', error)
            return null
        }

        return data as string | null
    } catch (error) {
        console.error('[Notification] Error:', error)
        return null
    }
}

/**
 * Get unread notification count.
 */
export async function getUnreadNotificationCount(): Promise<number> {
    try {
        const supabase = await createAdminClient()

        const { count, error } = await supabase
            .from('admin_notifications')
            .select('*', { count: 'exact', head: true })
            .is('read_at', null)

        if (error) {
            console.error('[Notification] Count error:', error)
            return 0
        }

        return count || 0
    } catch (error) {
        console.error('[Notification] Error:', error)
        return 0
    }
}

/**
 * Get recent notifications for admin panel.
 */
export async function getRecentNotifications(limit: number = 50): Promise<AdminNotification[]> {
    try {
        const supabase = await createAdminClient()

        const { data, error } = await supabase
            .from('admin_notifications')
            .select(`
                *,
                order:orders!related_order_id (readable_id)
            `)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) {
            console.error('[Notification] Fetch error details:', error)
            return []
        }

        console.log('[Notification] Data fetched from DB:', data?.length || 0, 'items')
        return (data || []).map(n => ({
            ...n,
            order_readable_id: (n as any).order?.readable_id
        })) as AdminNotification[]
    } catch (error) {
        console.error('[Notification] Error fetching notifications:', error)
        return []
    }
}

/**
 * Mark a notification as read.
 */
export async function markNotificationRead(id: string): Promise<boolean> {
    try {
        const supabase = await createAdminClient()

        const { error } = await supabase
            .from('admin_notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('id', id)

        return !error
    } catch (error) {
        console.error('[Notification] Mark read error:', error)
        return false
    }
}

/**
 * Mark all notifications as read.
 */
export async function markAllNotificationsRead(): Promise<boolean> {
    try {
        const supabase = await createAdminClient()

        const { error } = await supabase
            .from('admin_notifications')
            .update({ read_at: new Date().toISOString() })
            .is('read_at', null)

        return !error
    } catch (error) {
        console.error('[Notification] Mark all read error:', error)
        return false
    }
}

/**
 * Helper: Create notification for payment confirmed.
 */
export async function notifyPaymentConfirmed(
    orderId: string,
    orderReadableId: string,
    total: number,
    email: string,
    cryptoAmount?: string,
    cryptoCurrency?: string,
    paymentMethod?: string,
    products?: Array<{ name: string; quantity: number; price: number; variant?: string }>,
    customFields?: Record<string, any>
): Promise<void> {
    const isHighValue = total >= 100

    // Create in-app admin notification
    await createAdminNotification(
        isHighValue ? 'high_value_sale' : 'payment_confirmed',
        isHighValue ? '💰 High-Value Sale!' : 'Payment Confirmed',
        `Order #${orderReadableId || orderId.slice(0, 6).toUpperCase()} - $${total.toFixed(2)} from ${email}`,
        {
            severity: isHighValue ? 'critical' : 'info',
            relatedOrderId: orderId,
            metadata: { total, email, orderReadableId, paymentMethod }
        }
    )

    // Send Discord webhook notification
    try {
        const { notifyDiscordSale } = await import('@/lib/notifications/discord-webhook')
        await notifyDiscordSale(orderId, orderReadableId, total, email, cryptoAmount, cryptoCurrency, paymentMethod, products, customFields)
    } catch (error) {
        console.error('[Notification] Discord webhook failed:', error)
    }
}

/**
 * Helper: Create notification for new order.
 */
export async function notifyNewOrder(
    orderId: string,
    orderReadableId: string,
    total: number,
    email: string
): Promise<void> {
    await createAdminNotification(
        'new_order',
        'New Order Created',
        `Order #${orderReadableId || orderId.slice(0, 6).toUpperCase()} - $${total.toFixed(2)}`,
        {
            severity: 'info',
            relatedOrderId: orderId,
            metadata: { total, email, orderReadableId }
        }
    )
}

/**
 * Helper: Create notification for refund.
 */
export async function notifyRefundIssued(
    orderId: string,
    orderReadableId: string,
    amount: number,
    reason?: string
): Promise<void> {
    await createAdminNotification(
        'refund_issued',
        '⚠️ Refund Issued',
        `Order #${orderReadableId || orderId.slice(0, 6).toUpperCase()} - $${amount.toFixed(2)} refunded${reason ? `: ${reason}` : ''}`,
        {
            severity: 'warning',
            relatedOrderId: orderId,
            metadata: { amount, reason }
        }
    )
}

/**
 * Helper: Create notification for new customer.
 */
export async function notifyNewCustomer(
    email: string,
    userId?: string
): Promise<void> {
    await createAdminNotification(
        'new_customer',
        'New Customer',
        `${email} made their first purchase`,
        {
            severity: 'info',
            relatedUserId: userId,
            metadata: { email },
            windowSeconds: 60 // Batch new customers
        }
    )
}
