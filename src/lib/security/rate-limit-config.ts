/**
 * Rate limit configuration constants.
 * These are not server actions, just shared configuration.
 */

export interface RateLimitConfig {
    limit: number
    windowMs: number
}

/**
 * Rate limit presets for common operations.
 */
export const RateLimits: Record<string, RateLimitConfig> = {
    // Login: 5 attempts per 15 minutes per IP
    LOGIN: { limit: 5, windowMs: 15 * 60 * 1000 },

    // Checkout: 10 attempts per hour per user/IP
    CHECKOUT: { limit: 10, windowMs: 60 * 60 * 1000 },

    // Delivery access: 20 attempts per hour per IP
    DELIVERY: { limit: 20, windowMs: 60 * 60 * 1000 },

    // API calls: 100 per minute per key
    API: { limit: 100, windowMs: 60 * 1000 },

    // Password reset: 3 per hour per email
    PASSWORD_RESET: { limit: 3, windowMs: 60 * 60 * 1000 }
}

export interface RateLimitResult {
    allowed: boolean
    remaining: number
    resetAt: number
}

/**
 * Helper to create rate limit key from IP and action.
 */
export function rateLimitKey(action: string, identifier: string): string {
    return `${action}:${identifier}`
}
