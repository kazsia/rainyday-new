"use server"
import { createClient } from "@/lib/supabase/server"
import { DEFAULT_CRYPTO_LIST, type CryptoConfig } from "@/lib/crypto-constants"
import { DEFAULT_GATEWAY_CONFIGS, type GatewayConfig } from "@/lib/gateway-constants"

export type PaymentMethodSettings = {
    paypal_enabled: boolean;
    crypto_enabled: boolean;
    disabled_cryptos: string[]; // List of crypto IDs that are disabled
    crypto_configs?: CryptoConfig[]; // Custom configurations for cryptos
    gateway_configs?: GatewayConfig[]; // Custom configurations for gateways
}

export async function getPaymentMethodsSettings(): Promise<PaymentMethodSettings> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('site_settings')
            .select('value')
            .eq('key', 'payment_methods')
            .single()

        const defaultSettings = {
            paypal_enabled: true,
            crypto_enabled: true,
            disabled_cryptos: [],
            crypto_configs: DEFAULT_CRYPTO_LIST,
            gateway_configs: DEFAULT_GATEWAY_CONFIGS
        }

        if (error || !data) {
            return defaultSettings
        }

        const value = data.value as PaymentMethodSettings
        const savedConfigs = Array.isArray(value.crypto_configs) ? value.crypto_configs : []
        const savedGateways = Array.isArray(value.gateway_configs) ? value.gateway_configs : []

        // Merge with defaults to ensure all coins are present even if new ones added to code
        const mergedConfigs = DEFAULT_CRYPTO_LIST.map(def => {
            const saved = savedConfigs.find((s: any) => s.id === def.id)
            return saved ? { ...def, ...saved } : def
        })

        // Merge gateway configs
        const mergedGateways = DEFAULT_GATEWAY_CONFIGS.map(def => {
            const saved = savedGateways.find((s: any) => s.id === def.id)
            return saved ? { ...def, ...saved } : def
        })

        return {
            ...value,
            crypto_configs: mergedConfigs,
            gateway_configs: mergedGateways
        }
    } catch (e) {
        console.error("[GET_PAYMENT_METHODS_SETTINGS_CRITICAL]", e)
        return {
            paypal_enabled: true,
            crypto_enabled: true,
            disabled_cryptos: [],
            crypto_configs: DEFAULT_CRYPTO_LIST,
            gateway_configs: DEFAULT_GATEWAY_CONFIGS
        }
    }
}

export async function updatePaymentMethodsSettings(settings: PaymentMethodSettings): Promise<{ success: boolean; error?: unknown }> {
    try {
        const supabase = await createClient()
        const { error } = await supabase
            .from('site_settings')
            .upsert(
                { key: 'payment_methods', value: settings },
                { onConflict: 'key' }
            )

        if (error) {
            console.error("[UPDATE_PAYMENT_METHODS] Supabase error:", error)
            throw error
        }
        return { success: true }
    } catch (e) {
        console.error("[UPDATE_PAYMENT_METHODS_SETTINGS_CRITICAL]", e)
        return { success: false, error: e }
    }
}
