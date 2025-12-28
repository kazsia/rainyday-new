import { NextRequest, NextResponse } from "next/server"
import { verifyOxaPaySignature } from "@/lib/payments/oxapay"
import { updatePaymentStatus } from "@/lib/db/payments"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
    try {
        const bodyText = await req.text()
        const signature = req.headers.get("HMAC")

        if (!signature || !(await verifyOxaPaySignature(bodyText, signature))) {
            console.error("Invalid OxaPay signature")
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const data = JSON.parse(bodyText)
        // OxaPay V1 uses track_id, but some legacy calls might use trackId. Support both.
        const trackId = data.track_id || data.trackId
        const { order_id, status, type } = data

        // Idempotency: Ignore if we have already processed this exact event
        // OxaPay doesn't send a unique event ID, so we hash trackId + status
        // OR we just rely on the existing payment status check in updatePaymentStatus (which returns alreadyProcessed)

        console.log(`[OxaPay Webhook] Received ${status} for Order ${order_id} (Track: ${trackId})`)

        // OxaPay statuses: paying, confirming, paid, failed, expired, canceled
        // Official V1 can be "Paid", "paid", "manual_accept"
        const normalizedStatus = status.toLowerCase()

        if (normalizedStatus === "paid" || normalizedStatus === "manual_accept" || normalizedStatus === "confirming") {
            const supabase = await createAdminClient()

            // Find our internal payment record using trackId (canonical)
            const { data: payment } = await supabase
                .from("payments")
                .select("id, status, amount")
                .eq("track_id", trackId)
                .single()

            if (payment) {
                // Validate Amount: strict check
                // OxaPay 'amount' in webhook is usually the requested amount (fiat)
                if (data.amount && payment.amount) {
                    const received = parseFloat(data.amount)
                    const expected = parseFloat(payment.amount)
                    // Allow $0.50 tolerance for fiat fluctuations if needed, usually it matches exactly
                    if (!isNaN(received) && !isNaN(expected) && Math.abs(received - expected) > 0.50) {
                        console.error(`[OxaPay Webhook] Amount mismatch! Expected ${expected}, got ${received}. Not marking as paid.`)
                        // We return 200 to stop OxaPay from retrying, but we do NOT fulfill the order.
                        // Admin needs to review.
                        return new NextResponse("ok", { status: 200 })
                    }
                }

                // Check if already completed to avoid redundant processing
                if (payment.status === 'completed') {
                    console.log(`[OxaPay Webhook] Payment ${payment.id} already completed, skipping.`)
                    return new NextResponse("ok", { status: 200 })
                }

                // Extract TXID from txs array if available
                const txID = (data.txs && data.txs.length > 0) ? data.txs[0].tx_hash : undefined

                // Prepare payload with extracted txID for updatePaymentStatus
                const payloadWithTxID = {
                    ...data,
                    txID: txID // Inject txID so updatePaymentStatus sees it
                }

                await updatePaymentStatus(payment.id, "completed", {
                    trackId,
                    payload: payloadWithTxID,
                    provider: data.payCurrency || "Crypto"
                })
                console.log(`[OxaPay Webhook] Marked payment ${payment.id} as completed.`)
            } else {
                console.error(`[OxaPay Webhook] Payment not found for trackId ${trackId}`)
            }
        } else if (status === "failed" || status === "expired" || status === "canceled") {
            const supabase = await createAdminClient()
            const { data: payment } = await supabase
                .from("payments")
                .select("id, status")
                .eq("track_id", trackId)
                .single()

            if (payment) {
                if (payment.status === 'completed') {
                    console.warn(`[OxaPay Webhook] Received ${status} for COMPLETED payment ${payment.id}, ignoring regressive update.`)
                } else {
                    await updatePaymentStatus(payment.id, "failed", {
                        trackId,
                        payload: data
                    })
                    console.log(`[OxaPay Webhook] Marked payment ${payment.id} as failed/expired.`)
                }
            }
        }

        // Must return "ok" as per OxaPay docs
        return new NextResponse("ok", { status: 200 })
    } catch (error) {
        console.error("OxaPay Webhook Error:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
