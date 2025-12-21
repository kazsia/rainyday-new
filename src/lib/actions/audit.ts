"use server"

import { createAdminClient } from "@/lib/supabase/server"

/**
 * Creates an audit log entry for admin actions.
 * This should be used in server actions to track important changes.
 */
export async function createAuditLog(
    adminId: string | null,
    action: string,
    targetTable?: string,
    targetId?: string,
    details?: Record<string, unknown>
) {
    const supabase = await createAdminClient()

    const { error } = await supabase
        .from("audit_logs")
        .insert({
            admin_id: adminId,
            action,
            target_table: targetTable,
            target_id: targetId,
            details: details || {}
        })

    if (error) {
        console.error("Failed to create audit log:", error)
        // We don't throw here to avoid failing the main action if logging fails
    }
}

/**
 * Log a failed login attempt for security monitoring.
 */
export async function logFailedLogin(
    email: string,
    ipAddress?: string,
    reason?: string,
    userAgent?: string
) {
    const supabase = await createAdminClient()

    await supabase.from("security_events").insert({
        event_type: "failed_login",
        email,
        ip_address: ipAddress,
        user_agent: userAgent?.substring(0, 500),
        details: { reason }
    })

    // Also log to audit_logs for unified search
    await createAuditLog(null, "failed_login", "auth", undefined, {
        email,
        ip_address: ipAddress,
        reason
    })
}

/**
 * Log a successful login for audit trail.
 */
export async function logSuccessfulLogin(
    userId: string,
    email: string,
    ipAddress?: string,
    userAgent?: string
) {
    const supabase = await createAdminClient()

    await supabase.from("security_events").insert({
        event_type: "successful_login",
        user_id: userId,
        email,
        ip_address: ipAddress,
        user_agent: userAgent?.substring(0, 500),
        details: {}
    })
}

/**
 * Log a security event for incident response.
 */
export async function logSecurityEvent(
    eventType: string,
    details: {
        userId?: string
        email?: string
        ipAddress?: string
        userAgent?: string
        additionalInfo?: Record<string, unknown>
    }
) {
    const supabase = await createAdminClient()

    await supabase.from("security_events").insert({
        event_type: eventType,
        user_id: details.userId,
        email: details.email,
        ip_address: details.ipAddress,
        user_agent: details.userAgent?.substring(0, 500),
        details: details.additionalInfo || {}
    })
}

/**
 * Log rate limit exceeded event.
 */
export async function logRateLimitExceeded(
    action: string,
    identifier: string,
    ipAddress?: string
) {
    await logSecurityEvent("rate_limit_exceeded", {
        ipAddress,
        additionalInfo: { action, identifier }
    })
}

/**
 * Log suspicious activity for investigation.
 */
export async function logSuspiciousActivity(
    description: string,
    details: {
        userId?: string
        email?: string
        ipAddress?: string
        userAgent?: string
        evidenceData?: Record<string, unknown>
    }
) {
    await logSecurityEvent("suspicious_activity", {
        ...details,
        additionalInfo: {
            description,
            ...details.evidenceData
        }
    })
}
