import { createClient } from "@/lib/supabase/client"

export type Domain = {
    id: string
    domain: string
    status: string
    ssl_status: string
    created_at: string
    updated_at: string
}

export async function getDomains() {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('domains')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) throw error
    return data as Domain[]
}

export async function addDomain(domain: string) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('domains')
        .insert({ domain })
        .select()
        .single()

    if (error) throw error
    return data as Domain
}

export async function deleteDomain(id: string) {
    const supabase = createClient()
    const { error } = await supabase
        .from('domains')
        .delete()
        .eq('id', id)

    if (error) throw error
    return true
}

export async function refreshDomain(id: string) {
    // In a real app, this would call Vercel/Cloudflare API to check domain status
    // For now, we simulate a random check
    const supabase = createClient()
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
}
