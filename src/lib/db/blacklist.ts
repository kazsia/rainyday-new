import { createClient } from "@/lib/supabase/client"

export type BlacklistType = 'email' | 'ip' | 'user_agent' | 'discord' | 'asn' | 'country'
export type MatchType = 'exact' | 'regex'

export type BlacklistEntry = {
    id: string
    type: BlacklistType
    value: string
    match_type: MatchType
    reason: string | null
    created_at: string
}

export async function getBlacklist() {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('blacklist')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) throw error
    return data as BlacklistEntry[]
}

export async function createBlacklistEntry(entry: Omit<BlacklistEntry, 'id' | 'created_at'>) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('blacklist')
        .insert(entry)
        .select()
        .single()

    if (error) throw error
    return data as BlacklistEntry
}

export async function deleteBlacklistEntry(id: string) {
    const supabase = createClient()
    const { error } = await supabase
        .from('blacklist')
        .delete()
        .eq('id', id)

    if (error) throw error
    return true
}
