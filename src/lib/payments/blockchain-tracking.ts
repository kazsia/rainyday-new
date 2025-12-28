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
    timestamp?: number // Unix timestamp (seconds) of the latest relevant transaction
}

/**
 * Track BTC address via Mempool.space and BlockCypher
 */
async function trackBTC(address: string, minTimestamp?: number): Promise<TransactionStatus> {
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

                const txTimestamp = latestTx.status.block_time
                if (minTimestamp && txTimestamp < minTimestamp) {
                    return { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }
                }

                return {
                    detected: true,
                    confirmations: confirmations,
                    txId: latestTx.txid,
                    status: confirmations >= 1 ? 'confirmed' : 'detected',
                    lastCheck: new Date(),
                    amountReceived: amountSatoshis / 100000000,
                    timestamp: txTimestamp
                }
            }
        }

        // Secondary: BlockCypher - with proper timestamp filtering
        const bcResponse = await fetch(`https://api.blockcypher.com/v1/btc/main/addrs/${address}/full?limit=5`)
        if (bcResponse.ok) {
            const data = await bcResponse.json()
            const bcTxs = data.txs || []

            for (const tx of bcTxs) {
                const txTime = tx.received ? new Date(tx.received).getTime() / 1000 : 0

                // Skip transactions older than our order
                if (minTimestamp && txTime < minTimestamp) {
                    continue
                }

                const confirmations = tx.confirmations || 0
                let amountReceived = 0
                for (const output of tx.outputs || []) {
                    if (output.addresses?.includes(address)) {
                        amountReceived += (output.value || 0) / 100000000
                    }
                }

                return {
                    detected: true,
                    confirmations: confirmations,
                    txId: tx.hash,
                    status: confirmations >= 1 ? 'confirmed' : 'detected',
                    lastCheck: new Date(),
                    amountReceived,
                    timestamp: txTime
                }
            }
        }
    } catch (e) {
        console.error("BTC Tracking Error:", e)
    }

    return { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }
}

/**
 * Track ETH address via BlockCypher - with proper timestamp filtering
 */
