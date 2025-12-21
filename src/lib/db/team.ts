"use server"
import { createClient } from "@/lib/supabase/server"

export type TeamMember = {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    role: 'admin' | 'user'
    created_at: string
}

export async function getTeamMembers() {
    try {
        const supabase = await createClient()

        // Fetch profiles where role is 'admin'
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'admin')
            .order('created_at', { ascending: true })

        if (error) {
            console.error("[GET_TEAM_MEMBERS] Fetch error:", error)
            return []
        }

        return data as TeamMember[]
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
