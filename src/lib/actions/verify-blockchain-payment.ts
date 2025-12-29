"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { trackAddressStatus } from "@/lib/payments/blockchain-tracking"
import { updatePaymentStatus } from "@/lib/db/payments"

/**
 * Verify a payment on the blockchain and update the database if confirmed
 * This is called as a fallback when blockchain confirms but OxaPay webhook hasn't arrived
 */
export async function verifyBlockchainPayment(
    paymentId: string,
    address: string,
    currency: string,
    expectedAmount: number,
    minTimestamp?: number
) {
    try {
        // 1. Check blockchain status
        const status = await trackAddressStatus(address, currency, minTimestamp)

        if (!status.detected) {
            return { success: false, status: 'waiting', message: 'No payment detected yet' }
        }

        // 2. If detected but not confirmed (0 confirmations), update DB to 'processing' for instant feedback
        if (status.status === 'detected') {
            // Update status to 'processing' so user sees "Payment Detected" immediately on other devices/reloads
            await updatePaymentStatus(paymentId, 'processing', {
                payload: {
                    blockchain_detected: true,
                    tx_id: status.txId,
                    amount_received: status.amountReceived,
                    confirmations: status.confirmations
                }
            })

            return {
                success: true,
                status: 'detected',
                message: 'Payment detected, waiting for confirmations',
                txId: status.txId,
                confirmations: status.confirmations
            }
        }

        // 3. If confirmed, verify amount (with 5% tolerance for network fees)
        if (status.status === 'confirmed' && status.amountReceived) {
            const tolerance = expectedAmount * 0.05
            console.log(`[VerifyPayment] Confirmed. Received: ${status.amountReceived}, Expected: ${expectedAmount}, Tolerance: ${tolerance}`)

            if (status.amountReceived >= expectedAmount - tolerance) {
                console.log("[VerifyPayment] Amount matches. Completing order...")
                // Amount matches - update payment status in database
                await updatePaymentStatus(paymentId, 'completed', {
                    providerPaymentId: status.txId,
                    payload: {
                        blockchain_confirmed: true,
                        tx_id: status.txId,
                        amount_received: status.amountReceived,
                        confirmations: status.confirmations
                    }
                })

                return {
                    success: true,
                    status: 'confirmed',
                    message: 'Payment confirmed on blockchain',
                    txId: status.txId
                }
            } else {
                console.warn(`[VerifyPayment] Amount mismatch! Received: ${status.amountReceived}, Expected: ${expectedAmount}`)
                return {
                    success: false,
                    status: 'underpaid',
                    message: `Received ${status.amountReceived} but expected ${expectedAmount}`,
                    amountReceived: status.amountReceived
                }
            }
        }

        // 4. Confirmed but no amount info from blockchain API - trust confirmations and complete anyway
        if (status.status === 'confirmed') {
            console.log("[VerifyPayment] Confirmed without amountReceived. Completing order based on confirmations...")

            // Complete the order - trust confirmation count >= 2 (already checked by blockchain-tracking)
            await updatePaymentStatus(paymentId, 'completed', {
                providerPaymentId: status.txId,
                payload: {
                    blockchain_confirmed: true,
                    tx_id: status.txId,
                    confirmations: status.confirmations,
                    verified_by: 'blockchain_confirmations_only'
                }
            })

            return {
                success: true,
                status: 'confirmed',
                message: 'Blockchain confirmed, order completed',
                txId: status.txId
            }
        }

        return { success: false, status: status.status, message: 'Unknown status' }
    } catch (error) {
        console.error("Blockchain verification error:", error)
        return { success: false, status: 'error', message: 'Failed to verify payment' }
    }
}

/**
 * Get the crypto address for a payment (for re-tracking)
 */
export async function getPaymentCryptoAddress(paymentId: string) {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
        .from('payments')
        .select('crypto_address, track_id')
        .eq('id', paymentId)
        .single()

    if (error) throw error
    return data
}
