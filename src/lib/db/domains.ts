"use server"
import { createClient } from "@/lib/supabase/server"

export type Domain = {
    id: string
    domain: string
    status: string
    ssl_status: string
    created_at: string
    updated_at: string
}

export async function getDomains() {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('domains')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error("[GET_DOMAINS] Fetch error:", error)
            return []
        }
        return data as Domain[]
    } catch (e) {
        console.error("[GET_DOMAINS_CRITICAL]", e)
        return []
    }
}

export async function addDomain(domain: string) {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('domains')
            .insert({ domain })
            .select()
            .single()

        if (error) throw error
        return data as Domain
    } catch (e) {
        console.error("[ADD_DOMAIN_CRITICAL]", e)
        throw e
    }
}

export async function deleteDomain(id: string) {
    try {
        const supabase = await createClient()
        const { error } = await supabase
            .from('domains')
            .delete()
            .eq('id', id)

        if (error) throw error
        return true
    } catch (e) {
        console.error("[DELETE_DOMAIN_CRITICAL]", e)
        throw e
    }
}

export async function refreshDomain(id: string) {
    try {
        const supabase = await createClient()
        const randomStatus = Math.random() > 0.5 ? 'verified' : 'pending'
        const randomSSL = Math.random() > 0.5 ? 'active' : 'pending'

        const { data, error } = await supabase
            .from('domains')
            .update({
                status: randomStatus,
                ssl_status: randomSSL,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data as Domain
    } catch (e) {
        console.error("[REFRESH_DOMAIN_CRITICAL]", e)
        throw e
    }
}