async function trackETH(address: string, minTimestamp?: number): Promise<TransactionStatus> {
    try {
        // Use full address endpoint to get transaction list with timestamps
        const response = await fetch(`https://api.blockcypher.com/v1/eth/main/addrs/${address}/full?limit=5`)
        if (response.ok) {
            const data = await response.json()
            const txs = data.txs || []

            if (txs.length === 0 && (data.unconfirmed_n_tx || 0) === 0) {
                return { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }
            }

            // Find the most recent transaction that matches our time filter
            for (const tx of txs) {
                const txTime = tx.received ? new Date(tx.received).getTime() / 1000 : 0

                // Skip transactions that are older than our order
                if (minTimestamp && txTime < minTimestamp) {
                    continue
                }

                const confirmations = tx.confirmations || 0

                return {
                    detected: true,
                    confirmations: confirmations,
                    txId: tx.hash,
                    status: confirmations >= 12 ? 'confirmed' : 'detected',
                    lastCheck: new Date(),
                    timestamp: txTime
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
async function trackSOL(address: string, minTimestamp?: number): Promise<TransactionStatus> {
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
                const txTimestamp = latest.blockTime || 0

                if (minTimestamp && txTimestamp < minTimestamp) {
                    return { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }
                }

                return {
                    detected: true,
                    confirmations: latest.confirmationStatus === 'finalized' ? 1 : 0,
                    txId: latest.signature,
                    status: latest.confirmationStatus === 'finalized' ? 'confirmed' : 'detected',
                    lastCheck: new Date(),
                    timestamp: txTimestamp
                }
            }
        }
    } catch (e) {
        console.error("SOL Tracking Error:", e)
    }
    return { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }
}

/**
 * Track LTC address via BlockCypher - with proper timestamp filtering
 */
async function trackLTC(address: string, minTimestamp?: number): Promise<TransactionStatus> {
    try {
        // Use full address endpoint to get transaction list with timestamps
        const response = await fetch(`https://api.blockcypher.com/v1/ltc/main/addrs/${address}/full?limit=5`)
        if (response.ok) {
            const data = await response.json()

            // Check for transactions (confirmed or unconfirmed)
            const txs = data.txs || []

            if (txs.length === 0 && data.unconfirmed_n_tx === 0) {
                return { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }
            }

            // Find the most recent transaction that matches our time filter
            for (const tx of txs) {
                // BlockCypher provides 'received' time in ISO format
                const txTime = tx.received ? new Date(tx.received).getTime() / 1000 : 0

                // Skip transactions that are older than our order
                if (minTimestamp && txTime < minTimestamp) {
                    continue
                }

                // Found a valid transaction after our order was created
                const confirmations = tx.confirmations || 0

                // Calculate received amount (sum of outputs to this address)
                let amountReceived = 0
                for (const output of tx.outputs || []) {
                    if (output.addresses?.includes(address)) {
                        amountReceived += (output.value || 0) / 100000000 // satoshis to LTC
                    }
                }

                return {
                    detected: true,
                    confirmations: confirmations,
                    txId: tx.hash,
                    status: confirmations >= 1 ? 'confirmed' : 'detected',
                    lastCheck: new Date(),
                    amountReceived,
                    timestamp: txTime
                }
            }

            // Check for unconfirmed transactions (mempool)
            if (data.unconfirmed_n_tx > 0 && data.unconfirmed_txrefs) {
                for (const txref of data.unconfirmed_txrefs) {
                    const txTime = txref.received ? new Date(txref.received).getTime() / 1000 : Date.now() / 1000

                    // Skip if older than our order
                    if (minTimestamp && txTime < minTimestamp) {
                        continue
                    }

                    return {
                        detected: true,
                        confirmations: 0,
                        txId: txref.tx_hash,
                        status: 'detected',
                        lastCheck: new Date(),
                        amountReceived: (txref.value || 0) / 100000000,
                        timestamp: txTime
                    }
                }
            }
        }
    } catch (e) {
        console.error("LTC Tracking Error:", e)
    }
    return { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }
}

/**
 * Track DOGE/DASH via BlockCypher - with proper timestamp filtering
 */
async function trackBlockCypher(address: string, coin: string, minTimestamp?: number): Promise<TransactionStatus> {
    try {
        // Use full address endpoint to get transaction list with timestamps
        const response = await fetch(`https://api.blockcypher.com/v1/${coin}/main/addrs/${address}/full?limit=5`)
        if (response.ok) {
            const data = await response.json()
            const txs = data.txs || []

            if (txs.length === 0 && (data.unconfirmed_n_tx || 0) === 0) {
                return { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }
            }

            // Find the most recent transaction that matches our time filter
            for (const tx of txs) {
                const txTime = tx.received ? new Date(tx.received).getTime() / 1000 : 0

                // Skip transactions that are older than our order
                if (minTimestamp && txTime < minTimestamp) {
                    continue
                }

                const confirmations = tx.confirmations || 0

                return {
                    detected: true,
                    confirmations: confirmations,
                    txId: tx.hash,
                    status: confirmations >= 1 ? 'confirmed' : 'detected',
                    lastCheck: new Date(),
                    timestamp: txTime
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
async function trackTRX(address: string, minTimestamp?: number): Promise<TransactionStatus> {
    try {
        const response = await fetch(`https://api.trongrid.io/v1/accounts/${address}/transactions?only_confirmed=false&limit=1`)
        if (response.ok) {
            const data = await response.json()
            if (data.success && data.data && data.data.length > 0) {
                const latest = data.data[0]
                const txTimestamp = latest.block_timestamp / 1000 // TronGrid uses ms

                if (minTimestamp && txTimestamp < minTimestamp) {
                    return { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }
                }

                return {
                    detected: true,
                    confirmations: 1,
                    status: 'confirmed',
                    txId: latest.txID,
                    lastCheck: new Date(),
                    timestamp: txTimestamp
                }
            }
        }
    } catch (e) {
        console.error("TRX Tracking Error:", e)
    }
    return { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }
}

/**
 * Track BSC (BNB/BEP20) via BscScan API - with proper timestamp filtering
 * Note: BSC public RPC doesn't provide transaction history easily,
 * so we use the BscScan public API for better accuracy.
 */
async function trackBSC(address: string, minTimestamp?: number): Promise<TransactionStatus> {
    try {
        // Use BscScan public API (no API key needed for basic queries, but rate limited)
        const response = await fetch(
            `https://api.bscscan.com/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=5&sort=desc`
        )
        if (response.ok) {
            const data = await response.json()
            if (data.status === '1' && data.result && data.result.length > 0) {
                // Find a transaction after our order creation time
                for (const tx of data.result) {
                    const txTime = parseInt(tx.timeStamp) || 0

                    // Skip transactions older than our order
                    if (minTimestamp && txTime < minTimestamp) {
                        continue
                    }

                    const confirmations = parseInt(tx.confirmations) || 0

                    return {
                        detected: true,
                        confirmations: confirmations,
                        txId: tx.hash,
                        status: confirmations >= 12 ? 'confirmed' : 'detected',
                        lastCheck: new Date(),
                        timestamp: txTime
                    }
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
export async function trackAddressStatus(address: string, currency: string, minTimestamp?: number): Promise<TransactionStatus> {
    const symbol = currency.toUpperCase()

    if (['BTC', 'BITCOIN'].includes(symbol)) return trackBTC(address, minTimestamp)
    if (['ETH', 'ETHEREUM', 'USDT'].includes(symbol)) return trackETH(address, minTimestamp)
    if (['SOL', 'SOLANA'].includes(symbol)) return trackSOL(address, minTimestamp)
    if (['LTC', 'LITECOIN'].includes(symbol)) return trackLTC(address, minTimestamp)
    if (['DOGE', 'DOGECOIN'].includes(symbol)) return trackBlockCypher(address, 'doge', minTimestamp)
    if (['DASH'].includes(symbol)) return trackBlockCypher(address, 'dash', minTimestamp)
    if (['TRX', 'TRON', 'USDT.TRC20'].includes(symbol)) return trackTRX(address, minTimestamp)
    if (['BNB', 'BSC', 'USDT.BEP20'].includes(symbol)) return trackBSC(address, minTimestamp)

    // Default: waiting
    return { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }
}
