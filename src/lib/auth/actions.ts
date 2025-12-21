"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { checkRateLimit } from "@/lib/security/rate-limit"
import { RateLimits, rateLimitKey } from "@/lib/security/rate-limit-config"
import { logFailedLogin, logSuccessfulLogin } from "@/lib/actions/audit"
import { headers } from "next/headers"

export async function signIn(formData: FormData) {
    const supabase = await createClient()
    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || headersList.get("x-real-ip") || "unknown"

    const email = formData.get("email") as string
    const password = formData.get("password") as string

    // ========================
    // SECURITY: Rate Limiting
    // ========================
    const rateKey = rateLimitKey("login", ipAddress)
    const rateResult = await checkRateLimit(rateKey, RateLimits.LOGIN.limit, RateLimits.LOGIN.windowMs)

    if (!rateResult.allowed) {
        const retryAfter = Math.ceil((rateResult.resetAt - Date.now()) / 1000 / 60)
        return { error: `Too many login attempts. Please try again in ${retryAfter} minutes.` }
    }

    const { error, data } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
        // Log failed login attempt
        await logFailedLogin(email, ipAddress, error.message)
        return { error: error.message }
    }

    // Log successful login
    if (data.user) {
        await logSuccessfulLogin(data.user.id, email, ipAddress)
    }

    revalidatePath("/", "layout")
    redirect("/")
}

export async function signUp(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
    }

    const { error } = await supabase.auth.signUp(data)

    if (error) {
        return { error: error.message }
    }

    revalidatePath("/", "layout")
    redirect("/auth?message=Check your email to confirm your account")
}

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath("/", "layout")
    redirect("/")
}

export async function getUser() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
}

export async function getUserProfile() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

    return profile
}
