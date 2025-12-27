"use server"

import { createOrder, updateOrder } from "@/lib/db/orders"
import { createPayment } from "@/lib/db/payments"

export async function safeCreateOrder(params: any) {
    try {
        console.log("[SAFE_ACTION] Creating order with params:", JSON.stringify(params, null, 2))
        const order = await createOrder(params)
        return { success: true, data: order }
    } catch (error: any) {
        console.error("[SAFE_ACTION_ERROR] createOrder failed:", error)
        // Return the error message safely to the client
        return {
            success: false,
            error: error.message || "Unknown error creating order",
            details: JSON.stringify(error)
        }
    }
}

export async function safeUpdateOrder(id: string, params: any) {
    try {
        const order = await updateOrder(id, params)
        return { success: true, data: order }
    } catch (error: any) {
        console.error("[SAFE_ACTION_ERROR] updateOrder failed:", error)
        return {
            success: false,
            error: error.message || "Unknown error updating order",
            details: JSON.stringify(error)
        }
    }
}

export async function safeCreatePayment(params: any) {
    try {
        const payment = await createPayment(params)
        return { success: true, data: payment }
    } catch (error: any) {
        console.error("[SAFE_ACTION_ERROR] createPayment failed:", error)
        return {
            success: false,
            error: error.message || "Unknown error creating payment",
            details: JSON.stringify(error)
        }
    }
}
