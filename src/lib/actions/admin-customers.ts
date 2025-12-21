"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { createAuditLog } from "./audit"
import { headers } from "next/headers"

/**
 * Ensures the current user is an admin.
 */
async function ensureAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const adminClient = await createAdminClient()
    const { data: profile } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

    if (profile?.role !== "admin") {
        const head = await headers()
        const ip = head.get("x-forwarded-for") || head.get("x-real-ip")
        await createAuditLog(user.id, "unauthorized_admin_access_attempt", "admin_panel", "admin/customers", { ip })
        throw new Error("Forbidden")
    }
    return user
}

export async function getCustomers(page: number = 1, search: string = "", status: string = "all") {
    try {
        await ensureAdmin()
        const supabase = await createAdminClient()
        const pageSize = 20
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1

        let query = supabase
            .from("customers")
            .select(`
                *,
                profiles!customers_user_id_fkey(full_name, avatar_url, role),
                orders!orders_customer_email_fkey(id, total, created_at)
            `, { count: 'exact' })

        if (search) {
            // Note: profiles.full_name works because of the join
            query = query.or(`email.ilike.%${search}%,id.ilike.%${search}%,profiles.full_name.ilike.%${search}%`)
        }

        if (status !== "all") {
            query = query.eq("status", status)
        }

        const { data, count, error } = await query
            .order("last_seen_at", { ascending: false })
            .range(from, to)

        if (error) throw error

        const users = data.map(customer => {
            const orders = customer.orders || []
            const totalSpent = orders.reduce((sum: number, o: any) => sum + Number(o.total), 0)
            const lastOrderDate = orders.length > 0 ? new Date(Math.max(...orders.map((o: any) => new Date(o.created_at).getTime()))).toISOString() : null

            return {
                id: customer.id,
                email: customer.email,
                user_id: customer.user_id,
                full_name: customer.profiles?.full_name || null,
                avatar_url: customer.profiles?.avatar_url || null,
                role: customer.user_id ? (customer.profiles?.role || 'user') : 'guest',
                status: customer.status,
                is_registered: customer.is_registered,
                newsletter_subscribed: customer.newsletter_subscribed,
                balance: Number(customer.balance),
                order_count: orders.length,
                total_spent: totalSpent,
                last_order_at: lastOrderDate,
                created_at: customer.first_seen_at,
                last_seen_at: customer.last_seen_at,
                referrer: customer.referrer
            }
        })

        return { success: true, users, count }
    } catch (error: any) {
        console.error("Error in getCustomers:", error)
        return { error: error.message }
    }
}

export async function updateCustomerStatus(customerId: string, status: "active" | "suspended" | "banned") {
    const adminUser = await ensureAdmin()
    const supabase = await createAdminClient()
    const head = await headers()
    const ip = head.get("x-forwarded-for") || head.get("x-real-ip")

    const originalCustomer = await supabase.from("customers").select("status").eq("id", customerId).single()

    const { error: updateError } = await supabase
        .from("customers")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", customerId)

    if (updateError) return { error: updateError.message }

    // Log to audit log (general) and admin_actions (specific)
    await createAuditLog(adminUser.id, `update_status_${status}`, "customers", customerId, { ip })

    // If it's a registered user, also update profile and force logout if banned
    const { data: customer } = await supabase.from("customers").select("user_id").eq("id", customerId).single()
    if (customer?.user_id) {
        await supabase.from("profiles").update({ status }).eq("id", customer.user_id)

        if (status === "banned") {
            await supabase.auth.admin.signOut(customer.user_id)
            await supabase.auth.admin.updateUserById(customer.user_id, { ban_duration: '876000h' })
        } else {
            await supabase.auth.admin.updateUserById(customer.user_id, { ban_duration: 'none' })
        }
    }

    // Admin action logging
    const { error: actionError } = await supabase
        .from("admin_actions")
        .insert({
            admin_id: adminUser.id,
            target_id: customerId,
            action: `status_change_${status}`,
            details: { previous_status: originalCustomer.data?.status },
            ip_address: ip
        })

    if (actionError) {
        // Rollback status change
        await supabase.from("customers").update({ status: originalCustomer.data?.status }).eq("id", customerId)
        if (customer?.user_id) {
            await supabase.from("profiles").update({ status: originalCustomer.data?.status }).eq("id", customer.user_id)
        }
        return { error: "Failed to log admin action, status reverted." }
    }

    revalidatePath("/admin/customers")
    return { success: true }
}

