"use server"

/**
 * Simple in-memory rate limiter.
 * For production, use Redis or a distributed rate limiting service.
 */

import { RateLimitResult } from "./rate-limit-config"

interface RateLimitEntry {
    count: number
    resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up old entries periodically
if (typeof setInterval !== "undefined") {
    setInterval(() => {
        const now = Date.now()
        for (const [key, entry] of rateLimitStore.entries()) {
            if (entry.resetAt < now) {
                rateLimitStore.delete(key)
            }
        }
    }, 60000) // Clean up every minute
}

/**
 * Check rate limit for a given key.
 * @param key - Unique identifier (e.g., IP address, user ID, or action type)
 * @param limit - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds
 */
export async function checkRateLimit(
    key: string,
    limit: number,
    windowMs: number
): Promise<RateLimitResult> {
    const now = Date.now()
    const entry = rateLimitStore.get(key)

    if (!entry || entry.resetAt < now) {
        // New window
        rateLimitStore.set(key, {
            count: 1,
            resetAt: now + windowMs
        })
        return {
            allowed: true,
            remaining: limit - 1,
            resetAt: now + windowMs
        }
    }

    if (entry.count >= limit) {
        return {
            allowed: false,
            remaining: 0,
            resetAt: entry.resetAt
        }
    }

    entry.count++
    return {
        allowed: true,
        remaining: limit - entry.count,
        resetAt: entry.resetAt
    }
}

/**
 * Check and enforce rate limit, throwing if exceeded.
 */
export async function enforceRateLimit(
    key: string,
    limit: number,
    windowMs: number
): Promise<void> {
    const result = await checkRateLimit(key, limit, windowMs)

    if (!result.allowed) {
        const retryAfterSeconds = Math.ceil((result.resetAt - Date.now()) / 1000)
        throw new Error(`Rate limit exceeded. Try again in ${retryAfterSeconds} seconds.`)
    }
}
