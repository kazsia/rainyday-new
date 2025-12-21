"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export interface AuthUser {
    id: string
    email: string
    role: string
}

/**
 * Get the authenticated user without throwing.
 * Returns null if not authenticated.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        return null
    }

    // Fetch profile to get role
    const { data: profile } = await supabase
        .from("profiles")
        .select("role, email")
        .eq("id", user.id)
        .single()

    if (!profile) {
        return null
    }

    return {
        id: user.id,
        email: profile.email || user.email || "",
        role: profile.role || "user"
    }
}

/**
 * Require authentication. Redirects to /auth if not logged in.
 * Use in Server Components and Server Actions.
 */
export async function requireAuth(): Promise<AuthUser> {
    const user = await getAuthUser()

    if (!user) {
        redirect("/auth")
    }

    return user
}

/**
 * Require admin role. Redirects to / if not admin.
 * Use in Server Components and Server Actions.
 */
export async function requireAdmin(): Promise<AuthUser> {
    const user = await getAuthUser()

    if (!user) {
        redirect("/auth")
    }

    if (user.role !== "admin") {
        redirect("/")
    }

    return user
}

/**
 * Check if current user is admin (non-throwing).
 * Useful for conditional rendering in server components.
 */
export async function isAdmin(): Promise<boolean> {
    const user = await getAuthUser()
    return user?.role === "admin"
}

/**
 * Validate admin status for server actions.
 * Throws error instead of redirecting (for API-like behavior).
 */
export async function validateAdmin(): Promise<AuthUser> {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        throw new Error("Unauthorized: Not authenticated")
    }

    // Use admin client to bypass RLS for reliable role check
    const adminClient = await createAdminClient()
    const { data: profile, error: profileError } = await adminClient
        .from("profiles")
        .select("role, email")
        .eq("id", user.id)
        .single()

    if (profileError || !profile) {
        throw new Error("Forbidden: Profile not found")
    }

    if (profile.role !== "admin") {
        throw new Error("Forbidden: Admin access required")
    }

    return {
        id: user.id,
        email: profile.email || user.email || "",
        role: profile.role
    }
}

/**
 * Invalidate all sessions for a user.
 * Use after password change, role change, or security events.
 */
export async function invalidateUserSessions(
    userId: string,
    reason: string
): Promise<void> {
    const adminClient = await createAdminClient()

    const { error } = await adminClient.auth.admin.signOut(userId)

    if (error) {
        console.error("Failed to invalidate sessions:", error)
        throw new Error("Failed to invalidate user sessions")
    }

    // Log the security event
    await adminClient.from("audit_logs").insert({
        admin_id: userId,
        action: "force_logout",
        target_table: "auth.users",
        target_id: userId,
        details: { reason }
    })
}
