"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { createAuditLog } from "./audit"
import { cookies } from "next/headers"

/**
 * Ensures the current user is an admin.
 * Throws an error if not authorized.
 */
async function ensureAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        console.error("Auth: No user found in session")
        throw new Error("Unauthorized")
    }

    // Use admin client to bypass RLS and ensure we can read the profile
    const adminClient = await createAdminClient()
    const { data: profile, error } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

    if (error || !profile) {
        console.error("Auth: Profile not found for user", user.id, error)
        throw new Error("Forbidden: Profile not found")
    }

    if (profile.role !== "admin") {
        console.error("Auth: User is not an admin", user.id, "Role:", profile.role)
        throw new Error(`Forbidden: Role is ${profile.role}`)
    }

    return user
}

export async function updateAdminProfile(formData: FormData) {
    const user = await ensureAdmin()
    const supabase = await createClient()

    const displayName = formData.get("display_name") as string
    const avatarUrl = formData.get("avatar_url") as string
    const timezone = formData.get("timezone") as string

    // Update profile metadata in public.profiles or auth.users?
    // Based on schema 003, profiles has email, role. We might need name/avatar columns.
    // Let's assume we update public.profiles - if columns missing, we'll need a migration.
    // Actually, let's check profiles columns again.

    const { error } = await supabase
        .from("profiles")
        .update({
            full_name: displayName,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString()
        })
        .eq("id", user.id)

    if (error) return { error: error.message }

    await createAuditLog(user.id, "update_profile", "profiles", user.id, { displayName, timezone })

    revalidatePath("/admin/account")
    return { success: true }
}

export async function changeAdminPassword(formData: FormData) {
    const user = await ensureAdmin()
    const supabase = await createClient()

    const newPassword = formData.get("new_password") as string

    // Input validation
    if (!newPassword || newPassword.length < 8) {
        return { error: "Password must be at least 8 characters" }
    }

    const { error } = await supabase.auth.updateUser({
        password: newPassword
    })

    if (error) return { error: error.message }

    await createAuditLog(user.id, "change_password", "auth.users", user.id)

    // ========================
    // SECURITY: Invalidate other sessions after password change
    // ========================
    try {
        const { invalidateUserSessions } = await import("@/lib/security/auth")
        await invalidateUserSessions(user.id, "password_change")
    } catch (sessionError) {
        console.error("Failed to invalidate sessions:", sessionError)
        // Don't fail the password change if session invalidation fails
    }

    return { success: true }
}

export async function updateAdminPreferences(settings: any) {
    const user = await ensureAdmin()
    const supabase = await createClient()

    const { error } = await supabase
        .from("admin_preferences")
        .upsert({
            admin_id: user.id,
            settings,
            updated_at: new Date().toISOString()
        })

    if (error) return { error: error.message }

    await createAuditLog(user.id, "update_preferences", "admin_preferences", user.id, settings)

    revalidatePath("/admin/account")
    return { success: true }
}

export async function createAdminApiKey(label: string, scopes: string[]) {
    const user = await ensureAdmin()
    const supabase = await createAdminClient() // Use admin client to handle key hashing potentially

    // Generate API key - consider using crypto.randomUUID() for production
    const rawKey = `rd_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`
    const prefix = rawKey.substring(0, 7)

    // TODO: Hash the key before storing for security
    const keyHash = rawKey

    const { data, error } = await supabase
        .from("admin_api_keys")
        .insert({
            admin_id: user.id,
            key_hash: keyHash,
            prefix,
            label,
            scopes
        })
        .select()
        .single()

    if (error) return { error: error.message }

    await createAuditLog(user.id, "create_api_key", "admin_api_keys", data.id, { label })

    return { success: true, key: rawKey }
}

export async function revokeAdminApiKey(id: string) {
    const user = await ensureAdmin()
    const supabase = await createClient()

    const { error } = await supabase
        .from("admin_api_keys")
        .delete()
        .eq("id", id)
        .eq("admin_id", user.id)

    if (error) return { error: error.message }

    await createAuditLog(user.id, "revoke_api_key", "admin_api_keys", id)

    revalidatePath("/admin/account")
    return { success: true }
}

export async function revokeAllAdminSessions() {
    const user = await ensureAdmin()
    const supabase = await createAdminClient()

    // Sign out every session for this user
    const { error } = await supabase.auth.admin.signOut(user.id)

    if (error) return { error: error.message }

    await createAuditLog(user.id, "revoke_all_sessions", "auth.users", user.id)

    return { success: true }
}

export async function getAdminAuditLogs() {
    const user = await ensureAdmin()
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("admin_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50)

    if (error) return { error: error.message }
    return { success: true, logs: data }
}
