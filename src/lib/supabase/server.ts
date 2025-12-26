import { createServerClient } from "@supabase/ssr"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

/**
 * Standard client for use in Server Components/Actions.
 * Tied to the user's session.
 */
export async function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const cookieStore = await cookies()

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error("[SERVER_CLIENT] Missing environment variables!", {
            hasUrl: !!supabaseUrl,
            hasKey: !!supabaseAnonKey,
            envKeys: Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC_'))
        });
        return createServerClient(
            supabaseUrl || 'http://localhost:54321',
            supabaseAnonKey || 'anon',
            { cookies: { getAll: () => cookieStore?.getAll?.() || [], setAll: () => { } } }
        )
    }

    return createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    try {
                        return cookieStore.getAll()
                    } catch (e) {
                        console.error("[SERVER_CLIENT] Error in cookieStore.getAll():", e);
                        return []
                    }
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // Called from Server Component - ignore
                    }
                },
            },
        }
    )
}

/**
 * Service Role Client - Bypasses RLS entirely.
 * Use for administrative tasks ONLY.
 */
export async function createServiceRoleClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error("Missing Supabase Service Role configuration")
    }

    return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}

/**
 * Legacy wrapper for createServiceRoleClient.
 */
export async function createAdminClient() {
    return createServiceRoleClient()
}
