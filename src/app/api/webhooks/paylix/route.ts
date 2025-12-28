import { NextRequest, NextResponse } from "next/server"
import { verifyPaylixSignature } from "@/lib/payments/paylix"
import { updatePaymentStatus } from "@/lib/db/payments"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
    try {
        const body = await req.text()
        const signature = req.headers.get("X-Paylix-Signature")

        if (!signature) {
            return NextResponse.json({ error: "Missing signature" }, { status: 400 })
        }

        const isValid = await verifyPaylixSignature(body, signature)
        if (!isValid) {
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
        }

        const payload = JSON.parse(body)
        const eventType = req.headers.get("X-Paylix-Event")

        console.log(`[Paylix Webhook] Event: ${eventType}`, payload)

        // Paylix sends different events, we care about invoice completions
        const status = payload.status
        const uniqid = payload.uniqid // Paylix's invoice ID

        if (status === "COMPLETED") {
            const supabase = await createAdminClient()

            // Find our payment record using Paylix's uniqid
            const { data: payment, error } = await supabase
                .from("payments")
                .select("id, order_id, status")
                .eq("track_id", uniqid)
                .single()

            if (error || !payment) {
                console.error(`[Paylix Webhook] Payment not found for track_id: ${uniqid}`)
                return NextResponse.json({ error: "Payment not found" }, { status: 404 })
            }

            // Check if already completed
            if (payment.status === 'completed') {
                console.log(`[Paylix Webhook] Payment ${payment.id} already completed, skipping duplicate.`)
                return NextResponse.json({ success: true })
            }

            // Update payment status to completed
            // This triggers order status update and delivery logic in updatePaymentStatus
            await updatePaymentStatus(payment.id, "completed", {
                provider: "PayPal",
                providerPaymentId: payload.paypal_order_id || uniqid,
                payload: payload
            })

            console.log(`[Paylix Webhook] Success: Payment ${payment.id} for Order ${payment.order_id} marked as completed`)
        } else if (status === "FAILED" || status === "CANCELED") {
            const supabase = await createAdminClient()
            const { data: payment } = await supabase
                .from("payments")
                .select("id, status")
                .eq("track_id", uniqid)
                .single()

            if (payment && payment.status !== 'completed') {
                await updatePaymentStatus(payment.id, "failed", {
                    trackId: uniqid,
                    payload: payload
                })
                console.log(`[Paylix Webhook] Payment ${payment.id} failed/canceled.`)
            }
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[Paylix Webhook] Error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
