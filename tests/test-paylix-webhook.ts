import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

// Config - update this with your local values or mock data
const API_URL = "http://localhost:3000/api/webhooks/paylix"
const WEBHOOK_SECRET = "your_paylix_webhook_secret_here" // Must match .env.local

async function testWebhook() {
    // 1. Create a dummy payment in DB first (or use existing one)
    // For this test, let's assume we have a payment with track_id "TEST_TRACK_ID"
    // Ideally, you'd insert one here, but I'll skip that for simplicity/safety

    const payload = {
        status: "COMPLETED",
        uniqid: "TEST_TRACK_ID_123", // Matches track_id in payments table
        paypal_order_id: "PAYPAL-ORDER-ID",
        invoice: {
            uniqid: "TEST_TRACK_ID_123",
            amount: 10,
            currency: "USD"
        }
    }

    const body = JSON.stringify(payload)
    const signature = crypto
        .createHmac("sha512", WEBHOOK_SECRET)
        .update(body)
        .digest("hex")

    console.log("Sending Webhook...")
    console.log("Payload:", payload)
    console.log("Signature:", signature)

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Paylix-Signature": signature,
                "X-Paylix-Event": "payment.completed"
            },
            body: body
        })

        const text = await response.text()
        console.log("Response Status:", response.status)
        console.log("Response Body:", text)
    } catch (error) {
        console.error("Webhook Request Failed:", error)
    }
}

testWebhook()
