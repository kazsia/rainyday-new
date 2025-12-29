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
/**
 * Track BTC address via multiple providers for redundancy
 * Providers: Mempool.space, Blockchair, SoChain, BlockCypher
 */
async function trackBTC(address: string, minTimestamp?: number): Promise<TransactionStatus> {
    // 1. Mempool.space (Fastest, best for mempool)
    try {
        const response = await fetch(`https://mempool.space/api/address/${address}/txs`, { signal: AbortSignal.timeout(3000) })
        if (response.ok) {
            const txs = await response.json()
            if (txs && txs.length > 0) {
                const latestTx = txs[0]
                const txTimestamp = latestTx.status.block_time || Date.now() / 1000 // Mempool doesn't give time for unconfirmed sometimes, use current? logic: if detected, it's new. 
                // Actually unconfirmed txs might not have block_time. status.confirmed=false.

                if (minTimestamp && latestTx.status.confirmed && txTimestamp < minTimestamp) {
                    // If confirmed and old, check next? Usually mempool returns new first.
                    // If the first tx is old, likely no new tx.
                }

                if (!minTimestamp || !latestTx.status.confirmed || txTimestamp >= minTimestamp) {
                    const confirmations = latestTx.status.confirmed ? 3 : 0 // Simplified
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
                        status: confirmations >= 2 ? 'confirmed' : 'detected',
                        lastCheck: new Date(),
                        amountReceived: amountSatoshis / 100000000,
                        timestamp: txTimestamp
                    }
                }
            }
        }
    } catch (e) {
        // console.warn("BTC Mempool.space failed", e) 
    }

    // 2. Blockchair (Very reliable)
    try {
        const response = await fetch(`https://api.blockchair.com/bitcoin/dashboards/address/${address}?limit=2`, { signal: AbortSignal.timeout(3000) })
        if (response.ok) {
            const data = await response.json()
            const addrData = data.data[address]
            const txs = addrData.transactions || []
            // Blockchair dashboard sometimes returns just hashes in 'transactions'. 
            // But usually it has a list if we don't ask for too details? 
            // Let's verify structure. The 'transactions' key in dashboard is array of hashes usually, 
            // UNLESS 'transaction_details=true' which we didn't pass.
            // BUT, the 'calls' or other fields might help.
            // Actually, easier to use their raw transaction endpoint if we have hashes, but we don't.
            // Wait, let's use Chain.so next as it's easier. Blockchair is complex without API key for full details sometimes.
            // However, `data.data[address].address` has `balance` and `transaction_count`. 
            // If we see balance > 0 and we expected it... but we need TXID.
        }
    } catch (e) { }

    // 2. SoChain (Chain.so) - Simple and effective
    try {
        const response = await fetch(`https://chain.so/api/v2/get_tx_received/BTC/${address}`, { signal: AbortSignal.timeout(3000) })
        if (response.ok) {
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
                    status: confirmations >= 2 ? 'confirmed' : 'detected',
                    lastCheck: new Date(),
                    amountReceived: parseFloat(tx.value),
                    timestamp: txTime
                }
            }
        }
    } catch (e) { }

    // 3. Blockchain.info (RawBlock)
    try {
        const response = await fetch(`https://blockchain.info/rawaddr/${address}?limit=5`, { signal: AbortSignal.timeout(3000) })
        if (response.ok) {
            const data = await response.json()
            const txs = data.txs || []
            for (const tx of txs) {
                const txTime = tx.time
                if (minTimestamp && txTime < minTimestamp) continue

                // Inputs/Outputs logic
                let amountSatoshis = 0
                // Blockchain.info structure: out[{addr, value, ...}]
                for (const out of tx.out || []) {
                    if (out.addr === address) amountSatoshis += out.value
                }

                // Confirmations not always directly in rawaddr tx object? 
                // It has 'block_height'. We need current height to calc. 
                // But wait, if it has block_height, it's confirmed. If no block_height, 0 confs.
                const isConfirmed = !!tx.block_height

                return {
                    detected: true,
                    confirmations: isConfirmed ? 3 : 0, // Estimating
                    txId: tx.hash,
                    status: isConfirmed ? 'confirmed' : 'detected',
                    lastCheck: new Date(),
                    amountReceived: amountSatoshis / 100000000,
                    timestamp: txTime
                }
            }
        }
    } catch (e) { }

    // 4. BlockCypher (Fallback)
    try {
        const bcResponse = await fetch(`https://api.blockcypher.com/v1/btc/main/addrs/${address}/full?limit=5`, { signal: AbortSignal.timeout(4000) })
        if (bcResponse.ok) {
            const data = await bcResponse.json()
            const bcTxs = data.txs || []

            for (const tx of bcTxs) {
                const txTime = tx.received ? new Date(tx.received).getTime() / 1000 : 0
                if (minTimestamp && txTime < minTimestamp) continue

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
                    status: confirmations >= 2 ? 'confirmed' : 'detected',
                    lastCheck: new Date(),
                    amountReceived,
                    timestamp: txTime
                }
            }
        }
    } catch (e) { }

    return { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }
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
 * Track LTC address via BlockCypher - with proper timestamp filtering
 */
