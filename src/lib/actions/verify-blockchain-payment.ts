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
    expectedAmount: number
) {
    try {
        // 1. Check blockchain status
        const status = await trackAddressStatus(address, currency)

        if (!status.detected) {
            return { success: false, status: 'waiting', message: 'No payment detected yet' }
        }

        // 2. If detected but not confirmed, return detected status
        if (status.status === 'detected') {
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
            if (status.amountReceived >= expectedAmount - tolerance) {
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
                return {
                    success: false,
                    status: 'underpaid',
                    message: `Received ${status.amountReceived} but expected ${expectedAmount}`,
                    amountReceived: status.amountReceived
                }
            }
        }

        // 4. Confirmed but no amount info - trust OxaPay for final verification
        if (status.status === 'confirmed') {
            return {
                success: true,
                status: 'confirmed_pending',
                message: 'Blockchain confirmed, awaiting payment gateway verification',
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
