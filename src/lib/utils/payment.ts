export const getCryptoIdentifier = (payment: any) => {
    // Check provider first
    const provider = (payment?.provider || '').toLowerCase()
    // Check currency field (often has actual crypto code like LTC, BTC)
    const currency = (payment?.currency || '').toLowerCase()
    // Check crypto address to infer coin type
    const address = payment?.crypto_address || ''

    // If provider is specific (not generic "crypto"), use it
    if (provider && provider !== 'crypto' && provider !== 'usd') {
        return provider
    }

    // If currency is a crypto code (not USD), use it
    if (currency && currency !== 'usd') {
        return currency
    }

    // Try to infer from crypto address format
    if (address) {
        // Bitcoin addresses: start with 1, 3, or bc1
        if (/^(1|3)[a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address) || /^bc1[a-z0-9]{39,59}$/.test(address)) {
            return 'btc'
        }
        // Litecoin addresses: start with L, M, or ltc1
        if (/^[LM][a-km-zA-HJ-NP-Z1-9]{26,33}$/.test(address) || /^ltc1[a-z0-9]{39,59}$/.test(address)) {
            return 'ltc'
        }
        // Ethereum addresses: start with 0x and are 42 chars
        if (/^0x[a-fA-F0-9]{40}$/.test(address)) {
            return 'eth'
        }
        // Tron addresses: start with T
        if (/^T[a-zA-Z0-9]{33}$/.test(address)) {
            return 'trx'
        }
        // Monero addresses: start with 4 and are long
        if (/^4[0-9AB][1-9A-HJ-NP-Za-km-z]{93}$/.test(address)) {
            return 'xmr'
        }
        // Dogecoin: starts with D
        if (/^D[5-9A-HJ-NP-U][1-9A-HJ-NP-Za-km-z]{32}$/.test(address)) {
            return 'doge'
        }
    }

    // Use provider as fallback (even if it's generic "crypto")
    return provider
}

export const getPaymentName = (payment: any) => {
    const p = getCryptoIdentifier(payment)
    if (!p) return "—"

    // Show coupon/manual as payment method
    if (p === 'coupon') return "Coupon"
    if (p === 'manual' || p === 'admin') return "Manual"
    if (p.toLowerCase().includes('paypal') || p === 'pp') return "PayPal"

    if (p.includes('btc') || p.includes('bitcoin')) return "Bitcoin"
    if (p.includes('eth') || p.includes('ethereum')) return "Ethereum"
    if (p.includes('ltc') || p.includes('litecoin')) return "Litecoin"
    if (p.includes('usdt')) return "Tether"
    if (p.includes('usdc')) return "USD Coin"
    if (p.includes('xmr') || p.includes('monero')) return "Monero"
    if (p.includes('sol') || p.includes('solana')) return "Solana"
    if (p.includes('trx') || p.includes('tron')) return "Tron"
    if (p.includes('bnb')) return "BNB"
    if (p.includes('doge')) return "Dogecoin"
    if (p.includes('bch')) return "Bitcoin Cash"
    if (p.includes('ton')) return "Toncoin"
    if (p.includes('xrp') || p.includes('ripple')) return "Ripple"
    if (p.includes('dai')) return "DAI"
    if (p.includes('pol') || p.includes('matic') || p.includes('polygon')) return "Polygon"
    if (p.includes('shib')) return "Shiba Inu"

    // For any other provider, show "Crypto" if generic
    if (p === 'crypto') return "Crypto"
    return p.toUpperCase()
}
