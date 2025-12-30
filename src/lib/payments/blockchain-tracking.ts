"use server"

/**
 * Blockchain Tracking Utility - v2.0
 * Uses fast, rate-limit-free APIs for real-time transaction detection
 * Primary: Blockstream (BTC), Litecoinspace (LTC), Etherscan (ETH)
 * Fallback: SoChain for multiple coins
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
 * Track BTC address via Blockstream (mempool.space backend) - FAST & NO RATE LIMITS
 */
async function trackBTC(address: string, minTimestamp?: number): Promise<TransactionStatus> {
    const providers = [
        // 1. Mempool.space - Fastest, best for mempool detection
        async (): Promise<TransactionStatus> => {
            const response = await fetch(`https://mempool.space/api/address/${address}/txs`, {
                signal: AbortSignal.timeout(3000),
                headers: { 'Accept': 'application/json' }
            })
            if (!response.ok) throw new Error("Mempool.space failed")
            const txs = await response.json()
            if (!txs || txs.length === 0) return { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }

            // Check each transaction
            for (const tx of txs) {
                const txTimestamp = tx.status?.block_time || (Date.now() / 1000)
                if (minTimestamp && tx.status?.confirmed && txTimestamp < minTimestamp) continue

                let amountSatoshis = 0
                for (const vout of tx.vout || []) {
                    if (vout.scriptpubkey_address === address) amountSatoshis += vout.value || 0
                }

                const confirmations = tx.status?.confirmed ? (tx.status?.block_height ? 3 : 1) : 0
                return {
                    detected: true,
                    confirmations,
                    txId: tx.txid,
                    status: confirmations >= 2 ? 'confirmed' : 'detected',
                    lastCheck: new Date(),
                    amountReceived: amountSatoshis / 100000000,
                    timestamp: txTimestamp
                }
            }
            return { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }
        },
        // 2. Blockstream.info (backup)
        async (): Promise<TransactionStatus> => {
            const response = await fetch(`https://blockstream.info/api/address/${address}/txs`, {
                signal: AbortSignal.timeout(3000),
                headers: { 'Accept': 'application/json' }
            })
            if (!response.ok) throw new Error("Blockstream failed")
            const txs = await response.json()
            if (!txs || txs.length === 0) return { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }

            for (const tx of txs) {
                const txTimestamp = tx.status?.block_time || (Date.now() / 1000)
                if (minTimestamp && tx.status?.confirmed && txTimestamp < minTimestamp) continue

                let amountSatoshis = 0
                for (const vout of tx.vout || []) {
                    if (vout.scriptpubkey_address === address) amountSatoshis += vout.value || 0
                }

                const confirmations = tx.status?.confirmed ? 3 : 0
                return {
                    detected: true,
                    confirmations,
                    txId: tx.txid,
                    status: confirmations >= 2 ? 'confirmed' : 'detected',
                    lastCheck: new Date(),
                    amountReceived: amountSatoshis / 100000000,
                    timestamp: txTimestamp
                }
            }
            return { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }
        }
    ]

    const results = await Promise.allSettled(providers.map(f => f()))
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
 * Track LTC address via Litecoinspace (mempool.space for LTC) - FAST & NO RATE LIMITS
 */
async function trackLTC(address: string, minTimestamp?: number): Promise<TransactionStatus> {
    const providers = [
        // 1. Litecoinspace.org - mempool.space equivalent for Litecoin
        async (): Promise<TransactionStatus> => {
            const response = await fetch(`https://litecoinspace.org/api/address/${address}/txs`, {
                signal: AbortSignal.timeout(4000),
                headers: { 'Accept': 'application/json' }
            })
            if (!response.ok) throw new Error("Litecoinspace failed")
            const txs = await response.json()
            if (!txs || txs.length === 0) return { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }

            for (const tx of txs) {
                const txTimestamp = tx.status?.block_time || (Date.now() / 1000)
                // Skip old transactions
                if (minTimestamp && tx.status?.confirmed && txTimestamp < minTimestamp) continue

                let amountLitoshis = 0
                for (const vout of tx.vout || []) {
                    if (vout.scriptpubkey_address === address) amountLitoshis += vout.value || 0
                }

                const confirmations = tx.status?.confirmed ? (tx.status?.block_height ? 2 : 1) : 0
                return {
                    detected: true,
                    confirmations,
                    txId: tx.txid,
                    status: confirmations >= 1 ? 'confirmed' : 'detected',
                    lastCheck: new Date(),
                    amountReceived: amountLitoshis / 100000000,
                    timestamp: txTimestamp
                }
            }
            return { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }
        },
        // 2. SoChain (Chain.so) - Reliable backup
        async (): Promise<TransactionStatus> => {
            const response = await fetch(`https://chain.so/api/v2/get_tx_received/LTC/${address}`, {
                signal: AbortSignal.timeout(4000)
            })
            if (!response.ok) throw new Error("SoChain failed")
            const data = await response.json()
            const txs = data.data?.txs || []

            for (const tx of txs) {
                const txTime = parseInt(tx.time)
                if (minTimestamp && txTime < minTimestamp) continue
                const confirmations = parseInt(tx.confirmations) || 0
                return {
                    detected: true,
                    confirmations,
                    txId: tx.txid,
                    status: confirmations >= 1 ? 'confirmed' : 'detected',
                    lastCheck: new Date(),
                    amountReceived: parseFloat(tx.value),
                    timestamp: txTime
                }
            }
            return { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }
        }
    ]

    const results = await Promise.allSettled(providers.map(f => f()))
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
 * Track ETH address - Uses public Etherscan-compatible API
 */
async function trackETH(address: string, minTimestamp?: number): Promise<TransactionStatus> {
    try {
        // Use Etherscan public API (no key needed for basic queries)
        const response = await fetch(
            `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=5&sort=desc`,
            { signal: AbortSignal.timeout(4000) }
        )
        if (!response.ok) throw new Error("Etherscan failed")

        const data = await response.json()
        if (data.status !== '1' || !data.result?.length) {
            return { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }
        }

        for (const tx of data.result) {
            const txTime = parseInt(tx.timeStamp) || 0
            if (minTimestamp && txTime < minTimestamp) continue

            const confirmations = parseInt(tx.confirmations) || 0
            return {
                detected: true,
                confirmations,
                txId: tx.hash,
                status: confirmations >= 2 ? 'confirmed' : 'detected',
                lastCheck: new Date(),
                timestamp: txTime
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
 * Track DOGE via SoChain (most reliable for DOGE)
 */
async function trackDOGE(address: string, minTimestamp?: number): Promise<TransactionStatus> {
    try {
        const response = await fetch(`https://chain.so/api/v2/get_tx_received/DOGE/${address}`, {
            signal: AbortSignal.timeout(4000)
        })
        if (!response.ok) throw new Error("SoChain DOGE failed")

        const data = await response.json()
        const txs = data.data?.txs || []

        for (const tx of txs) {
            const txTime = parseInt(tx.time)
            if (minTimestamp && txTime < minTimestamp) continue

            const confirmations = parseInt(tx.confirmations) || 0
            return {
                detected: true,
                confirmations,
                txId: tx.txid,
                status: confirmations >= 1 ? 'confirmed' : 'detected',
                lastCheck: new Date(),
                amountReceived: parseFloat(tx.value),
                timestamp: txTime
            }
        }
    } catch (e) {
        console.error("DOGE Tracking Error:", e)
    }
    return { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }
}

/**
 * Track TRX (Tron) via TronGrid
 */
async function trackTRX(address: string, minTimestamp?: number): Promise<TransactionStatus> {
    try {
        const response = await fetch(`https://api.trongrid.io/v1/accounts/${address}/transactions?only_confirmed=false&limit=1`, {
            signal: AbortSignal.timeout(4000)
        })
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
 * Track BSC (BNB/BEP20) via BscScan API
 */
async function trackBSC(address: string, minTimestamp?: number): Promise<TransactionStatus> {
    try {
        const response = await fetch(
            `https://api.bscscan.com/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=5&sort=desc`,
            { signal: AbortSignal.timeout(4000) }
        )
        if (response.ok) {
            const data = await response.json()
            if (data.status === '1' && data.result && data.result.length > 0) {
                for (const tx of data.result) {
                    const txTime = parseInt(tx.timeStamp) || 0
                    if (minTimestamp && txTime < minTimestamp) continue

                    const confirmations = parseInt(tx.confirmations) || 0
                    return {
                        detected: true,
                        confirmations,
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
    if (['LTC', 'LITECOIN'].includes(symbol)) return trackLTC(address, minTimestamp)
    if (['ETH', 'ETHEREUM', 'USDT'].includes(symbol)) return trackETH(address, minTimestamp)
    if (['SOL', 'SOLANA'].includes(symbol)) return trackSOL(address, minTimestamp)
    if (['DOGE', 'DOGECOIN'].includes(symbol)) return trackDOGE(address, minTimestamp)
    if (['TRX', 'TRON', 'USDT.TRC20'].includes(symbol)) return trackTRX(address, minTimestamp)
    if (['BNB', 'BSC', 'USDT.BEP20'].includes(symbol)) return trackBSC(address, minTimestamp)

    // Default: waiting
    return { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }
}
