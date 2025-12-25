"use server"

import { createPayment, updatePaymentStatus } from "@/lib/db/payments"
import { incrementCouponUsage } from "@/lib/actions/coupons"

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
