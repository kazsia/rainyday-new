import React from 'react'
import { Gift, CheckCircle, CreditCard } from 'lucide-react'

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

export const getPaymentIcon = (payment: any) => {
    const p = getCryptoIdentifier(payment)
    if (!p) return null

    // Coupon icon
    if (p === 'coupon') return <Gift className="w-4 h-4 text-purple-400" />
    if (p === 'manual' || p === 'admin') return <CheckCircle className="w-4 h-4 text-indigo-400" />
    if (p.includes('paypal') || p === 'pp') return <img src="https://upload.wikimedia.org/wikipedia/commons/b/b7/PayPal_Logo_Icon_2014.svg" className="w-4 h-4" alt="PayPal" />

    const logoMap: Record<string, string> = {
        "btc": "https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=035",
        "bitcoin": "https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=035",
        "eth": "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=035",
        "ethereum": "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=035",
        "ltc": "https://cryptologos.cc/logos/litecoin-ltc-logo.svg?v=035",
        "litecoin": "https://cryptologos.cc/logos/litecoin-ltc-logo.svg?v=035",
        "usdt": "https://cryptologos.cc/logos/tether-usdt-logo.svg?v=035",
        "usdc": "https://cryptologos.cc/logos/usd-coin-usdc-logo.svg?v=035",
        "sol": "https://cryptologos.cc/logos/solana-sol-logo.svg?v=035",
        "solana": "https://cryptologos.cc/logos/solana-sol-logo.svg?v=035",
        "doge": "https://cryptologos.cc/logos/dogecoin-doge-logo.svg?v=035",
        "dogecoin": "https://cryptologos.cc/logos/dogecoin-doge-logo.svg?v=035",
        "trx": "https://cryptologos.cc/logos/tron-trx-logo.svg?v=035",
        "tron": "https://cryptologos.cc/logos/tron-trx-logo.svg?v=035",
        "xrp": "https://cryptologos.cc/logos/xrp-xrp-logo.svg?v=035",
        "ripple": "https://cryptologos.cc/logos/xrp-xrp-logo.svg?v=035",
        "bnb": "https://cryptologos.cc/logos/bnb-bnb-logo.svg?v=035",
        "xmr": "https://cryptologos.cc/logos/monero-xmr-logo.svg?v=035",
        "monero": "https://cryptologos.cc/logos/monero-xmr-logo.svg?v=035",
        "ton": "https://cryptologos.cc/logos/toncoin-ton-logo.svg?v=035",
        "dai": "https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.svg?v=035",
        "bch": "https://cryptologos.cc/logos/bitcoin-cash-bch-logo.svg?v=035",
        "pol": "https://cryptologos.cc/logos/polygon-matic-logo.svg?v=035",
        "shib": "https://cryptologos.cc/logos/shiba-inu-shib-logo.svg?v=035",
    }

    const logoUrl = logoMap[p.toLowerCase()] || Object.entries(logoMap).find(([k]) => p.toLowerCase().includes(k))?.[1]

    if (logoUrl) {
        return <img src={logoUrl} className="w-4 h-4 object-contain" alt={p} />
    }

    // Generic crypto icon
    if (p === 'crypto') return <div className="w-4 h-4 rounded-full bg-cyan-500/20 flex items-center justify-center text-[8px] text-cyan-400 font-bold">₿</div>

    return <CreditCard className="w-4 h-4 text-white/20" />
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