export async function updateCustomerRole(customerId: string, role: string) {
    const adminUser = await ensureAdmin()
    if (adminUser.id === customerId) return { error: "You cannot change your own role" }

    const supabase = await createAdminClient()

    // Safety check: Cannot demote the last admin
    if (role !== 'admin') {
        const { count } = await supabase
            .from("profiles")
            .select("*", { count: 'exact', head: true })
            .eq("role", "admin")

        if (count && count <= 1) {
            return { error: "Cannot remove the last administrator" }
        }
    }

    // Get user_id for the customer
    const { data: customer } = await supabase.from("customers").select("user_id").eq("id", customerId).single()
    if (!customer?.user_id) return { error: "Cannot change role of a non-registered customer" }

    const originalProfile = await supabase.from("profiles").select("role").eq("id", customer.user_id).single()

    const { error: updateError } = await supabase
        .from("profiles")
        .update({ role, updated_at: new Date().toISOString() })
        .eq("id", customer.user_id)

    if (updateError) return { error: updateError.message }

    await createAuditLog(adminUser.id, `update_role_${role}`, "profiles", customer.user_id)

    const { error: actionError } = await supabase
        .from("admin_actions")
        .insert({
            admin_id: adminUser.id,
            target_id: customerId, // Log against the customer ID, not user_id
            action: `role_change_${role}`,
            details: { previous_role: originalProfile.data?.role, user_id: customer.user_id }
        })

    if (actionError) {
        // Rollback
        await supabase.from("profiles").update({ role: originalProfile.data?.role }).eq("id", customer.user_id)
        return { error: "Failed to log role change, reverted." }
    }

    revalidatePath("/admin/customers")
    return { success: true }
}

export async function forceUserLogout(customerId: string) {
    const adminUser = await ensureAdmin()
    const supabase = await createAdminClient()

    const { data: customer } = await supabase.from("customers").select("user_id").eq("id", customerId).single()
    if (!customer?.user_id) return { error: "Cannot force logout for a non-registered customer" }

    const { error } = await supabase.auth.admin.signOut(customer.user_id)

    if (error) return { error: error.message }

    await createAuditLog(adminUser.id, "force_logout", "auth.users", customer.user_id)

    return { success: true }
}

export async function getCustomerDetails(customerId: string) {
    try {
        await ensureAdmin()
        const supabase = await createClient()

        const { data: customer, error: customerError } = await supabase
            .from("customers")
            .select(`
                *,
                profiles!customers_user_id_fkey(*),
                orders!orders_customer_email_fkey(id, total, status, created_at)
            `)
            .eq("id", customerId)
            .single()

        if (customerError) throw customerError

        const [ordersRes, logsRes, actionsRes] = await Promise.all([
            supabase.from("orders").select("*, payments(*), invoices(*)").eq("email", customer.email).order("created_at", { ascending: false }),
            supabase.from("audit_logs").select("*").eq("target_id", customerId).order("created_at", { ascending: false }).limit(20),
            supabase.from("admin_actions").select("*").eq("target_id", customerId).order("created_at", { ascending: false }).limit(20)
        ])

        return {
            success: true,
            customer,
            profile: customer.profiles,
            orders: ordersRes.data || [],
            activity: logsRes.data || [],
            adminActions: actionsRes.data || []
        }
    } catch (error: any) {
        console.error("Error in getCustomerDetails:", error)
        return { error: error.message }
    }
}

export async function updateCustomerBalance(customerId: string, balance: number) {
    const adminUser = await ensureAdmin()
    const supabase = await createAdminClient()

    const { error } = await supabase
        .from("customers")
        .update({ balance, updated_at: new Date().toISOString() })
        .eq("id", customerId)

    if (error) return { error: error.message }

    await createAuditLog(adminUser.id, "update_balance", "customers", customerId, { balance })

    revalidatePath("/admin/customers")
    return { success: true }
}
