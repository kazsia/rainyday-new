import { createClient } from "@/lib/supabase/client"

export type TeamMember = {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    role: 'admin' | 'user'
    created_at: string
}

export async function getTeamMembers() {
    const supabase = createClient()

    // Fetch profiles where role is 'admin'
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin')
        .order('created_at', { ascending: true })

    if (error) {
        throw error
    }

    return data as TeamMember[]
}

export async function inviteMember(email: string) {
    const supabase = createClient()

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
}
