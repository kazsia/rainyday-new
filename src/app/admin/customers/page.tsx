import { createClient, createAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import AdminCustomersView from "./customers-view"

export default async function AdminCustomersPageWrapper() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/auth")
    }

    // Role check
    const adminClient = await createAdminClient()
    const { data: profile } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

    if (profile?.role !== "admin") {
        // Redirection as per requirement
        redirect("/403")
    }

    return <AdminCustomersView />
}