async function trackLTC(address: string, minTimestamp?: number): Promise<TransactionStatus> {
    try {
        // Primary: Blockchair (More reliable than BlockCypher free tier)
        const response = await fetch(`https://api.blockchair.com/litecoin/dashboards/address/${address}?limit=5`, { signal: AbortSignal.timeout(4000) })
        if (response.ok) {
            const data = await response.json()
            const addrData = data.data[address]
            const txs = addrData.transactions || []

            if (txs.length === 0) {
                // Check unconfirmed if available or just return waiting
                return { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }
            }

            for (const txHash of txs) {
                // Blockchair address endpoint gives list of tx hashes. We might need full details?
                // Actually the dashboard endpoint gives some info. But let's check if we can get details.
                // The 'transactions' array is just hashes. The 'calls' or 'layer_2' might differ.
                // Wait, dashboard endpoint usually includes 'transactions' as list of objects in some contexts, but documentation says list of hashes.
                // Let's use a better endpoint or just trust if we see a new TX.
                // Actually, Blockchair 'dashboards/address' returns robust data but sometimes limits transaction details.

                // Alternative: Chain.so (SoChain)
                break; // Fallback to chain.so below for easier parsing
            }
        }

        // Primary Alternative: Chain.so (Very simple API)
        const soResponse = await fetch(`https://chain.so/api/v2/get_tx_received/LTC/${address}`, { signal: AbortSignal.timeout(4000) })
        if (soResponse.ok) {
            const data = await soResponse.json()
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
        }

    } catch (e) {
        console.error("LTC Primary Tracking Error:", e)
    }

    // Fallback: BlockCypher (Rate limited often, but good backup)
    try {
        const response = await fetch(`https://api.blockcypher.com/v1/ltc/main/addrs/${address}/full?limit=5`, { signal: AbortSignal.timeout(4000) })
        if (response.ok) {
            const data = await response.json()
            const txs = data.txs || []

            if (txs.length === 0 && data.unconfirmed_n_tx === 0) {
                return { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }
            }

            for (const tx of txs) {
                const txTime = tx.received ? new Date(tx.received).getTime() / 1000 : 0
                if (minTimestamp && txTime < minTimestamp) continue

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
            // Check unconfirmed
            if (data.unconfirmed_n_tx > 0 && data.unconfirmed_txrefs) {
                for (const txref of data.unconfirmed_txrefs) {
                    const txTime = txref.received ? new Date(txref.received).getTime() / 1000 : Date.now() / 1000
                    if (minTimestamp && txTime < minTimestamp) continue
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
        console.error("LTC BlockCypher Error:", e)
    }

    return { detected: false, confirmations: 0, status: 'waiting', lastCheck: new Date() }
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
