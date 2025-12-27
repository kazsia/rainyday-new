// Shared constants for gateway configurations
// Can be imported by both client and server components

export type GatewayConfig = {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
}

export const DEFAULT_GATEWAY_CONFIGS: GatewayConfig[] = [
    {
        id: "paypal",
        name: "PayPal",
        description: "Accept fiat via PayPal account",
        icon: "https://www.paypalobjects.com/webstatic/icon/pp258.png",
        color: "#003087"
    },
    {
        id: "oxapay",
        name: "OxaPay",
        description: "Accept 18+ cryptocurrencies",
        icon: "https://oxapay.com/favicon.ico",
        color: "#10B981"
    }
]
