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

        // 1. Fetch all profiles (Registered Users)
        const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select("*, orders:orders(id, total, created_at, status)")

        if (profilesError) throw profilesError

        // 2. Fetch all orders with emails (to capture Guests)
        const { data: allOrders, error: ordersError } = await supabase
            .from("orders")
            .select("id, email, total, created_at, status, user_id")
            .not("email", "is", null)

        if (ordersError) throw ordersError

        // 3. Merge Strategy
        const customerMap = new Map<string, any>()

        // Initialize with Profiles
        profiles.forEach((profile: any) => {
            if (!profile.email) return

            // Calculate stats from linked orders ( Supabase join )
            const pOrders = profile.orders || []
            const paidOrders = pOrders.filter((o: any) => ['paid', 'delivered', 'completed'].includes(o.status))
            const totalSpent = paidOrders.reduce((sum: number, o: any) => sum + Number(o.total), 0)
            const lastOrderDate = pOrders.length > 0 ? new Date(Math.max(...pOrders.map((o: any) => new Date(o.created_at).getTime()))).toISOString() : null

            customerMap.set(profile.email.toLowerCase(), {
                id: profile.id,
                email: profile.email,
                user_id: profile.id,
                full_name: profile.full_name,
                avatar_url: profile.avatar_url,
                role: profile.role || 'user',
                status: profile.status || 'active',
                is_registered: true,
                newsletter_subscribed: profile.newsletter_subscribed || false,
                balance: Number(profile.balance || 0),
                order_count: pOrders.length,
                total_spent: totalSpent,
                last_order_at: lastOrderDate,
                created_at: profile.created_at,
                last_seen_at: profile.last_seen_at || profile.updated_at,
                referrer: profile.referrer || 'Direct'
            })
        })

        // Process Orders to find Guests and update stats
        allOrders.forEach((order: any) => {
            if (!order.email) return
            const emailKey = order.email.toLowerCase()
            const isGuest = !order.user_id

            if (customerMap.has(emailKey)) {
                // Already exists (Profile or previously processed Guest)
                // Note: Profile fetch already included orders linked by user_id. 
                // But some orders might be linked by email only if logic allowed.
                // For safety/completeness, if we assume profile.orders captures everything via FK, we skip updating stats for profiles here.
                // BUT, if an order has email matching profile but user_id is null (guest checkout by registered user without logging in),
                // we might want to capture it.

                const existing = customerMap.get(emailKey)
                if (isGuest) {
                    // This order was not linked to the user via user_id, add it to stats
                    if (['paid', 'delivered', 'completed'].includes(order.status)) {
                        existing.total_spent += Number(order.total)
                    }
                    existing.order_count += 1
                    if (!existing.last_order_at || new Date(order.created_at) > new Date(existing.last_order_at)) {
                        existing.last_order_at = order.created_at
                    }
                }
            } else {
                // New Guest
                const isPaid = ['paid', 'delivered', 'completed'].includes(order.status)
                customerMap.set(emailKey, {
                    id: `guest_${emailKey}`, // Synthetic ID
                    email: order.email,
                    user_id: null,
                    full_name: null,
                    avatar_url: null,
                    role: 'guest',
                    status: 'active', // Guests are implicitly active
                    is_registered: false,
                    newsletter_subscribed: false,
                    balance: 0,
                    order_count: 1,
                    total_spent: isPaid ? Number(order.total) : 0,
                    last_order_at: order.created_at,
                    created_at: order.created_at, // First time we saw this email
                    last_seen_at: order.created_at,
                    referrer: 'Direct'
                })
            }
        })

        // 4. Convert to Array and Apply Filters
        let result = Array.from(customerMap.values())

        // Search
        if (search) {
            const lowerSearch = search.toLowerCase()
            result = result.filter(u =>
                u.email?.toLowerCase().includes(lowerSearch) ||
                u.full_name?.toLowerCase().includes(lowerSearch) ||
                u.id.toLowerCase().includes(lowerSearch)
            )
        }

        // Status Filter
        if (status !== "all") {
            result = result.filter(u => u.status === status)
        }

        // Sort (default created_at desc)
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        // Pagination
        const totalCount = result.length
        const paginatedUsers = result.slice((page - 1) * 20, page * 20)

        return { success: true, users: paginatedUsers, count: totalCount }
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
