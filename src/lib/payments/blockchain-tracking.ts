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
 * Track BTC address via multiple providers in parallel for instant detection
 * Providers: Mempool.space, SoChain, Blockchain.info, BlockCypher
 */
async function trackBTC(address: string, minTimestamp?: number): Promise<TransactionStatus> {
    const fetchers = [
        // 1. Mempool.space (Fastest, best for mempool)
        async (): Promise<TransactionStatus> => {
            const response = await fetch(`https://mempool.space/api/address/${address}/txs`, { signal: AbortSignal.timeout(3000) })
            if (!response.ok) throw new Error("Mempool failed")
            const txs = await response.json()
            if (!txs || txs.length === 0) return { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }

            const latestTx = txs[0]
            const txTimestamp = latestTx.status.block_time || Date.now() / 1000
            if (minTimestamp && latestTx.status.confirmed && txTimestamp < minTimestamp) return { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }

            const confirmations = latestTx.status.confirmed ? 3 : 0
            let amountSatoshis = 0
            for (const vout of latestTx.vout || []) {
                if (vout.scriptpubkey_address === address) amountSatoshis += vout.value || 0
            }
            return {
                detected: true,
                confirmations,
                txId: latestTx.txid,
                status: confirmations >= 2 ? 'confirmed' : 'detected',
                lastCheck: new Date(),
                amountReceived: amountSatoshis / 100000000,
                timestamp: txTimestamp
            }
        },
        // 2. SoChain (Chain.so)
        async (): Promise<TransactionStatus> => {
            const response = await fetch(`https://chain.so/api/v2/get_tx_received/BTC/${address}`, { signal: AbortSignal.timeout(3000) })
            if (!response.ok) throw new Error("SoChain failed")
            const data = await response.json()
            const txs = data.data.txs || []
            for (const tx of txs) {
                const txTime = parseInt(tx.time)
                if (minTimestamp && txTime < minTimestamp) continue
                const confirmations = parseInt(tx.confirmations) || 0
                return {
                    detected: true,
                    confirmations,
                    txId: tx.txid,
                    status: confirmations >= 2 ? 'confirmed' : 'detected',
                    lastCheck: new Date(),
                    amountReceived: parseFloat(tx.value),
                    timestamp: txTime
                }
            }
            return { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }
        },
        // 3. Blockchain.info
        async (): Promise<TransactionStatus> => {
            const response = await fetch(`https://blockchain.info/rawaddr/${address}?limit=5`, { signal: AbortSignal.timeout(3000) })
            if (!response.ok) throw new Error("Blockchain.info failed")
            const data = await response.json()
            const txs = data.txs || []
            for (const tx of txs) {
                const txTime = tx.time
                if (minTimestamp && txTime < minTimestamp) continue
                let amountSatoshis = 0
                for (const out of tx.out || []) { if (out.addr === address) amountSatoshis += out.value }
                const isConfirmed = !!tx.block_height
                return {
                    detected: true,
                    confirmations: isConfirmed ? 3 : 0,
                    txId: tx.hash,
                    status: isConfirmed ? 'confirmed' : 'detected',
                    lastCheck: new Date(),
                    amountReceived: amountSatoshis / 100000000,
                    timestamp: txTime
                }
            }
            return { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }
        },
        // 4. BlockCypher
        async (): Promise<TransactionStatus> => {
            const response = await fetch(`https://api.blockcypher.com/v1/btc/main/addrs/${address}/full?limit=5`, { signal: AbortSignal.timeout(4000) })
            if (!response.ok) throw new Error("BlockCypher failed")
            const data = await response.json()
            const bcTxs = data.txs || []
            for (const tx of bcTxs) {
                const txTime = tx.received ? new Date(tx.received).getTime() / 1000 : 0
                if (minTimestamp && txTime < minTimestamp) continue
                const confirmations = tx.confirmations || 0
                let amountReceived = 0
                for (const output of tx.outputs || []) {
                    if (output.addresses?.includes(address)) amountReceived += (output.value || 0) / 100000000
                }
                return {
                    detected: true,
                    confirmations,
                    txId: tx.hash,
                    status: confirmations >= 2 ? 'confirmed' : 'detected',
                    lastCheck: new Date(),
                    amountReceived,
                    timestamp: txTime
                }
            }
            return { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }
        }
    ]

    const results = await Promise.allSettled(fetchers.map(f => f()))

    // Pick the "best" result - prioritizing detected and then highest confirmation count
    let bestResult: TransactionStatus = { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }

    for (const res of results) {
        if (res.status === 'fulfilled' && res.value.detected) {
            if (!bestResult.detected || res.value.confirmations > bestResult.confirmations) {
                bestResult = res.value
            }
        }
    }

    return bestResult
}

