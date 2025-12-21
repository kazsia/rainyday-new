export async function getCryptoPrices(): Promise<Record<string, number>> {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,litecoin&vs_currencies=usd');
        const data = await response.json();
        return {
            btc: data.bitcoin.usd,
            ltc: data.litecoin.usd
        };
    } catch (error) {
        console.error('Failed to fetch crypto prices:', error);
        return {
            btc: 90000, // Fallback realistic prices
            ltc: 100
        };
    }
}
