"use server"

import { createPayment, updatePaymentStatus, getPaymentByOrder } from "@/lib/db/payments"
import { incrementCouponUsage } from "@/lib/actions/coupons"

export async function markOrderAsPaid(orderId: string, txId: string) {
    try {
        console.log(`[PAYMENT_VERIFY] Attempting to mark order ${orderId} as paid with TXID: ${txId}`)

        // 1. Find existing payment or create one
        let payment = await getPaymentByOrder(orderId)

        if (!payment) {
            // Should exist from checkout init, but fallback just in case
            console.warn(`[CHECKOUT] Payment not found for order ${orderId}, creating new one`)
            const { getOrder } = await import("@/lib/db/orders")
            const order = await getOrder(orderId)

            if (!order) throw new Error("Order not found")

            payment = await createPayment({
                order_id: orderId,
                provider: "Crypto", // Default fallback
                amount: order.total,
                currency: "USD",
                track_id: txId
            })
        }

        // 2. SECURITY CHECK: Verify the transaction status before trusting it
        // Check OxaPay first (if it's an OxaPay track ID or matches their usage)
        let isVerified = false
        let verifiedProvider = payment.provider || "Crypto"

        try {
            const { getOxaPayPaymentInfo } = await import("@/lib/payments/oxapay")
            // Try treating input as Track ID first
            let info = await getOxaPayPaymentInfo(payment.track_id || txId)

            if (info && (info.status === 'Paid' || info.status === 'Confirming')) {
                // Verified via OxaPay API
                isVerified = true
                verifiedProvider = info.payCurrency || verifiedProvider
                console.log(`[PAYMENT_VERIFY] Verified via OxaPay: ${JSON.stringify(info)}`)
            } else {
                console.log("[PAYMENT_VERIFY] OxaPay verification failed or returned non-paid status.")
            }
        } catch (verifyError) {
            console.error("[PAYMENT_VERIFY] Verification failed:", verifyError)
        }

        if (!isVerified) {
            console.error(`[PAYMENT_VERIFY] FAILED: Could not verify transaction ${txId} for order ${orderId}`)
            return { success: false, error: "Payment verification failed. Please wait a moment and try again." }
        }

        // 3. Update status to completed
        // This triggers all the side effects (delivery, email, etc.) in updatePaymentStatus
        const updated = await updatePaymentStatus(payment.id, "completed", {
            trackId: txId,
            provider: verifiedProvider,
            payload: { type: "verified_client_update", txId, method: "markOrderAsPaid" }
        })

        return { success: true, payment: updated }
    } catch (error) {
        console.error("Failed to mark order as paid:", error)
        return { success: false, error: "Failed to update payment status" }
    }
}

export async function completeFreeOrder(orderId: string, couponCode?: string) {
    try {
        // 1. Create a payment record marked as completed
        const payment = await createPayment({
            order_id: orderId,
            provider: "Coupon",
            amount: 0,
            currency: "USD",
        })

        // 2. Update payment status to completed, which triggers delivery and notifications
        await updatePaymentStatus(payment.id, "completed", {
            provider: "Coupon",
            payload: { type: "free_order_via_coupon", couponCode }
        })

        // 3. Increment coupon usage if provided
        if (couponCode) {
            await incrementCouponUsage(couponCode)
        }

        return { success: true }
    } catch (error) {
        console.error("Failed to complete free order:", error)
        return { success: false, error: "Failed to complete order" }
    }
}