/**
 * Track ETH address via BlockCypher - with proper timestamp filtering
 */
async function trackETH(address: string, minTimestamp?: number): Promise<TransactionStatus> {
    try {
        // Use full address endpoint to get transaction list with timestamps
        const response = await fetch(`https://api.blockcypher.com/v1/eth/main/addrs/${address}/full?limit=5`, { signal: AbortSignal.timeout(4000) })
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
                    status: confirmations >= 2 ? 'confirmed' : 'detected',
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
            }),
            signal: AbortSignal.timeout(4000)
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
                    confirmations: latest.confirmationStatus === 'finalized' ? 2 : (latest.confirmationStatus === 'confirmed' ? 1 : 0),
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
 * Track LTC address via multiple providers in parallel for instant detection
 * Providers: Blockchair, SoChain, BlockCypher
 */
async function trackLTC(address: string, minTimestamp?: number): Promise<TransactionStatus> {
    const fetchers = [
        // 1. SoChain (Chain.so) - Fastest and simplest
        async (): Promise<TransactionStatus> => {
            const response = await fetch(`https://chain.so/api/v2/get_tx_received/LTC/${address}`, { signal: AbortSignal.timeout(4000) })
            if (!response.ok) throw new Error("SoChain failed")
            const data = await response.json()
            const txs = data.data.txs || []

            for (const tx of txs) {
                const txTime = parseInt(tx.time)
                if (minTimestamp && txTime < minTimestamp) continue
                const confirmations = parseInt(tx.confirmations) || 0
                return {
                    detected: true,
                    confirmations: confirmations,
                    txId: tx.txid,
                    status: confirmations >= 1 ? 'confirmed' : 'detected',
                    lastCheck: new Date(),
                    amountReceived: parseFloat(tx.value),
                    timestamp: txTime
                }
            }
            return { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }
        },
        // 2. Blockchair - NOTE: Blockchair dashboard endpoint doesn't provide full tx details with timestamps
        // We cannot reliably filter by minTimestamp here, so this provider should NOT be trusted for detection
        // It's only useful as a backup when other providers fail and we need ANY signal
        // DISABLED: This was causing false positives by detecting old transactions
        async (): Promise<TransactionStatus> => {
            // Return waiting - let other providers handle detection
            // Blockchair's dashboard endpoint doesn't give us tx timestamps to filter properly
            return { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }
        },
        // 3. BlockCypher
        async (): Promise<TransactionStatus> => {
            const response = await fetch(`https://api.blockcypher.com/v1/ltc/main/addrs/${address}/full?limit=5`, { signal: AbortSignal.timeout(4000) })
            if (!response.ok) throw new Error("BlockCypher failed")
            const data = await response.json()
            const txs = data.txs || []

            for (const tx of txs) {
                const txTime = tx.received ? new Date(tx.received).getTime() / 1000 : 0
                if (minTimestamp && txTime < minTimestamp) continue

                const confirmations = tx.confirmations || 0
                let amountReceived = 0
                for (const output of tx.outputs || []) {
                    if (output.addresses?.includes(address)) amountReceived += (output.value || 0) / 100000000
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

            if (data.unconfirmed_n_tx > 0 && data.unconfirmed_txrefs) {
                const txref = data.unconfirmed_txrefs[0]
                const txTime = txref.received ? new Date(txref.received).getTime() / 1000 : Date.now() / 1000
                if (!minTimestamp || txTime >= minTimestamp) {
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
            return { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }
        }
    ]

    const results = await Promise.allSettled(fetchers.map(f => f()))
    let bestResult: TransactionStatus = { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }

    for (const res of results) {
        if (res.status === 'fulfilled' && res.value.detected) {
            if (!bestResult.detected || res.value.confirmations > bestResult.confirmations) {
                bestResult = res.value
            }
        }
    }

    return bestResult
}

/**
 * Track DOGE/DASH via BlockCypher - with proper timestamp filtering
 */
async function trackBlockCypher(address: string, coin: string, minTimestamp?: number): Promise<TransactionStatus> {
    try {
        // Use full address endpoint to get transaction list with timestamps
        const response = await fetch(`https://api.blockcypher.com/v1/${coin}/main/addrs/${address}/full?limit=5`, { signal: AbortSignal.timeout(4000) })
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
        const response = await fetch(`https://api.trongrid.io/v1/accounts/${address}/transactions?only_confirmed=false&limit=1`, { signal: AbortSignal.timeout(4000) })
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
                    status: 'confirmed', // TRX finalized is instant/1
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
            `https://api.bscscan.com/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=5&sort=desc`,
            { signal: AbortSignal.timeout(4000) }
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
                        status: confirmations >= 2 ? 'confirmed' : 'detected',
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
