"use server"
import { createClient } from "@/lib/supabase/server"

export type TeamMember = {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    role: 'admin' | 'user'
    permissions: string[]
    created_at: string
}

const DEFAULT_PERMISSIONS = ["products", "orders", "customers", "settings", "team", "payments"]

export async function getTeamMembers(): Promise<TeamMember[]> {
    try {
        const supabase = await createClient()

        // Fetch profiles where role is 'admin'
        const { data, error } = await supabase
            .from('profiles')
            .select('id, email, full_name, avatar_url, role, created_at')
            .eq('role', 'admin')
            .order('created_at', { ascending: true })

        if (error) {
            console.error("[GET_TEAM_MEMBERS] Fetch error:", error)
            return []
        }

        // Return with default permissions (permissions column may not exist yet)
        return (data || []).map(member => ({
            ...member,
            permissions: DEFAULT_PERMISSIONS
        })) as TeamMember[]
    } catch (e) {
        console.error("[GET_TEAM_MEMBERS_CRITICAL]", e)
        return []
    }
}

export async function inviteMember(email: string) {
    try {
        const supabase = await createClient()

        // 1. Check if user exists in profiles
        const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select('id, role')
            .eq('email', email)
            .single()

        if (fetchError || !profile) {
            throw new Error("User not found. They must sign up first.")
        }

        if (profile.role === 'admin') {
            throw new Error("User is already an admin.")
        }

        // 2. Update status to admin
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', profile.id)

        if (updateError) {
            throw updateError
        }

        return true
    } catch (e) {
        console.error("[INVITE_MEMBER_CRITICAL]", e)
        throw e
    }
}

export async function removeMember(memberId: string) {
    try {
        const supabase = await createClient()

        // Get current user to prevent self-removal
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.id === memberId) {
            throw new Error("You cannot remove yourself from the team.")
        }

        // Demote user to regular user role
        const { error } = await supabase
            .from('profiles')
            .update({ role: 'user' })
            .eq('id', memberId)

        if (error) throw error
        return true
    } catch (e) {
        console.error("[REMOVE_MEMBER_CRITICAL]", e)
        throw e
    }
}

export async function updateMemberPermissions(memberId: string, permissions: string[]) {
    // For now, just log and return success
    // The permissions column needs to be added to the database first
    console.log(`[UPDATE_PERMISSIONS] Would update ${memberId} with permissions:`, permissions)

    // TODO: Once the permissions column is added to the database, uncomment this:
    // try {
    //     const supabase = await createClient()
    //     const { error } = await supabase
    //         .from('profiles')
    //         .update({ permissions })
    //         .eq('id', memberId)
    //     if (error) throw error
    //     return true
    // } catch (e) {
    //     console.error("[UPDATE_MEMBER_PERMISSIONS_CRITICAL]", e)
    //     throw e
    // }

    return true
}

export async function transferOwnership(newOwnerId: string) {
    try {
        const supabase = await createClient()

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error("Not authenticated")

        // Make sure the target is already an admin
        const { data: targetProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', newOwnerId)
            .single()

        if (!targetProfile || targetProfile.role !== 'admin') {
            throw new Error("Target user must be an admin to receive ownership.")
        }

        return true
    } catch (e) {
        console.error("[TRANSFER_OWNERSHIP_CRITICAL]", e)
        throw e
    }
}
