"use server"

/**
 * Blockchain Tracking Utility
 * Integrates multiple explorers to track transactions and confirmations in real-time.
 */

export interface TransactionStatus {
    detected: boolean
    confirmations: number
    txId?: string
    status: 'waiting' | 'detected' | 'confirmed' | 'failed'
    lastCheck: Date
    amountReceived?: number  // Amount received in crypto (e.g., 0.001 BTC)
}

/**
 * Track BTC address via Mempool.space and BlockCypher
 */
async function trackBTC(address: string): Promise<TransactionStatus> {
    try {
        // Primary: Mempool.space
        const response = await fetch(`https://mempool.space/api/address/${address}/txs`)
        if (response.ok) {
            const txs = await response.json()
            if (txs && txs.length > 0) {
                const latestTx = txs[0]
                const confirmations = latestTx.status.confirmed ? 3 : 0

                // Calculate received amount (sum of outputs to this address)
                let amountSatoshis = 0
                for (const vout of latestTx.vout || []) {
                    if (vout.scriptpubkey_address === address) {
                        amountSatoshis += vout.value || 0
                    }
                }

                return {
                    detected: true,
                    confirmations: confirmations,
                    txId: latestTx.txid,
                    status: confirmations >= 1 ? 'confirmed' : 'detected',
                    lastCheck: new Date(),
                    amountReceived: amountSatoshis / 100000000  // Convert satoshis to BTC
                }
            }
        }

        // Secondary: BlockCypher
        const bcResponse = await fetch(`https://api.blockcypher.com/v1/btc/main/addrs/${address}`)
        if (bcResponse.ok) {
            const data = await bcResponse.json()
            if (data.unconfirmed_n_tx > 0 || data.n_tx > 0) {
                return {
                    detected: true,
                    confirmations: data.n_tx > 0 ? 1 : 0,
                    status: data.n_tx > 0 ? 'confirmed' : 'detected',
                    lastCheck: new Date(),
                    amountReceived: (data.total_received || 0) / 100000000  // satoshis to BTC
                }
            }
        }
    } catch (e) {
        console.error("BTC Tracking Error:", e)
    }

    return { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }
}

/**
 * Track ETH address via BlockCypher / Etherscan (Public)
 */
async function trackETH(address: string): Promise<TransactionStatus> {
    try {
        // BlockCypher ETH public endpoint
        const response = await fetch(`https://api.blockcypher.com/v1/eth/main/addrs/${address}/balance`)
        if (response.ok) {
            const data = await response.json()
            if (data.n_tx > 0 || data.unconfirmed_n_tx > 0) {
                return {
                    detected: true,
                    confirmations: data.n_tx > 0 ? 12 : 0, // ETH considers ~12 confirmations deep
                    status: data.n_tx > 0 ? 'confirmed' : 'detected',
                    lastCheck: new Date()
                }
            }
        }
    } catch (e) {
        console.error("ETH Tracking Error:", e)
    }
    return { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }
}

/**
 * Track SOL address via Public RPC
 */
async function trackSOL(address: string): Promise<TransactionStatus> {
    try {
        const response = await fetch('https://api.mainnet-beta.solana.com', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'getSignaturesForAddress',
                params: [address, { limit: 1 }]
            })
        })
        if (response.ok) {
            const data = await response.json()
            if (data.result && data.result.length > 0) {
                const latest = data.result[0]
                return {
                    detected: true,
                    confirmations: latest.confirmationStatus === 'finalized' ? 1 : 0,
                    txId: latest.signature,
                    status: latest.confirmationStatus === 'finalized' ? 'confirmed' : 'detected',
                    lastCheck: new Date()
                }
            }
        }
    } catch (e) {
        console.error("SOL Tracking Error:", e)
    }
    return { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }
}

/**
 * Track LTC address via BlockCypher
 */
async function trackLTC(address: string): Promise<TransactionStatus> {
    try {
        const response = await fetch(`https://api.blockcypher.com/v1/ltc/main/addrs/${address}/balance`)
        if (response.ok) {
            const data = await response.json()
            if (data.n_tx > 0 || data.unconfirmed_n_tx > 0) {
                return {
                    detected: true,
                    confirmations: data.n_tx > 0 ? 1 : 0,
                    status: data.n_tx > 0 ? 'confirmed' : 'detected',
                    lastCheck: new Date()
                }
            }
        }
    } catch (e) {
        console.error("LTC Tracking Error:", e)
    }
    return { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }
}

/**
 * Track DOGE/DASH via BlockCypher
 */
async function trackBlockCypher(address: string, coin: string): Promise<TransactionStatus> {
    try {
        const response = await fetch(`https://api.blockcypher.com/v1/${coin}/main/addrs/${address}/balance`)
        if (response.ok) {
            const data = await response.json()
            if (data.n_tx > 0 || data.unconfirmed_n_tx > 0) {
                return {
                    detected: true,
                    confirmations: data.n_tx > 0 ? 1 : 0,
                    status: data.n_tx > 0 ? 'confirmed' : 'detected',
                    lastCheck: new Date()
                }
            }
        }
    } catch (e) {
        console.error(`${coin} Tracking Error:`, e)
    }
    return { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }
}

/**
 * Track TRX (Tron) via TronGrid
 */
async function trackTRX(address: string): Promise<TransactionStatus> {
    try {
        const response = await fetch(`https://api.trongrid.io/v1/accounts/${address}`)
        if (response.ok) {
            const data = await response.json()
            if (data.success && data.data && data.data.length > 0) {
                // If account exists/has history, we consider it detected
                return {
                    detected: true,
                    confirmations: 1,
                    status: 'confirmed',
                    lastCheck: new Date()
                }
            }
        }
    } catch (e) {
        console.error("TRX Tracking Error:", e)
    }
    return { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }
}

/**
 * Track BSC (BNB/BEP20) via Public RPC
 */
async function trackBSC(address: string): Promise<TransactionStatus> {
    try {
        const response = await fetch('https://bsc-dataseed.binance.org/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'eth_getTransactionCount',
                params: [address, 'latest']
            })
        })
        if (response.ok) {
            const data = await response.json()
            if (parseInt(data.result, 16) > 0) {
                return {
                    detected: true,
                    confirmations: 1,
                    status: 'confirmed',
                    lastCheck: new Date()
                }
            }
        }
    } catch (e) {
        console.error("BSC Tracking Error:", e)
    }
    return { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }
}

/**
 * Main function to track any address based on currency
 */
export async function trackAddressStatus(address: string, currency: string): Promise<TransactionStatus> {
    const symbol = currency.toUpperCase()

    if (['BTC', 'BITCOIN'].includes(symbol)) return trackBTC(address)
    if (['ETH', 'ETHEREUM', 'USDT'].includes(symbol)) return trackETH(address)
    if (['SOL', 'SOLANA'].includes(symbol)) return trackSOL(address)
    if (['LTC', 'LITECOIN'].includes(symbol)) return trackLTC(address)
    if (['DOGE', 'DOGECOIN'].includes(symbol)) return trackBlockCypher(address, 'doge')
    if (['DASH'].includes(symbol)) return trackBlockCypher(address, 'dash')
    if (['TRX', 'TRON', 'USDT.TRC20'].includes(symbol)) return trackTRX(address)
    if (['BNB', 'BSC', 'USDT.BEP20'].includes(symbol)) return trackBSC(address)

    // Default: waiting
    return { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }
}
