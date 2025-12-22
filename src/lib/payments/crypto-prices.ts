"use server"

interface CryptoPrice {
    symbol: string
    usdPrice: number
    lastUpdated: Date
}

// CoinGecko IDs for all OxaPay supported cryptocurrencies
const COINGECKO_IDS: Record<string, string> = {
    // Bitcoin
    BTC: "bitcoin",
    Bitcoin: "bitcoin",
    // Ethereum
    ETH: "ethereum",
    Ethereum: "ethereum",
    // Litecoin
    LTC: "litecoin",
    Litecoin: "litecoin",
    // Monero
    XMR: "monero",
    Monero: "monero",
    // Tether (USDT)
    USDT: "tether",
    "USDT (TRC20)": "tether",
    "USDT (ERC20)": "tether",
    // Dogecoin
    DOGE: "dogecoin",
    Dogecoin: "dogecoin",
    // Solana
    SOL: "solana",
    Solana: "solana",
    // Tron
    TRX: "tron",
    Tron: "tron",
    // BNB
    BNB: "binancecoin",
    // Bitcoin Cash
    BCH: "bitcoin-cash",
    "Bitcoin Cash": "bitcoin-cash",
    // Polygon (POL)
    POL: "matic-network",
    Polygon: "matic-network",
    // USDC
    USDC: "usd-coin",
    // TON
    TON: "the-open-network",
    // Shiba Inu
    SHIB: "shiba-inu",
    "Shiba Inu": "shiba-inu",
    // DAI
    DAI: "dai",
}

// Cache for prices (5 minute TTL)
let priceCache: Record<string, CryptoPrice> = {}
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Fetch current crypto price from CoinGecko (free, no API key required)
 */
export async function getCryptoPrice(symbol: string): Promise<number | null> {
    const coingeckoId = COINGECKO_IDS[symbol] || COINGECKO_IDS[symbol.toUpperCase()]

    if (!coingeckoId) {
        console.error(`Unknown crypto symbol: ${symbol}`)
        return null
    }

    // Check cache first
    const cached = priceCache[coingeckoId]
    if (cached && Date.now() - cached.lastUpdated.getTime() < CACHE_TTL) {
        return cached.usdPrice
    }

    try {
        const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd`,
            {
                headers: {
                    'Accept': 'application/json',
                },
                next: { revalidate: 60 }, // Cache for 1 minute on server
            }
        )

        if (!response.ok) {
            console.error(`CoinGecko API error: ${response.status}`)
            return null
        }

        const data = await response.json()
        const price = data[coingeckoId]?.usd

        if (price) {
            // Update cache
            priceCache[coingeckoId] = {
                symbol: symbol.toUpperCase(),
                usdPrice: price,
                lastUpdated: new Date(),
            }
            return price
        }

        return null
    } catch (error) {
        console.error(`Error fetching crypto price for ${symbol}:`, error)
        return null
    }
}

/**
 * Convert USD amount to crypto amount
 * Returns the exact crypto amount with appropriate precision
 */
export async function convertUsdToCrypto(
    usdAmount: number,
    cryptoSymbol: string
): Promise<{ cryptoAmount: string; usdPrice: number } | null> {
    const price = await getCryptoPrice(cryptoSymbol)

    if (!price || price <= 0) {
        console.error(`Could not get price for ${cryptoSymbol}`)
        return null
    }

    // Calculate crypto amount
    const cryptoAmount = usdAmount / price

    // Determine decimal places based on crypto
    let decimals = 8 // Default for BTC
    const symbol = cryptoSymbol.toUpperCase()

    if (symbol === "ETH" || symbol === "ETHEREUM") decimals = 6
    if (symbol === "LTC" || symbol === "LITECOIN") decimals = 6
    if (symbol === "XMR" || symbol === "MONERO") decimals = 8
    if (symbol === "USDT" || symbol === "TETHER") decimals = 2
    if (symbol === "USDC" || symbol === "USD-COIN") decimals = 2
    if (symbol === "DAI") decimals = 2
    if (symbol === "DOGE" || symbol === "DOGECOIN") decimals = 4
    if (symbol === "SOL" || symbol === "SOLANA") decimals = 6
    if (symbol === "TRX" || symbol === "TRON") decimals = 4
    if (symbol === "BCH" || symbol === "BITCOIN CASH") decimals = 8
    if (symbol === "BNB") decimals = 8
    if (symbol === "POL" || symbol === "POLYGON") decimals = 6
    if (symbol === "TON") decimals = 4
    if (symbol === "SHIB" || symbol === "SHIBA INU") decimals = 0 // SHIB has very low value, usually whole numbers

    return {
        cryptoAmount: cryptoAmount.toFixed(decimals),
        usdPrice: price,
    }
}

/**
 * Get multiple crypto prices at once
 */
export async function getMultipleCryptoPrices(): Promise<Record<string, number>> {
    const ids = [
        "bitcoin", "ethereum", "litecoin", "monero", "dogecoin", "solana", "tron", "tether",
        "binancecoin", "bitcoin-cash", "matic-network", "usd-coin", "the-open-network", "shiba-inu", "dai"
    ]

    try {
        const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=usd`,
            {
                headers: {
                    'Accept': 'application/json',
                },
                next: { revalidate: 60 },
            }
        )

        if (!response.ok) {
            console.error(`CoinGecko API error: ${response.status}`)
            return {}
        }

        const data = await response.json()

        // Update cache for all
        const prices: Record<string, number> = {}
        for (const id of ids) {
            if (data[id]?.usd) {
                priceCache[id] = {
                    symbol: id.toUpperCase(),
                    usdPrice: data[id].usd,
                    lastUpdated: new Date(),
                }
                prices[id] = data[id].usd
            }
        }

        return prices
    } catch (error) {
        console.error("Error fetching multiple crypto prices:", error)
        return {}
    }
}
