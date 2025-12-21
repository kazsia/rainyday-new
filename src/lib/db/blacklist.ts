"use server"
import { createClient } from "@/lib/supabase/server"

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
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('blacklist')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error("[GET_BLACKLIST] Fetch error:", error)
            return []
        }
        return data as BlacklistEntry[]
    } catch (e) {
        console.error("[GET_BLACKLIST_CRITICAL]", e)
        return []
    }
}

export async function createBlacklistEntry(entry: Omit<BlacklistEntry, 'id' | 'created_at'>) {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('blacklist')
            .insert(entry)
            .select()
            .single()

        if (error) throw error
        return data as BlacklistEntry
    } catch (e) {
        console.error("[CREATE_BLACKLIST_ENTRY_CRITICAL]", e)
        throw e
    }
}

export async function deleteBlacklistEntry(id: string) {
    try {
        const supabase = await createClient()
        const { error } = await supabase
            .from('blacklist')
            .delete()
            .eq('id', id)

        if (error) throw error
        return true
    } catch (e) {
        console.error("[DELETE_BLACKLIST_ENTRY_CRITICAL]", e)
        throw e
    }
}
