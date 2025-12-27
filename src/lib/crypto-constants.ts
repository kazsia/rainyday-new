// Shared crypto configuration constants
// This file can be imported by both client and server components

export type CryptoConfig = {
    id: string;
    name: string;
    symbol: string;
    icon: string;
    color: string;
    network: string;
}

export const DEFAULT_CRYPTO_LIST: CryptoConfig[] = [
    { id: "btc", name: "Bitcoin", symbol: "BTC", icon: "https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=035", color: "#F7931A", network: "BTC" },
    { id: "eth-group", name: "Ethereum", symbol: "ETH", icon: "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=035", color: "#627EEA", network: "ETH" },
    { id: "ltc", name: "Litecoin", symbol: "LTC", icon: "https://cryptologos.cc/logos/litecoin-ltc-logo.svg?v=035", color: "#345D9D", network: "LTC" },
    { id: "usdt-group", name: "Tether", symbol: "USDT", icon: "https://cryptologos.cc/logos/tether-usdt-logo.svg?v=035", color: "#26A17B", network: "TRC20" },
    { id: "usdc-group", name: "USD Coin", symbol: "USDC", icon: "https://cryptologos.cc/logos/usd-coin-usdc-logo.svg?v=035", color: "#2775CA", network: "ERC20" },
    { id: "dai", name: "DAI", symbol: "DAI", icon: "https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.svg?v=035", color: "#F5AC37", network: "ERC20" },
    { id: "sol", name: "Solana", symbol: "SOL", icon: "https://cryptologos.cc/logos/solana-sol-logo.svg?v=035", color: "#9945FF", network: "SOL" },
    { id: "trx", name: "Tron", symbol: "TRX", icon: "https://cryptologos.cc/logos/tron-trx-logo.svg?v=035", color: "#FF0013", network: "TRX" },
    { id: "bnb", name: "BNB", symbol: "BNB", icon: "https://cryptologos.cc/logos/bnb-bnb-logo.svg?v=035", color: "#F3BA2F", network: "BSC" },
    { id: "ton", name: "Toncoin", symbol: "TON", icon: "https://cryptologos.cc/logos/toncoin-ton-logo.svg?v=035", color: "#0088CC", network: "TON" },
    { id: "xrp", name: "Ripple", symbol: "XRP", icon: "https://cryptologos.cc/logos/xrp-xrp-logo.svg?v=035", color: "#23292F", network: "XRP" },
    { id: "pol", name: "Polygon", symbol: "POL", icon: "https://cryptologos.cc/logos/polygon-matic-logo.svg?v=035", color: "#8247E5", network: "POL" },
    { id: "xmr", name: "Monero", symbol: "XMR", icon: "https://cryptologos.cc/logos/monero-xmr-logo.svg?v=035", color: "#FF6600", network: "XMR" },
    { id: "bch", name: "Bitcoin cash", symbol: "BCH", icon: "https://cryptologos.cc/logos/bitcoin-cash-bch-logo.svg?v=035", color: "#8FF334", network: "BCH" },
    { id: "doge", name: "Dogecoin", symbol: "DOGE", icon: "https://cryptologos.cc/logos/dogecoin-doge-logo.svg?v=035", color: "#C2A633", network: "DOGE" },
    { id: "shib", name: "Shiba Inu", symbol: "SHIB", icon: "https://cryptologos.cc/logos/shiba-inu-shib-logo.svg?v=035", color: "#FFA409", network: "ERC20" },
    { id: "not", name: "Notcoin", symbol: "NOT", icon: "https://assets.coingecko.com/coins/images/37770/large/notcoin.png", color: "#000000", network: "TON" },
    { id: "dogs", name: "DOGS", symbol: "DOGS", icon: "https://assets.coingecko.com/coins/images/39565/large/dogs.png", color: "#FFFFFF", network: "TON" },
]
