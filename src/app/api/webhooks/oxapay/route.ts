import { NextRequest, NextResponse } from "next/server"
import { verifyOxaPaySignature } from "@/lib/payments/oxapay"
import { updatePaymentStatus } from "@/lib/db/payments"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
    try {
        const bodyText = await req.text()
        const signature = req.headers.get("HMAC")

        if (!signature || !(await verifyOxaPaySignature(bodyText, signature))) {
            console.error("Invalid OxaPay signature")
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const data = JSON.parse(bodyText)
        const { order_id, status, trackId } = data

        // OxaPay statuses: paying, confirming, paid, failed, expired, canceled
        // We only care about success for now
        if (status === "paid") {
            const supabase = await createClient()

            // Find our internal payment record for this order
            const { data: payment } = await supabase
                .from("payments")
                .select("id")
                .eq("order_id", order_id)
                .single()

            if (payment) {
                await updatePaymentStatus(payment.id, "completed", {
                    trackId,
                    payload: data,
                    provider: data.payCurrency || "Crypto"
                })
            }
        } else if (status === "failed" || status === "expired" || status === "canceled") {
            const supabase = await createClient()
            const { data: payment } = await supabase
                .from("payments")
                .select("id")
                .eq("order_id", order_id)
                .single()

            if (payment) {
                await updatePaymentStatus(payment.id, "failed", {
                    trackId,
                    payload: data
                })
            }
        }

        // Must return "ok" as per OxaPay docs
        return new NextResponse("ok", { status: 200 })
    } catch (error) {
        console.error("OxaPay Webhook Error:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
